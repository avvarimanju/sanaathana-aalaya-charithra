"""
Unit tests for System Configuration Handler
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from decimal import Decimal

# Import the handler functions
from config_handler import (
    handle_config_request,
    list_configs,
    get_config,
    update_config,
    get_config_history,
    validate_config,
    validate_language_config,
    validate_bedrock_config,
    validate_polly_config,
    validate_payment_config,
    validate_session_config,
    validate_qr_config,
    notify_config_change,
    log_audit_entry,
)


@pytest.fixture
def mock_dynamodb_table():
    """Mock DynamoDB table"""
    with patch("config_handler.system_config_table") as mock_table:
        yield mock_table


@pytest.fixture
def mock_audit_table():
    """Mock audit log table"""
    with patch("config_handler.audit_log_table") as mock_table:
        yield mock_table


@pytest.fixture
def mock_eventbridge():
    """Mock EventBridge client"""
    with patch("config_handler.eventbridge") as mock_eb:
        yield mock_eb


@pytest.fixture
def sample_language_config():
    """Sample language configuration"""
    return {
        "configId": "LANGUAGES#supported",
        "category": "LANGUAGES",
        "settings": {
            "supportedLanguages": [
                {"code": "en", "name": "English", "enabled": True},
                {"code": "hi", "name": "Hindi", "enabled": True},
                {"code": "ta", "name": "Tamil", "enabled": True},
            ]
        },
        "updatedAt": "2024-01-01T00:00:00",
        "updatedBy": "admin-123",
        "version": 1,
    }


@pytest.fixture
def sample_bedrock_config():
    """Sample Bedrock configuration"""
    return {
        "configId": "BEDROCK#model",
        "category": "BEDROCK",
        "settings": {
            "modelId": "anthropic.claude-v2",
            "temperature": 0.7,
            "maxTokens": 4096,
            "topP": 0.9,
            "stopSequences": ["Human:", "Assistant:"],
        },
        "updatedAt": "2024-01-01T00:00:00",
        "updatedBy": "admin-123",
        "version": 1,
    }


@pytest.fixture
def sample_polly_config():
    """Sample Polly configuration"""
    return {
        "configId": "POLLY#voices",
        "category": "POLLY",
        "settings": {
            "voicesByLanguage": {
                "en": {"voiceId": "Joanna", "engine": "neural"},
                "hi": {"voiceId": "Aditi", "engine": "standard"},
                "ta": {"voiceId": "Kajal", "engine": "neural"},
            },
            "outputFormat": "mp3",
            "sampleRate": "22050",
        },
        "updatedAt": "2024-01-01T00:00:00",
        "updatedBy": "admin-123",
        "version": 1,
    }


class TestHandleConfigRequest:
    """Test handle_config_request routing"""
    
    def test_list_configs(self, mock_dynamodb_table):
        """Test listing configurations"""
        mock_dynamodb_table.scan.return_value = {"Items": []}
        
        result = handle_config_request(
            method="GET",
            path="/admin/config",
            body={},
            query_params={},
            user_id="admin-123"
        )
        
        assert "configurations" in result
        mock_dynamodb_table.scan.assert_called_once()
    
    def test_get_single_config(self, mock_dynamodb_table, sample_language_config):
        """Test getting single configuration"""
        mock_dynamodb_table.get_item.return_value = {"Item": sample_language_config}
        
        result = handle_config_request(
            method="GET",
            path="/admin/config/LANGUAGES#supported",
            body={},
            query_params={},
            user_id="admin-123"
        )
        
        assert "configuration" in result
        assert result["configuration"]["configId"] == "LANGUAGES#supported"
    
    def test_validate_config(self):
        """Test configuration validation"""
        result = handle_config_request(
            method="POST",
            path="/admin/config/validate",
            body={
                "category": "LANGUAGES",
                "settings": {
                    "supportedLanguages": [
                        {"code": "en", "name": "English", "enabled": True}
                    ]
                }
            },
            query_params={},
            user_id="admin-123"
        )
        
        assert "valid" in result
        assert result["valid"] is True


class TestListConfigs:
    """Test list_configs function"""
    
    def test_list_all_configs(self, mock_dynamodb_table, sample_language_config, sample_bedrock_config):
        """Test listing all configurations"""
        mock_dynamodb_table.scan.return_value = {
            "Items": [sample_language_config, sample_bedrock_config]
        }
        
        result = list_configs({})
        
        assert "configurations" in result
        assert len(result["configurations"]) == 2
        mock_dynamodb_table.scan.assert_called_once()
    
    def test_list_configs_with_category_filter(self, mock_dynamodb_table, sample_language_config):
        """Test listing configurations with category filter"""
        mock_dynamodb_table.scan.return_value = {"Items": [sample_language_config]}
        
        result = list_configs({"category": "LANGUAGES"})
        
        assert "configurations" in result
        assert len(result["configurations"]) == 1
        mock_dynamodb_table.scan.assert_called_once()


class TestGetConfig:
    """Test get_config function"""
    
    def test_get_existing_config(self, mock_dynamodb_table, sample_language_config):
        """Test getting existing configuration"""
        mock_dynamodb_table.get_item.return_value = {"Item": sample_language_config}
        
        result = get_config("LANGUAGES#supported")
        
        assert "configuration" in result
        assert result["configuration"]["configId"] == "LANGUAGES#supported"
    
    def test_get_nonexistent_config(self, mock_dynamodb_table):
        """Test getting non-existent configuration"""
        mock_dynamodb_table.get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Configuration not found"):
            get_config("NONEXISTENT#config")


class TestUpdateConfig:
    """Test update_config function"""
    
    def test_update_config_success(self, mock_dynamodb_table, mock_audit_table, mock_eventbridge, sample_language_config):
        """Test successful configuration update"""
        # Mock existing config
        mock_dynamodb_table.get_item.return_value = {"Item": sample_language_config}
        
        new_settings = {
            "supportedLanguages": [
                {"code": "en", "name": "English", "enabled": True},
                {"code": "hi", "name": "Hindi", "enabled": True},
            ]
        }
        
        result = update_config(
            "LANGUAGES#supported",
            {"settings": new_settings},
            "admin-456"
        )
        
        assert "configuration" in result
        assert result["configuration"]["version"] == 2
        assert result["configuration"]["updatedBy"] == "admin-456"
        mock_dynamodb_table.put_item.assert_called_once()
        mock_eventbridge.put_events.assert_called_once()
    
    def test_update_config_missing_settings(self):
        """Test update with missing settings field"""
        with pytest.raises(ValueError, match="Missing required field: settings"):
            update_config("LANGUAGES#supported", {}, "admin-123")
    
    def test_update_config_invalid_settings(self):
        """Test update with invalid settings"""
        invalid_settings = {
            "supportedLanguages": "not-a-list"  # Should be a list
        }
        
        with pytest.raises(ValueError, match="Invalid configuration"):
            update_config(
                "LANGUAGES#supported",
                {"settings": invalid_settings},
                "admin-123"
            )


class TestValidateConfig:
    """Test validate_config function"""
    
    def test_validate_language_config_valid(self):
        """Test valid language configuration"""
        result = validate_config({
            "category": "LANGUAGES",
            "settings": {
                "supportedLanguages": [
                    {"code": "en", "name": "English", "enabled": True}
                ]
            }
        })
        
        assert result["valid"] is True
        assert result["errors"] is None
    
    def test_validate_language_config_invalid(self):
        """Test invalid language configuration"""
        result = validate_config({
            "category": "LANGUAGES",
            "settings": {
                "supportedLanguages": "not-a-list"
            }
        })
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
    
    def test_validate_bedrock_config_valid(self):
        """Test valid Bedrock configuration"""
        result = validate_config({
            "category": "BEDROCK",
            "settings": {
                "modelId": "anthropic.claude-v2",
                "temperature": 0.7,
                "maxTokens": 4096,
            }
        })
        
        assert result["valid"] is True
    
    def test_validate_bedrock_config_invalid_temperature(self):
        """Test Bedrock config with invalid temperature"""
        result = validate_config({
            "category": "BEDROCK",
            "settings": {
                "modelId": "anthropic.claude-v2",
                "temperature": 1.5,  # Invalid: > 1
                "maxTokens": 4096,
            }
        })
        
        assert result["valid"] is False
        assert any("temperature" in error for error in result["errors"])
    
    def test_validate_polly_config_valid(self):
        """Test valid Polly configuration"""
        result = validate_config({
            "category": "POLLY",
            "settings": {
                "voicesByLanguage": {
                    "en": {"voiceId": "Joanna", "engine": "neural"}
                },
                "outputFormat": "mp3",
            }
        })
        
        assert result["valid"] is True
    
    def test_validate_payment_config_valid(self):
        """Test valid payment configuration"""
        result = validate_config({
            "category": "PAYMENT",
            "settings": {
                "razorpayKeyId": "rzp_test_123",
                "currency": "INR",
                "subscriptionPlans": [
                    {
                        "planId": "plan_1",
                        "name": "Basic",
                        "price": 99,
                        "duration": 30
                    }
                ]
            }
        })
        
        assert result["valid"] is True
    
    def test_validate_session_config_valid(self):
        """Test valid session configuration"""
        result = validate_config({
            "category": "SESSION",
            "settings": {
                "timeoutMinutes": 480,
                "mfaRequired": True,
            }
        })
        
        assert result["valid"] is True
    
    def test_validate_qr_config_valid(self):
        """Test valid QR configuration"""
        result = validate_config({
            "category": "QR",
            "settings": {
                "expirationDays": 365,
                "errorCorrectionLevel": "H",
            }
        })
        
        assert result["valid"] is True
    
    def test_validate_unknown_category(self):
        """Test validation with unknown category"""
        result = validate_config({
            "category": "UNKNOWN",
            "settings": {}
        })
        
        assert result["valid"] is False
        assert any("Unknown configuration category" in error for error in result["errors"])


class TestValidationFunctions:
    """Test individual validation functions"""
    
    def test_validate_language_config_empty_list(self):
        """Test language config with empty list"""
        errors = validate_language_config({
            "supportedLanguages": []
        })
        
        assert len(errors) > 0
        assert any("At least one language" in error for error in errors)
    
    def test_validate_bedrock_config_missing_fields(self):
        """Test Bedrock config with missing fields"""
        errors = validate_bedrock_config({
            "modelId": "anthropic.claude-v2"
        })
        
        assert len(errors) > 0
        assert any("temperature" in error for error in errors)
        assert any("maxTokens" in error for error in errors)
    
    def test_validate_polly_config_invalid_engine(self):
        """Test Polly config with invalid engine"""
        errors = validate_polly_config({
            "voicesByLanguage": {
                "en": {"voiceId": "Joanna", "engine": "invalid"}
            }
        })
        
        assert len(errors) > 0
        assert any("Invalid engine" in error for error in errors)
    
    def test_validate_payment_config_invalid_currency(self):
        """Test payment config with invalid currency"""
        errors = validate_payment_config({
            "razorpayKeyId": "rzp_test_123",
            "currency": "INVALID"  # Should be 3 letters
        })
        
        assert len(errors) > 0
        assert any("currency" in error for error in errors)
    
    def test_validate_session_config_invalid_timeout(self):
        """Test session config with invalid timeout"""
        errors = validate_session_config({
            "timeoutMinutes": 2000  # Too high
        })
        
        assert len(errors) > 0
        assert any("timeoutMinutes" in error for error in errors)
    
    def test_validate_qr_config_invalid_error_level(self):
        """Test QR config with invalid error correction level"""
        errors = validate_qr_config({
            "errorCorrectionLevel": "X"  # Invalid
        })
        
        assert len(errors) > 0
        assert any("errorCorrectionLevel" in error for error in errors)


class TestGetConfigHistory:
    """Test get_config_history function"""
    
    def test_get_config_history(self, mock_audit_table):
        """Test getting configuration history"""
        mock_audit_table.query.return_value = {
            "Items": [
                {
                    "auditId": "123-admin",
                    "timestamp": "2024-01-01T00:00:00",
                    "userId": "admin-123",
                    "action": "UPDATE_CONFIG",
                    "resource": "SystemConfiguration",
                    "resourceId": "LANGUAGES#supported",
                }
            ]
        }
        
        result = get_config_history("LANGUAGES#supported", {})
        
        assert "history" in result
        assert "pagination" in result
        assert len(result["history"]) == 1
    
    def test_get_config_history_with_pagination(self, mock_audit_table):
        """Test getting configuration history with pagination"""
        mock_audit_table.query.return_value = {"Items": []}
        
        result = get_config_history("LANGUAGES#supported", {"page": "2", "limit": "10"})
        
        assert result["pagination"]["page"] == 2
        assert result["pagination"]["limit"] == 10


class TestNotifyConfigChange:
    """Test notify_config_change function"""
    
    def test_notify_config_change_success(self, mock_eventbridge):
        """Test successful configuration change notification"""
        mock_eventbridge.put_events.return_value = {
            "FailedEntryCount": 0,
            "Entries": [{"EventId": "event-123"}]
        }
        
        # Should not raise exception
        notify_config_change(
            "LANGUAGES#supported",
            "LANGUAGES",
            {"supportedLanguages": []}
        )
        
        mock_eventbridge.put_events.assert_called_once()
    
    def test_notify_config_change_failure(self, mock_eventbridge):
        """Test configuration change notification failure"""
        mock_eventbridge.put_events.side_effect = Exception("EventBridge error")
        
        # Should not raise exception (graceful failure)
        notify_config_change(
            "LANGUAGES#supported",
            "LANGUAGES",
            {"supportedLanguages": []}
        )


class TestLogAuditEntry:
    """Test log_audit_entry function"""
    
    def test_log_audit_entry_success(self, mock_audit_table):
        """Test successful audit log entry"""
        # Should not raise exception
        log_audit_entry(
            user_id="admin-123",
            action="UPDATE_CONFIG",
            resource="SystemConfiguration",
            resource_id="LANGUAGES#supported",
            before={"old": "value"},
            after={"new": "value"}
        )
        
        mock_audit_table.put_item.assert_called_once()
    
    def test_log_audit_entry_failure(self, mock_audit_table):
        """Test audit log entry failure"""
        mock_audit_table.put_item.side_effect = Exception("DynamoDB error")
        
        # Should not raise exception (graceful failure)
        log_audit_entry(
            user_id="admin-123",
            action="UPDATE_CONFIG",
            resource="SystemConfiguration",
            resource_id="LANGUAGES#supported"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
