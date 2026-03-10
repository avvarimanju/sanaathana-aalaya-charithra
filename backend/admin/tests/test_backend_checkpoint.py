"""
Backend API Checkpoint Tests

Comprehensive tests to verify all implemented backend APIs are functional.
This includes authentication, temple management, and artifact management.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys
import os

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../lambdas'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../handlers'))

# Import handlers
from handlers.temple_handler import (
    handle_temple_request,
    list_temples,
    get_temple,
    create_temple,
    update_temple,
    delete_temple,
)
from handlers.artifact_handler import (
    handle_artifact_request,
    list_artifacts,
    get_artifact,
    create_artifact,
    update_artifact,
    delete_artifact,
    generate_qr_code,
)
from lambdas.admin_api import handler as api_handler, route_request
from lambdas.authorizer import handler as auth_handler, verify_token
from utils.rate_limiter import RateLimiter
from utils.session_manager import SessionManager


class TestAuthenticationSystem:
    """Test authentication and authorization system"""
    
    @patch('lambdas.authorizer.verify_token')
    @patch('lambdas.authorizer.get_admin_user')
    @patch('lambdas.authorizer.rate_limiter.check_rate_limit')
    @patch('lambdas.authorizer.session_manager.validate_session')
    def test_authorizer_with_valid_token(
        self, mock_validate, mock_rate_limit, mock_get_user, mock_verify
    ):
        """Test authorizer accepts valid token"""
        # Mock responses
        mock_verify.return_value = {
            "sub": "user123",
            "jti": "token123",
            "exp": 9999999999
        }
        mock_get_user.return_value = {
            "userId": "user123",
            "email": "admin@example.com",
            "role": "ADMIN",
            "status": "ACTIVE",
            "permissions": ["temples:read", "temples:write"]
        }
        mock_rate_limit.return_value = True
        mock_validate.return_value = True
        
        event = {
            "authorizationToken": "Bearer valid_token",
            "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples"
        }
        
        result = auth_handler(event, None)
        
        assert result["principalId"] == "user123"
        assert result["policyDocument"]["Statement"][0]["Effect"] == "Allow"
        assert result["context"]["email"] == "admin@example.com"
    
    @patch('lambdas.authorizer.verify_token')
    def test_authorizer_rejects_invalid_token(self, mock_verify):
        """Test authorizer rejects invalid token"""
        mock_verify.side_effect = Exception("Invalid token")
        
        event = {
            "authorizationToken": "Bearer invalid_token",
            "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/admin/temples"
        }
        
        result = auth_handler(event, None)
        
        assert result["policyDocument"]["Statement"][0]["Effect"] == "Deny"
    
    def test_rate_limiter_initialization(self):
        """Test rate limiter can be initialized"""
        limiter = RateLimiter("test-table")
        assert limiter.max_requests == 100
        assert limiter.window_seconds == 60
    
    def test_session_manager_initialization(self):
        """Test session manager can be initialized"""
        manager = SessionManager("test-table")
        assert manager.session_timeout_hours == 8


class TestTempleManagement:
    """Test temple management endpoints"""
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_list_temples(self, mock_table):
        """Test listing temples with pagination"""
        mock_table.scan.return_value = {
            "Items": [
                {
                    "siteId": "temple1",
                    "siteName": "Test Temple 1",
                    "stateLocation": "Karnataka",
                    "description": "Test description",
                    "deleted": False
                },
                {
                    "siteId": "temple2",
                    "siteName": "Test Temple 2",
                    "stateLocation": "Tamil Nadu",
                    "description": "Another temple",
                    "deleted": False
                }
            ]
        }
        
        result = list_temples({"page": "1", "limit": "10"})
        
        assert "temples" in result
        assert "pagination" in result
        assert len(result["temples"]) == 2
        assert result["pagination"]["total"] == 2
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_get_temple(self, mock_table):
        """Test getting single temple"""
        mock_table.get_item.return_value = {
            "Item": {
                "siteId": "temple1",
                "siteName": "Test Temple",
                "stateLocation": "Karnataka",
                "deleted": False
            }
        }
        
        result = get_temple("temple1")
        
        assert "temple" in result
        assert result["temple"]["siteId"] == "temple1"
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_create_temple(self, mock_table):
        """Test creating new temple"""
        mock_table.put_item.return_value = {}
        
        temple_data = {
            "siteName": "New Temple",
            "stateLocation": "Karnataka",
            "description": "A new temple"
        }
        
        result = create_temple(temple_data, "user123")
        
        assert "temple" in result
        assert result["temple"]["siteName"] == "New Temple"
        assert result["message"] == "Temple created successfully"
        mock_table.put_item.assert_called_once()
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_update_temple(self, mock_table):
        """Test updating temple"""
        mock_table.get_item.return_value = {
            "Item": {
                "siteId": "temple1",
                "siteName": "Old Name",
                "deleted": False
            }
        }
        mock_table.update_item.return_value = {}
        
        # Second call for getting updated item
        mock_table.get_item.side_effect = [
            {"Item": {"siteId": "temple1", "siteName": "Old Name", "deleted": False}},
            {"Item": {"siteId": "temple1", "siteName": "New Name", "deleted": False}}
        ]
        
        result = update_temple("temple1", {"siteName": "New Name"}, "user123")
        
        assert "temple" in result
        assert result["message"] == "Temple updated successfully"
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_delete_temple_soft_delete(self, mock_table):
        """Test soft delete of temple"""
        mock_table.get_item.return_value = {
            "Item": {
                "siteId": "temple1",
                "siteName": "Test Temple",
                "deleted": False
            }
        }
        mock_table.update_item.return_value = {}
        
        result = delete_temple("temple1", "user123")
        
        assert result["message"] == "Temple deleted successfully"
        assert result["siteId"] == "temple1"
        
        # Verify soft delete was called
        call_args = mock_table.update_item.call_args
        assert "deleted" in str(call_args)


class TestArtifactManagement:
    """Test artifact management endpoints"""
    
    @patch('handlers.artifact_handler.artifacts_table')
    def test_list_artifacts(self, mock_table):
        """Test listing artifacts with pagination"""
        mock_table.scan.return_value = {
            "Items": [
                {
                    "artifactId": "artifact1",
                    "artifactName": "Test Artifact 1",
                    "siteId": "temple1",
                    "description": "Test description",
                    "deleted": False
                },
                {
                    "artifactId": "artifact2",
                    "artifactName": "Test Artifact 2",
                    "siteId": "temple1",
                    "description": "Another artifact",
                    "deleted": False
                }
            ]
        }
        
        result = list_artifacts({"page": "1", "limit": "10"})
        
        assert "artifacts" in result
        assert "pagination" in result
        assert len(result["artifacts"]) == 2
        assert result["pagination"]["total"] == 2
    
    @patch('handlers.artifact_handler.artifacts_table')
    def test_get_artifact(self, mock_table):
        """Test getting single artifact"""
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "artifact1",
                "artifactName": "Test Artifact",
                "siteId": "temple1",
                "deleted": False
            }
        }
        
        result = get_artifact("artifact1")
        
        assert "artifact" in result
        assert result["artifact"]["artifactId"] == "artifact1"
    
    @patch('handlers.artifact_handler.artifacts_table')
    @patch('handlers.artifact_handler.heritage_sites_table')
    @patch('handlers.artifact_handler.generate_qr_code')
    def test_create_artifact_with_qr_code(self, mock_qr, mock_sites, mock_artifacts):
        """Test creating artifact with QR code generation"""
        # Mock temple exists
        mock_sites.get_item.return_value = {
            "Item": {
                "siteId": "temple1",
                "siteName": "Test Temple",
                "deleted": False
            }
        }
        
        # Mock QR code generation
        mock_qr.return_value = ("QR-12345678-ABCD1234", "https://s3.amazonaws.com/qr.png")
        
        mock_artifacts.put_item.return_value = {}
        
        artifact_data = {
            "artifactName": "New Artifact",
            "siteId": "temple1",
            "description": "A new artifact"
        }
        
        result = create_artifact(artifact_data, "user123")
        
        assert "artifact" in result
        assert "qrCodeUrl" in result
        assert result["artifact"]["artifactName"] == "New Artifact"
        assert result["artifact"]["qrCode"] == "QR-12345678-ABCD1234"
        assert result["message"] == "Artifact created successfully with QR code"
        mock_qr.assert_called_once()
    
    @patch('handlers.artifact_handler.artifacts_table')
    @patch('handlers.artifact_handler.invalidate_content_cache')
    def test_update_artifact_invalidates_cache(self, mock_invalidate, mock_table):
        """Test updating artifact invalidates content cache"""
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "artifact1",
                "artifactName": "Old Name",
                "deleted": False
            }
        }
        mock_table.update_item.return_value = {}
        
        # Second call for getting updated item
        mock_table.get_item.side_effect = [
            {"Item": {"artifactId": "artifact1", "artifactName": "Old Name", "deleted": False}},
            {"Item": {"artifactId": "artifact1", "artifactName": "New Name", "deleted": False}}
        ]
        
        result = update_artifact("artifact1", {"artifactName": "New Name"}, "user123")
        
        assert "artifact" in result
        mock_invalidate.assert_called_once_with("artifact1")
    
    @patch('handlers.artifact_handler.artifacts_table')
    @patch('handlers.artifact_handler.invalidate_content_cache')
    def test_delete_artifact_soft_delete(self, mock_invalidate, mock_table):
        """Test soft delete of artifact"""
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "artifact1",
                "artifactName": "Test Artifact",
                "deleted": False
            }
        }
        mock_table.update_item.return_value = {}
        
        result = delete_artifact("artifact1", "user123")
        
        assert result["message"] == "Artifact deleted successfully"
        assert result["artifactId"] == "artifact1"
        mock_invalidate.assert_called_once_with("artifact1")
    
    @patch('handlers.artifact_handler.s3')
    @patch('handlers.artifact_handler.qrcode.QRCode')
    def test_qr_code_generation(self, mock_qrcode_class, mock_s3):
        """Test QR code generation"""
        # Mock QR code
        mock_qr = MagicMock()
        mock_qrcode_class.return_value = mock_qr
        
        mock_img = MagicMock()
        mock_qr.make_image.return_value = mock_img
        
        mock_s3.put_object.return_value = {}
        
        qr_id, qr_url = generate_qr_code("artifact123")
        
        assert qr_id.startswith("QR-")
        assert "artifact123" in qr_url
        assert qr_url.startswith("https://")
        mock_s3.put_object.assert_called_once()


class TestAPIRouting:
    """Test API Gateway routing"""
    
    @patch('lambdas.admin_api.handle_temple_request')
    def test_route_temple_request(self, mock_handler):
        """Test routing temple requests"""
        mock_handler.return_value = {"temples": []}
        
        result = route_request(
            "GET",
            "/admin/temples",
            {},
            {},
            "user123",
            "admin@example.com",
            "ADMIN"
        )
        
        mock_handler.assert_called_once()
    
    @patch('lambdas.admin_api.handle_artifact_request')
    def test_route_artifact_request(self, mock_handler):
        """Test routing artifact requests"""
        mock_handler.return_value = {"artifacts": []}
        
        result = route_request(
            "GET",
            "/admin/artifacts",
            {},
            {},
            "user123",
            "admin@example.com",
            "ADMIN"
        )
        
        mock_handler.assert_called_once()
    
    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        result = route_request(
            "GET",
            "/admin/health",
            {},
            {},
            "user123",
            "admin@example.com",
            "ADMIN"
        )
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert result["user"] == "admin@example.com"


class TestAuditLogging:
    """Test audit logging functionality"""
    
    @patch('lambdas.admin_api.dynamodb')
    @patch('lambdas.admin_api.log_audit_trail')
    @patch('lambdas.admin_api.route_request')
    def test_audit_log_on_success(self, mock_route, mock_log, mock_db):
        """Test audit log is created on successful request"""
        mock_route.return_value = {"message": "Success"}
        
        event = {
            "httpMethod": "POST",
            "path": "/admin/temples",
            "body": json.dumps({"siteName": "Test"}),
            "queryStringParameters": {},
            "requestContext": {
                "authorizer": {
                    "userId": "user123",
                    "email": "admin@example.com",
                    "role": "ADMIN"
                }
            }
        }
        
        context = Mock()
        context.request_id = "req123"
        
        result = api_handler(event, context)
        
        assert result["statusCode"] == 200
        mock_log.assert_called_once()


class TestErrorHandling:
    """Test error handling"""
    
    @patch('handlers.temple_handler.heritage_sites_table')
    def test_temple_not_found_error(self, mock_table):
        """Test error when temple not found"""
        mock_table.get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Temple not found"):
            get_temple("nonexistent")
    
    @patch('handlers.artifact_handler.artifacts_table')
    def test_artifact_not_found_error(self, mock_table):
        """Test error when artifact not found"""
        mock_table.get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Artifact not found"):
            get_artifact("nonexistent")
    
    def test_create_temple_missing_required_fields(self):
        """Test error when creating temple without required fields"""
        with pytest.raises(ValueError, match="Missing required field"):
            create_temple({}, "user123")
    
    def test_create_artifact_missing_required_fields(self):
        """Test error when creating artifact without required fields"""
        with pytest.raises(ValueError, match="Missing required field"):
            create_artifact({}, "user123")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
