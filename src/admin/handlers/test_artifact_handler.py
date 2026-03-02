"""
Unit tests for artifact_handler.py

Basic tests to verify artifact CRUD operations.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from artifact_handler import (
    handle_artifact_request,
    list_artifacts,
    get_artifact,
    create_artifact,
    update_artifact,
    delete_artifact,
    generate_qr_code,
)


class TestArtifactHandler:
    """Test artifact handler functions"""
    
    @patch('artifact_handler.artifacts_table')
    def test_list_artifacts_basic(self, mock_table):
        """Test listing artifacts with basic parameters"""
        # Mock DynamoDB response
        mock_table.scan.return_value = {
            "Items": [
                {
                    "artifactId": "art-1",
                    "artifactName": "Test Artifact",
                    "siteId": "site-1",
                    "description": "Test description",
                    "deleted": False,
                    "createdAt": "2024-01-01T00:00:00",
                }
            ]
        }
        
        # Call function
        result = list_artifacts({"page": "1", "limit": "50"})
        
        # Assertions
        assert "artifacts" in result
        assert "pagination" in result
        assert len(result["artifacts"]) == 1
        assert result["artifacts"][0]["artifactName"] == "Test Artifact"
        assert result["pagination"]["total"] == 1
    
    @patch('artifact_handler.artifacts_table')
    def test_get_artifact_success(self, mock_table):
        """Test getting a single artifact"""
        # Mock DynamoDB response
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "art-1",
                "artifactName": "Test Artifact",
                "siteId": "site-1",
                "description": "Test description",
                "deleted": False,
            }
        }
        
        # Call function
        result = get_artifact("art-1")
        
        # Assertions
        assert "artifact" in result
        assert result["artifact"]["artifactId"] == "art-1"
    
    @patch('artifact_handler.artifacts_table')
    def test_get_artifact_not_found(self, mock_table):
        """Test getting a non-existent artifact"""
        # Mock DynamoDB response
        mock_table.get_item.return_value = {}
        
        # Call function and expect error
        with pytest.raises(ValueError, match="Artifact not found"):
            get_artifact("non-existent")
    
    @patch('artifact_handler.s3')
    @patch('artifact_handler.artifacts_table')
    @patch('artifact_handler.heritage_sites_table')
    @patch('artifact_handler.generate_qr_code')
    def test_create_artifact_success(self, mock_qr, mock_sites_table, mock_artifacts_table, mock_s3):
        """Test creating a new artifact"""
        # Mock temple exists
        mock_sites_table.get_item.return_value = {
            "Item": {
                "siteId": "site-1",
                "siteName": "Test Temple",
                "deleted": False,
            }
        }
        
        # Mock QR code generation
        mock_qr.return_value = ("QR-12345678", "https://s3.amazonaws.com/qr.png")
        
        # Mock artifact creation
        mock_artifacts_table.put_item.return_value = {}
        
        # Call function
        body = {
            "artifactName": "New Artifact",
            "siteId": "site-1",
            "description": "New artifact description",
        }
        result = create_artifact(body, "user-1")
        
        # Assertions
        assert "artifact" in result
        assert "qrCodeUrl" in result
        assert result["artifact"]["artifactName"] == "New Artifact"
        assert result["artifact"]["siteId"] == "site-1"
        assert "qrCode" in result["artifact"]
    
    @patch('artifact_handler.artifacts_table')
    def test_create_artifact_missing_fields(self, mock_table):
        """Test creating artifact with missing required fields"""
        body = {
            "artifactName": "New Artifact",
            # Missing siteId and description
        }
        
        with pytest.raises(ValueError, match="Missing required field"):
            create_artifact(body, "user-1")
    
    @patch('artifact_handler.artifacts_table')
    @patch('artifact_handler.invalidate_content_cache')
    def test_update_artifact_success(self, mock_invalidate, mock_table):
        """Test updating an artifact"""
        # Mock existing artifact
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "art-1",
                "artifactName": "Old Name",
                "siteId": "site-1",
                "deleted": False,
            }
        }
        
        # Mock update
        mock_table.update_item.return_value = {}
        
        # Mock get updated item
        mock_table.get_item.side_effect = [
            {
                "Item": {
                    "artifactId": "art-1",
                    "artifactName": "Old Name",
                    "siteId": "site-1",
                    "deleted": False,
                }
            },
            {
                "Item": {
                    "artifactId": "art-1",
                    "artifactName": "New Name",
                    "siteId": "site-1",
                    "deleted": False,
                }
            }
        ]
        
        # Call function
        body = {"artifactName": "New Name"}
        result = update_artifact("art-1", body, "user-1")
        
        # Assertions
        assert "artifact" in result
        assert result["artifact"]["artifactName"] == "New Name"
        mock_invalidate.assert_called_once_with("art-1")
    
    @patch('artifact_handler.artifacts_table')
    @patch('artifact_handler.invalidate_content_cache')
    def test_delete_artifact_success(self, mock_invalidate, mock_table):
        """Test soft deleting an artifact"""
        # Mock existing artifact
        mock_table.get_item.return_value = {
            "Item": {
                "artifactId": "art-1",
                "artifactName": "Test Artifact",
                "deleted": False,
            }
        }
        
        # Mock update
        mock_table.update_item.return_value = {}
        
        # Call function
        result = delete_artifact("art-1", "user-1")
        
        # Assertions
        assert result["message"] == "Artifact deleted successfully"
        assert result["artifactId"] == "art-1"
        mock_invalidate.assert_called_once_with("art-1")
    
    @patch('artifact_handler.qrcode.QRCode')
    @patch('artifact_handler.s3')
    def test_generate_qr_code(self, mock_s3, mock_qr_class):
        """Test QR code generation"""
        # Mock QR code
        mock_qr = MagicMock()
        mock_qr_class.return_value = mock_qr
        mock_img = MagicMock()
        mock_qr.make_image.return_value = mock_img
        
        # Mock S3 upload
        mock_s3.put_object.return_value = {}
        
        # Call function
        qr_id, qr_url = generate_qr_code("art-123")
        
        # Assertions
        assert qr_id.startswith("QR-")
        assert "art-123" in qr_id[:11]  # First 8 chars of artifact ID
        assert "s3.amazonaws.com" in qr_url
        mock_s3.put_object.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
