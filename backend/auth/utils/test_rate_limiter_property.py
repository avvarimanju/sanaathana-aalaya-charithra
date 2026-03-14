"""
Property-based tests for rate limiting enforcement.

This module contains property-based tests using the hypothesis library
to validate that rate limiting enforcement works correctly across all
possible device identifiers and timing scenarios.
"""

import unittest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from hypothesis import given, settings, strategies as st
from hypothesis.strategies import composite
from botocore.exceptions import ClientError

from auth.utils.rate_limiter import RateLimiter
from auth.config import AuthConfig, AuthErrorCode


# Custom strategies for property-based testing
@composite
def device_id_strategy(draw):
    """Generate valid device identifiers."""
    # Generate device IDs of various formats commonly used
    formats = [
        # UUID-like format
        st.text(alphabet='0123456789abcdef-', min_size=32, max_size=36),
        # Simple alphanumeric
        st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789', min_size=8, max_size=32),
        # With dashes and underscores
        st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789-_', min_size=10, max_size=40)
    ]
    return draw(st.one_of(formats))


@composite
def timing_scenario_strategy(draw):
    """Generate timing scenarios for rate limiting tests."""
    # Generate scenarios within and outside the 15-minute window
    base_time = datetime.utcnow()
    
    # Time offsets in seconds (some within window, some outside)
    time_offsets = draw(st.lists(
        st.integers(min_value=0, max_value=1800),  # 0 to 30 minutes
        min_size=1,
        max_size=10
    ))
    
    return base_time, time_offsets


class TestRateLimiterProperties(unittest.TestCase):
    """Property-based tests for RateLimiter class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_dynamodb = Mock()
        self.rate_limiter = RateLimiter(dynamodb_client=self.mock_dynamodb)
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_14_rate_limiting_enforcement(self, device_id):
        """
        **Validates: Requirements 10.3, 10.4**
        
        Property 14: Rate Limiting Enforcement
        
        For any device identifier, after making 5 failed authentication attempts 
        within a 15-minute window, the 6th attempt should be blocked and return 
        an error response with error code AUTH_RATE_LIMITED.
        """
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)  # Within 15-minute window
        
        # Test scenario 1: First 5 attempts should be allowed
        for attempt_count in range(1, 6):  # 1, 2, 3, 4, 5
            # Mock DynamoDB response for attempts 1-4 (under limit)
            if attempt_count < 5:
                self.mock_dynamodb.get_item.return_value = {
                    'Item': {
                        'device_id': {'S': device_id},
                        'attempt_count': {'N': str(attempt_count - 1)},
                        'window_start': {'S': window_start.isoformat()},
                        'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
                    }
                }
            else:
                # 5th attempt - at the limit but still allowed
                self.mock_dynamodb.get_item.return_value = {
                    'Item': {
                        'device_id': {'S': device_id},
                        'attempt_count': {'N': '4'},
                        'window_start': {'S': window_start.isoformat()},
                        'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
                    }
                }
            
            result = self.rate_limiter.check_rate_limit(device_id)
            
            # First 5 attempts should be allowed
            self.assertTrue(
                result["allowed"], 
                f"Attempt {attempt_count} should be allowed for device {device_id}"
            )
            self.assertNotIn(
                "error_code", 
                result, 
                f"Attempt {attempt_count} should not have error code for device {device_id}"
            )
        
        # Test scenario 2: 6th attempt should be blocked
        # Mock DynamoDB response showing 5 attempts already made
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': device_id},
                'attempt_count': {'N': '5'},  # Already at limit
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(device_id)
        
        # 6th attempt should be blocked
        self.assertFalse(
            result["allowed"], 
            f"6th attempt should be blocked for device {device_id}"
        )
        self.assertEqual(
            result["remaining"], 
            0, 
            f"Remaining attempts should be 0 for device {device_id}"
        )
        self.assertEqual(
            result["error_code"], 
            AuthErrorCode.AUTH_RATE_LIMITED,
            f"Error code should be AUTH_RATE_LIMITED for device {device_id}"
        )
        self.assertIn(
            "reset_at", 
            result, 
            f"Reset time should be provided for device {device_id}"
        )
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_rate_limiting_window_expiration(self, device_id):
        """
        Property: Rate limiting window expiration resets the counter.
        
        For any device identifier, if the 15-minute window expires,
        the rate limit counter should reset and allow new attempts.
        """
        current_time = datetime.utcnow()
        # Window that started 20 minutes ago (expired)
        expired_window_start = current_time - timedelta(minutes=20)
        
        # Mock DynamoDB response with expired window and 5 attempts
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': device_id},
                'attempt_count': {'N': '5'},  # Was at limit
                'window_start': {'S': expired_window_start.isoformat()},
                'ttl': {'N': str(int((expired_window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(device_id)
        
        # Should allow attempt since window expired
        self.assertTrue(
            result["allowed"], 
            f"Attempt should be allowed after window expiration for device {device_id}"
        )
        self.assertEqual(
            result["remaining"], 
            AuthConfig.RATE_LIMIT_MAX_ATTEMPTS - 1,
            f"Should have full attempts available after window expiration for device {device_id}"
        )
        self.assertNotIn(
            "error_code", 
            result, 
            f"Should not have error code after window expiration for device {device_id}"
        )
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_successful_attempt_clears_rate_limit(self, device_id):
        """
        Property: Successful authentication clears rate limit.
        
        For any device identifier, recording a successful authentication
        attempt should clear the rate limit record, allowing future attempts.
        """
        # Record a successful attempt
        self.rate_limiter.record_attempt(device_id, success=True)
        
        # Verify delete_item was called to clear the record
        self.mock_dynamodb.delete_item.assert_called_with(
            TableName=self.rate_limiter.table_name,
            Key={'device_id': {'S': device_id}}
        )
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_blocked_device_remains_blocked(self, device_id):
        """
        Property: Blocked device remains blocked until window expires.
        
        For any device identifier that is blocked due to rate limiting,
        subsequent attempts should continue to be blocked until the
        15-minute window expires.
        """
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        blocked_until = window_start + timedelta(seconds=900)  # 15 minutes from window start
        
        # Mock DynamoDB response showing blocked device
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': device_id},
                'attempt_count': {'N': '5'},
                'window_start': {'S': window_start.isoformat()},
                'blocked_until': {'S': blocked_until.isoformat()},
                'ttl': {'N': str(int(blocked_until.timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(device_id)
        
        # Should remain blocked
        self.assertFalse(
            result["allowed"], 
            f"Blocked device {device_id} should remain blocked"
        )
        self.assertEqual(
            result["error_code"], 
            AuthErrorCode.AUTH_RATE_LIMITED,
            f"Blocked device {device_id} should return AUTH_RATE_LIMITED"
        )
        self.assertEqual(
            result["remaining"], 
            0,
            f"Blocked device {device_id} should have 0 remaining attempts"
        )
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_rate_limit_sliding_window(self, device_id):
        """
        Property: Rate limiting uses sliding window correctly.
        
        For any device identifier, the rate limiting should use a sliding
        15-minute window, not a fixed window, to count attempts.
        """
        current_time = datetime.utcnow()
        
        # Test various window positions
        for minutes_ago in [1, 5, 10, 14, 16, 20]:
            window_start = current_time - timedelta(minutes=minutes_ago)
            
            # Mock DynamoDB response
            self.mock_dynamodb.get_item.return_value = {
                'Item': {
                    'device_id': {'S': device_id},
                    'attempt_count': {'N': '3'},
                    'window_start': {'S': window_start.isoformat()},
                    'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
                }
            }
            
            result = self.rate_limiter.check_rate_limit(device_id)
            
            if minutes_ago <= 15:
                # Within window - should count existing attempts
                self.assertTrue(
                    result["allowed"], 
                    f"Should be allowed within window for device {device_id} at {minutes_ago} minutes"
                )
                expected_remaining = AuthConfig.RATE_LIMIT_MAX_ATTEMPTS - 3 - 1  # 3 existing + 1 current
                self.assertEqual(
                    result["remaining"], 
                    expected_remaining,
                    f"Should have {expected_remaining} remaining for device {device_id} at {minutes_ago} minutes"
                )
            else:
                # Outside window - should reset
                self.assertTrue(
                    result["allowed"], 
                    f"Should be allowed outside window for device {device_id} at {minutes_ago} minutes"
                )
                expected_remaining = AuthConfig.RATE_LIMIT_MAX_ATTEMPTS - 1  # Fresh window
                self.assertEqual(
                    result["remaining"], 
                    expected_remaining,
                    f"Should have {expected_remaining} remaining for device {device_id} at {minutes_ago} minutes"
                )
    
    @settings(max_examples=100)
    @given(device_id=device_id_strategy())
    def test_property_rate_limit_graceful_error_handling(self, device_id):
        """
        Property: Rate limiter fails open on DynamoDB errors.
        
        For any device identifier, if DynamoDB operations fail,
        the rate limiter should fail open (allow the attempt)
        to maintain system availability.
        """
        # Mock DynamoDB error
        self.mock_dynamodb.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ServiceUnavailable', 'Message': 'Service unavailable'}},
            'GetItem'
        )
        
        result = self.rate_limiter.check_rate_limit(device_id)
        
        # Should fail open (allow the attempt)
        self.assertTrue(
            result["allowed"], 
            f"Should fail open on DynamoDB error for device {device_id}"
        )
        self.assertNotIn(
            "error_code", 
            result, 
            f"Should not have error code when failing open for device {device_id}"
        )
        self.assertIn(
            "remaining", 
            result, 
            f"Should provide remaining count when failing open for device {device_id}"
        )
    
    @settings(max_examples=50)
    @given(
        device_id=device_id_strategy(),
        attempt_counts=st.lists(
            st.integers(min_value=1, max_value=10), 
            min_size=1, 
            max_size=8
        )
    )
    def test_property_rate_limit_attempt_recording(self, device_id, attempt_counts):
        """
        Property: Failed attempts are recorded correctly.
        
        For any device identifier and sequence of failed attempts,
        the rate limiter should correctly increment the attempt counter
        and enforce the limit when reached.
        """
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=2)  # Recent window
        
        for i, count in enumerate(attempt_counts):
            # Limit count to reasonable range for testing
            count = min(count, 7)
            
            # Mock existing record
            if i == 0:
                # First call - no existing record
                self.mock_dynamodb.get_item.return_value = {}
            else:
                # Subsequent calls - existing record
                prev_count = min(attempt_counts[i-1], 7)
                self.mock_dynamodb.get_item.return_value = {
                    'Item': {
                        'device_id': {'S': device_id},
                        'attempt_count': {'N': str(prev_count)},
                        'window_start': {'S': window_start.isoformat()},
                        'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
                    }
                }
            
            # Record failed attempt
            self.rate_limiter.record_attempt(device_id, success=False)
            
            # Verify put_item was called
            self.mock_dynamodb.put_item.assert_called()
            
            # Check if blocked_until is added when limit reached
            call_args = self.mock_dynamodb.put_item.call_args
            if call_args:
                item = call_args[1]['Item']
                attempt_count = int(item['attempt_count']['N'])
                
                if attempt_count >= AuthConfig.RATE_LIMIT_MAX_ATTEMPTS:
                    self.assertIn(
                        'blocked_until', 
                        item, 
                        f"Should add blocked_until when limit reached for device {device_id}"
                    )
                else:
                    # May or may not have blocked_until depending on previous state
                    pass
            
            # Reset mock for next iteration
            self.mock_dynamodb.reset_mock()


if __name__ == '__main__':
    unittest.main()