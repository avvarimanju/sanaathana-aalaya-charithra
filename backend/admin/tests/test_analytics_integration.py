"""
Integration tests for analytics endpoints

Tests the full request flow through admin_api.py to analytics_handler.py
"""

import pytest
import json
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lambdas'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'handlers'))

from admin_api import handler, route_request


@pytest.fixture
def mock_dynamodb_tables():
    """Mock all DynamoDB tables"""
    with patch("analytics_handler.analytics_table") as mock_analytics, \
         patch("analytics_handler.heritage_sites_table") as mock_sites, \
         patch("analytics_handler.artifacts_table") as mock_artifacts, \
         patch("analytics_handler.content_cache_table") as mock_cache, \
         patch("analytics_handler.progress_table") as mock_progress, \
         patch("admin_api.dynamodb") as mock_admin_db:
        
        yield {
            "analytics": mock_analytics,
            "sites": mock_sites,
            "artifacts": mock_artifacts,
            "cache": mock_cache,
            "progress": mock_progress,
            "admin_db": mock_admin_db,
        }


@pytest.fixture
def mock_s3_client():
    """Mock S3 client"""
    with patch("analytics_handler.s3_client") as mock_s3:
        yield mock_s3


@pytest.fixture
def api_gateway_event():
    """Create a sample API Gateway event"""
    return {
        "httpMethod": "GET",
        "path": "/admin/analytics/summary",
        "body": None,
        "queryStringParameters": {},
        "requestContext": {
            "authorizer": {
                "userId": "user123",
                "email": "admin@example.com",
                "role": "SUPER_ADMIN"
            }
        }
    }


@pytest.fixture
def lambda_context():
    """Create a mock Lambda context"""
    context = Mock()
    context.request_id = "test-request-id-123"
    return context


class TestAnalyticsSummaryIntegration:
    """Test analytics summary endpoint integration"""
    
    def test_get_analytics_summary_success(self, api_gateway_event, lambda_context, mock_dynamodb_tables):
        """Test successful analytics summary request"""
        # Mock DynamoDB responses
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 10, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 50, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        # Mock audit table
        mock_audit_table = Mock()
        mock_dynamodb_tables["admin_db"].Table.return_value = mock_audit_table
        
        # Call handler
        response = handler(api_gateway_event, lambda_context)
        
        # Verify response
        assert response["statusCode"] == 200
        
        body = json.loads(response["body"])
        assert "summary" in body
        assert body["summary"]["totalTemples"] == 10
        assert body["summary"]["totalArtifacts"] == 50
        
        # Verify audit logging was called
        mock_audit_table.put_item.assert_called_once()


class TestQRScanAnalyticsIntegration:
    """Test QR scan analytics endpoint integration"""
    
    def test_get_qr_scan_analytics_success(self, api_gateway_event, lambda_context, mock_dynamodb_tables):
        """Test successful QR scan analytics request"""
        # Update event for QR scans endpoint
        api_gateway_event["path"] = "/admin/analytics/qr-scans"
        api_gateway_event["queryStringParameters"] = {"dateRange": "2024-01-01,2024-01-31"}
        
        # Mock DynamoDB responses
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "QR_SCAN", "siteId": "temple1", "artifactId": "artifact1", "date": "2024-01-15"},
                {"eventType": "QR_SCAN", "siteId": "temple1", "artifactId": "artifact2", "date": "2024-01-16"},
            ]
        }
        
        # Mock audit table
        mock_audit_table = Mock()
        mock_dynamodb_tables["admin_db"].Table.return_value = mock_audit_table
        
        # Call handler
        response = handler(api_gateway_event, lambda_context)
        
        # Verify response
        assert response["statusCode"] == 200
        
        body = json.loads(response["body"])
        assert "qrScans" in body
        assert body["qrScans"]["total"] == 2


class TestAnalyticsExportIntegration:
    """Test analytics export endpoint integration"""
    
    def test_export_analytics_csv_success(self, api_gateway_event, lambda_context, mock_dynamodb_tables, mock_s3_client):
        """Test successful analytics export request"""
        # Update event for export endpoint
        api_gateway_event["httpMethod"] = "POST"
        api_gateway_event["path"] = "/admin/analytics/export"
        api_gateway_event["body"] = json.dumps({
            "format": "CSV",
            "dataType": "summary",
            "filters": {}
        })
        
        # Mock DynamoDB responses
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        # Mock S3 operations
        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/export.csv"
        
        # Mock audit table
        mock_audit_table = Mock()
        mock_dynamodb_tables["admin_db"].Table.return_value = mock_audit_table
        
        # Call handler
        response = handler(api_gateway_event, lambda_context)
        
        # Verify response
        assert response["statusCode"] == 200
        
        body = json.loads(response["body"])
        assert "exportUrl" in body
        assert "expiresAt" in body
        assert body["format"] == "CSV"
        
        # Verify S3 operations
        mock_s3_client.put_object.assert_called_once()
        mock_s3_client.generate_presigned_url.assert_called_once()


class TestAnalyticsErrorHandling:
    """Test analytics error handling"""
    
    def test_invalid_analytics_request(self, api_gateway_event, lambda_context, mock_dynamodb_tables):
        """Test invalid analytics request returns 400"""
        # Update event for invalid endpoint
        api_gateway_event["httpMethod"] = "DELETE"
        api_gateway_event["path"] = "/admin/analytics/invalid"
        
        # Mock audit table
        mock_audit_table = Mock()
        mock_dynamodb_tables["admin_db"].Table.return_value = mock_audit_table
        
        # Call handler
        response = handler(api_gateway_event, lambda_context)
        
        # Verify error response
        assert response["statusCode"] == 400
        
        body = json.loads(response["body"])
        assert "error" in body
        assert body["error"] == "Validation Error"
    
    def test_export_invalid_format(self, api_gateway_event, lambda_context, mock_dynamodb_tables):
        """Test export with invalid format returns 400"""
        # Update event for export with invalid format
        api_gateway_event["httpMethod"] = "POST"
        api_gateway_event["path"] = "/admin/analytics/export"
        api_gateway_event["body"] = json.dumps({
            "format": "XML",
            "dataType": "summary",
            "filters": {}
        })
        
        # Mock audit table
        mock_audit_table = Mock()
        mock_dynamodb_tables["admin_db"].Table.return_value = mock_audit_table
        
        # Call handler
        response = handler(api_gateway_event, lambda_context)
        
        # Verify error response
        assert response["statusCode"] == 400
        
        body = json.loads(response["body"])
        assert "error" in body


class TestRouteRequest:
    """Test route_request function directly"""
    
    def test_route_analytics_summary(self, mock_dynamodb_tables):
        """Test routing to analytics summary"""
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        result = route_request(
            "GET",
            "/admin/analytics/summary",
            {},
            {},
            "user123",
            "admin@example.com",
            "SUPER_ADMIN"
        )
        
        assert "summary" in result
    
    def test_route_analytics_qr_scans(self, mock_dynamodb_tables):
        """Test routing to QR scans analytics"""
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        result = route_request(
            "GET",
            "/admin/analytics/qr-scans",
            {},
            {},
            "user123",
            "admin@example.com",
            "SUPER_ADMIN"
        )
        
        assert "qrScans" in result
    
    def test_route_analytics_export(self, mock_dynamodb_tables, mock_s3_client):
        """Test routing to analytics export"""
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/export.csv"
        
        result = route_request(
            "POST",
            "/admin/analytics/export",
            {"format": "CSV", "dataType": "summary", "filters": {}},
            {},
            "user123",
            "admin@example.com",
            "SUPER_ADMIN"
        )
        
        assert "exportUrl" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
