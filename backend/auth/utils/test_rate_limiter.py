"""
Unit tests for rate limiting logic.

Tests the RateLimiter class implementation including sliding window
rate limiting, attempt tracking, and DynamoDB integration.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

from auth.utils.rate_limiter import RateLimiter
from auth.config import AuthConfig, AuthErrorCode


class TestRateLimiter(unittest.TestCase):
    """Test cases for RateLimiter class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_dynamodb = Mock()
        self.rate_limiter = RateLimiter(dynamodb_client=self.mock_dynamodb)
        self.device_id = "test-device-123"
    
    def test_check_rate_limit_no_existing_record(self):
        """Test rate limit check when no record exists (first attempt)."""
        # Mock DynamoDB response - no existing record
        self.mock_dynamodb.get_item.return_value = {}
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        self.assertTrue(result["allowed"])
        self.assertEqual(result["remaining"], 4)  # 5 max - 1 current
        self.assertIn("reset_at", result)
        self.assertNotIn("error_code", result)
    
    def test_check_rate_limit_within_window_under_limit(self):
        """Test rate limit check within window with attempts remaining."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)  # 5 minutes ago
        
        # Mock DynamoDB response - 2 attempts in current window
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '2'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        self.assertTrue(result["allowed"])
        self.assertEqual(result["remaining"], 2)  # 5 max - 2 previous - 1 current
        self.assertIn("reset_at", result)
        self.assertNotIn("error_code", result)
    
    def test_check_rate_limit_at_limit(self):
        """Test rate limit check when limit is reached."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        
        # Mock DynamoDB response - 5 attempts (at limit)
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '5'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        self.assertFalse(result["allowed"])
        self.assertEqual(result["remaining"], 0)
        self.assertIn("reset_at", result)
        self.assertEqual(result["error_code"], AuthErrorCode.AUTH_RATE_LIMITED)
    
    def test_check_rate_limit_blocked(self):
        """Test rate limit check when device is blocked."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        blocked_until = current_time + timedelta(minutes=10)
        
        # Mock DynamoDB response - device is blocked
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '5'},
                'window_start': {'S': window_start.isoformat()},
                'blocked_until': {'S': blocked_until.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        self.assertFalse(result["allowed"])
        self.assertEqual(result["remaining"], 0)
        self.assertEqual(result["error_code"], AuthErrorCode.AUTH_RATE_LIMITED)
    
    def test_check_rate_limit_expired_window(self):
        """Test rate limit check when window has expired."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=20)  # 20 minutes ago (expired)
        
        # Mock DynamoDB response - old window with attempts
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '5'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        # Should allow since window expired
        self.assertTrue(result["allowed"])
        self.assertEqual(result["remaining"], 4)
        self.assertNotIn("error_code", result)
    
    def test_check_rate_limit_dynamodb_error(self):
        """Test rate limit check handles DynamoDB errors gracefully."""
        # Mock DynamoDB error
        self.mock_dynamodb.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ServiceUnavailable', 'Message': 'Service unavailable'}},
            'GetItem'
        )
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        
        # Should fail open (allow the attempt)
        self.assertTrue(result["allowed"])
        self.assertIn("remaining", result)
    
    def test_record_attempt_first_failure(self):
        """Test recording first failed attempt."""
        # Mock DynamoDB - no existing record
        self.mock_dynamodb.get_item.return_value = {}
        
        self.rate_limiter.record_attempt(self.device_id, success=False)
        
        # Verify put_item was called with correct structure
        self.mock_dynamodb.put_item.assert_called_once()
        call_args = self.mock_dynamodb.put_item.call_args
        item = call_args[1]['Item']
        
        self.assertEqual(item['device_id']['S'], self.device_id)
        self.assertEqual(item['attempt_count']['N'], '1')
        self.assertIn('window_start', item)
        self.assertIn('ttl', item)
    
    def test_record_attempt_increment_count(self):
        """Test recording subsequent failed attempts."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        
        # Mock DynamoDB - existing record with 2 attempts
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '2'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        self.rate_limiter.record_attempt(self.device_id, success=False)
        
        # Verify attempt count was incremented
        self.mock_dynamodb.put_item.assert_called_once()
        call_args = self.mock_dynamodb.put_item.call_args
        item = call_args[1]['Item']
        
        self.assertEqual(item['attempt_count']['N'], '3')
    
    def test_record_attempt_adds_block_at_limit(self):
        """Test that blocked_until is added when limit is reached."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        
        # Mock DynamoDB - 4 attempts (one more will hit limit)
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '4'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        self.rate_limiter.record_attempt(self.device_id, success=False)
        
        # Verify blocked_until was added
        call_args = self.mock_dynamodb.put_item.call_args
        item = call_args[1]['Item']
        
        self.assertEqual(item['attempt_count']['N'], '5')
        self.assertIn('blocked_until', item)
    
    def test_record_attempt_success_clears_record(self):
        """Test that successful attempt clears the rate limit record."""
        self.rate_limiter.record_attempt(self.device_id, success=True)
        
        # Verify delete_item was called
        self.mock_dynamodb.delete_item.assert_called_once()
        call_args = self.mock_dynamodb.delete_item.call_args
        
        self.assertEqual(
            call_args[1]['Key']['device_id']['S'],
            self.device_id
        )
    
    def test_record_attempt_expired_window_starts_new(self):
        """Test that expired window starts a new window."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=20)  # Expired
        
        # Mock DynamoDB - old window
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '5'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        self.rate_limiter.record_attempt(self.device_id, success=False)
        
        # Verify new window was started with count 1
        call_args = self.mock_dynamodb.put_item.call_args
        item = call_args[1]['Item']
        
        self.assertEqual(item['attempt_count']['N'], '1')
    
    def test_record_attempt_handles_dynamodb_error(self):
        """Test that DynamoDB errors are handled gracefully."""
        # Mock DynamoDB error
        self.mock_dynamodb.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ServiceUnavailable', 'Message': 'Service unavailable'}},
            'GetItem'
        )
        
        # Should not raise exception
        try:
            self.rate_limiter.record_attempt(self.device_id, success=False)
        except Exception as e:
            self.fail(f"record_attempt raised exception: {e}")
    
    def test_clear_rate_limit(self):
        """Test clearing rate limit record."""
        self.rate_limiter.clear_rate_limit(self.device_id)
        
        # Verify delete_item was called
        self.mock_dynamodb.delete_item.assert_called_once()
        call_args = self.mock_dynamodb.delete_item.call_args
        
        self.assertEqual(
            call_args[1]['Key']['device_id']['S'],
            self.device_id
        )
    
    def test_get_rate_limit_info_exists(self):
        """Test getting rate limit info when record exists."""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(minutes=5)
        
        # Mock DynamoDB response
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '3'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        info = self.rate_limiter.get_rate_limit_info(self.device_id)
        
        self.assertIsNotNone(info)
        self.assertEqual(info['device_id'], self.device_id)
        self.assertEqual(info['attempt_count'], 3)
        self.assertIn('window_start', info)
        self.assertIn('ttl', info)
    
    def test_get_rate_limit_info_not_exists(self):
        """Test getting rate limit info when no record exists."""
        # Mock DynamoDB - no record
        self.mock_dynamodb.get_item.return_value = {}
        
        info = self.rate_limiter.get_rate_limit_info(self.device_id)
        
        self.assertIsNone(info)
    
    def test_sliding_window_behavior(self):
        """Test sliding window behavior over time."""
        current_time = datetime.utcnow()
        
        # Simulate 3 attempts at start of window
        window_start = current_time - timedelta(minutes=5)
        self.mock_dynamodb.get_item.return_value = {
            'Item': {
                'device_id': {'S': self.device_id},
                'attempt_count': {'N': '3'},
                'window_start': {'S': window_start.isoformat()},
                'ttl': {'N': str(int((window_start + timedelta(seconds=900)).timestamp()))}
            }
        }
        
        result = self.rate_limiter.check_rate_limit(self.device_id)
        self.assertTrue(result["allowed"])
        self.assertEqual(result["remaining"], 1)  # 5 - 3 - 1 = 1
        
        # Simulate 5 attempts (at limit)
        self.mock_dynamodb.get_item.return_value['Item']['attempt_count']['N'] = '5'
        result = self.rate_limiter.check_rate_limit(self.device_id)
        self.assertFalse(result["allowed"])
        
        # Simulate window expiration (16 minutes later)
        old_window_start = current_time - timedelta(minutes=16)
        self.mock_dynamodb.get_item.return_value['Item']['window_start']['S'] = old_window_start.isoformat()
        result = self.rate_limiter.check_rate_limit(self.device_id)
        self.assertTrue(result["allowed"])  # Window expired, should allow


if __name__ == '__main__':
    unittest.main()
