"""
Unit tests for Content Moderation Handler
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from decimal import Decimal

# Import handler functions
from moderation_handler import (
    handle_moderation_request,
    get_pending_content,
    get_content_details,
    approve_content,
    reject_content,
    edit_and_approve_content,
    get_moderation_stats,
    publish_to_content_cache,
)


# Mock AWS resources
@pytest.fixture(autouse=True)
def mock_dynamodb():
    with patch("moderation_handler.content_moderation_table") as mock_moderation, \
         patch("moderation_handler.content_cache_table") as mock_cache, \
         patch("moderation_handler.audit_log_table") as mock_audit:
        
        yield {
            "moderation": mock_moderation,
            "cache": mock_cache,
            "audit": mock_audit,
        }


# Sample test data
@pytest.fixture
def sample_pending_content():
    return {
        "contentId": "content-123",
        "artifactId": "artifact-456",
        "siteId": "site-789",
        "artifactName": "Test Artifact",
        "templeName": "Test Temple",
        "contentType": "TEXT",
        "languages": [
            {
                "code": "en",
                "content": "This is test content in English",
                "status": "PENDING"
            },
            {
                "code": "hi",
                "content": "यह हिंदी में परीक्षण सामग्री है",
                "status": "PENDING"
            }
        ],
        "generatedAt": "2024-01-15T10:00:00Z",
        "qualityScore": Decimal("0.85"),
        "autoApprovalEligible": False,
        "status": "PENDING"
    }


@pytest.fixture
def sample_high_quality_content():
    return {
        "contentId": "content-999",
        "artifactId": "artifact-999",
        "siteId": "site-999",
        "artifactName": "High Quality Artifact",
        "templeName": "Premium Temple",
        "contentType": "TEXT",
        "languages": [
            {
                "code": "en",
                "content": "High quality content",
                "status": "PENDING"
            }
        ],
        "generatedAt": "2024-01-15T11:00:00Z",
        "qualityScore": Decimal("0.95"),
        "autoApprovalEligible": True,
        "status": "PENDING"
    }


class TestHandleModerationRequest:
    """Test request routing"""
    
    def test_route_pending_content_list(self, mock_dynamodb):
        """Test routing to pending content list"""
        mock_dynamodb["moderation"].query.return_value = {"Items": []}
        
        result = handle_moderation_request(
            "GET",
            "/admin/moderation/pending",
            {},
            {"page": "1", "limit": "50"},
            "user-123"
        )
        
        assert "content" in result
        assert "pagination" in result
    
    def test_route_content_details(self, mock_dynamodb, sample_pending_content):
        """Test routing to content details"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        result = handle_moderation_request(
            "GET",
            "/admin/moderation/content-123",
            {},
            {},
            "user-123"
        )
        
        assert "content" in result
        assert result["content"]["contentId"] == "content-123"
    
    def test_route_approve_content(self, mock_dynamodb, sample_pending_content):
        """Test routing to approve content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = handle_moderation_request(
            "POST",
            "/admin/moderation/content-123/approve",
            {"feedback": "Looks good"},
            {},
            "user-123"
        )
        
        assert result["success"] is True
        assert "publishedContent" in result
    
    def test_route_reject_content(self, mock_dynamodb, sample_pending_content):
        """Test routing to reject content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        
        result = handle_moderation_request(
            "POST",
            "/admin/moderation/content-123/reject",
            {"feedback": "Needs improvement"},
            {},
            "user-123"
        )
        
        assert result["success"] is True
        assert result["feedback"] == "Needs improvement"
    
    def test_route_edit_content(self, mock_dynamodb, sample_pending_content):
        """Test routing to edit and approve content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = handle_moderation_request(
            "POST",
            "/admin/moderation/content-123/edit",
            {
                "editedContent": {"en": "Edited content"},
                "feedback": "Minor edits"
            },
            {},
            "user-123"
        )
        
        assert result["success"] is True
        assert "updatedContent" in result
    
    def test_route_moderation_stats(self, mock_dynamodb):
        """Test routing to moderation stats"""
        mock_dynamodb["moderation"].scan.return_value = {"Items": []}
        
        result = handle_moderation_request(
            "GET",
            "/admin/moderation/stats",
            {},
            {},
            "user-123"
        )
        
        assert "pending" in result
        assert "approved" in result
        assert "rejected" in result
    
    def test_invalid_request(self, mock_dynamodb):
        """Test invalid request raises error"""
        with pytest.raises(ValueError, match="Invalid moderation request"):
            handle_moderation_request(
                "DELETE",
                "/admin/moderation/content-123",
                {},
                {},
                "user-123"
            )


class TestGetPendingContent:
    """Test pending content listing"""
    
    def test_list_pending_content_basic(self, mock_dynamodb, sample_pending_content):
        """Test basic pending content listing"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content]
        }
        
        result = get_pending_content({"page": "1", "limit": "50"})
        
        assert len(result["content"]) == 1
        assert result["content"][0]["contentId"] == "content-123"
        assert result["pagination"]["total"] == 1
        
        # Verify query was called with correct parameters
        mock_dynamodb["moderation"].query.assert_called_once()
        call_args = mock_dynamodb["moderation"].query.call_args[1]
        assert call_args["IndexName"] == "StatusIndex"
        assert ":status" in call_args["ExpressionAttributeValues"]
        assert call_args["ExpressionAttributeValues"][":status"] == "PENDING"
    
    def test_filter_by_site_id(self, mock_dynamodb, sample_pending_content):
        """Test filtering by site ID"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content]
        }
        
        result = get_pending_content({
            "page": "1",
            "limit": "50",
            "siteId": "site-789"
        })
        
        assert len(result["content"]) == 1
        assert result["content"][0]["siteId"] == "site-789"
    
    def test_filter_by_artifact_id(self, mock_dynamodb, sample_pending_content):
        """Test filtering by artifact ID"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content]
        }
        
        result = get_pending_content({
            "page": "1",
            "limit": "50",
            "artifactId": "artifact-456"
        })
        
        assert len(result["content"]) == 1
        assert result["content"][0]["artifactId"] == "artifact-456"
    
    def test_filter_by_content_type(self, mock_dynamodb, sample_pending_content):
        """Test filtering by content type"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content]
        }
        
        result = get_pending_content({
            "page": "1",
            "limit": "50",
            "contentType": "TEXT"
        })
        
        assert len(result["content"]) == 1
        assert result["content"][0]["contentType"] == "TEXT"
    
    def test_filter_by_language(self, mock_dynamodb, sample_pending_content):
        """Test filtering by language"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content]
        }
        
        result = get_pending_content({
            "page": "1",
            "limit": "50",
            "language": "hi"
        })
        
        assert len(result["content"]) == 1
        assert any(lang["code"] == "hi" for lang in result["content"][0]["languages"])
    
    def test_sorting_by_quality_score(self, mock_dynamodb, sample_pending_content, sample_high_quality_content):
        """Test sorting by quality score and auto-approval eligibility"""
        mock_dynamodb["moderation"].query.return_value = {
            "Items": [sample_pending_content, sample_high_quality_content]
        }
        
        result = get_pending_content({"page": "1", "limit": "50"})
        
        # High quality content should be first
        assert len(result["content"]) == 2
        assert result["content"][0]["contentId"] == "content-999"
        assert result["content"][0]["autoApprovalEligible"] is True
    
    def test_pagination(self, mock_dynamodb, sample_pending_content):
        """Test pagination"""
        # Create multiple items
        items = [
            {**sample_pending_content, "contentId": f"content-{i}"}
            for i in range(100)
        ]
        mock_dynamodb["moderation"].query.return_value = {"Items": items}
        
        # Get page 2 with limit 50
        result = get_pending_content({"page": "2", "limit": "50"})
        
        assert len(result["content"]) == 50
        assert result["pagination"]["page"] == 2
        assert result["pagination"]["total"] == 100
        assert result["pagination"]["totalPages"] == 2
    
    def test_empty_results(self, mock_dynamodb):
        """Test empty results"""
        mock_dynamodb["moderation"].query.return_value = {"Items": []}
        
        result = get_pending_content({"page": "1", "limit": "50"})
        
        assert len(result["content"]) == 0
        assert result["pagination"]["total"] == 0


class TestGetContentDetails:
    """Test content details retrieval"""
    
    def test_get_existing_content(self, mock_dynamodb, sample_pending_content):
        """Test getting existing content details"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        result = get_content_details("content-123")
        
        assert result["content"]["contentId"] == "content-123"
        assert len(result["content"]["languages"]) == 2
        
        # Verify get_item was called correctly
        mock_dynamodb["moderation"].get_item.assert_called_once_with(
            Key={"contentId": "content-123"}
        )
    
    def test_get_nonexistent_content(self, mock_dynamodb):
        """Test getting non-existent content raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Content not found"):
            get_content_details("nonexistent-123")


class TestApproveContent:
    """Test content approval"""
    
    def test_approve_pending_content(self, mock_dynamodb, sample_pending_content):
        """Test approving pending content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = approve_content(
            "content-123",
            {"feedback": "Excellent content"},
            "reviewer-123"
        )
        
        assert result["success"] is True
        assert result["contentId"] == "content-123"
        assert "publishedContent" in result
        
        # Verify update was called
        mock_dynamodb["moderation"].update_item.assert_called_once()
        call_args = mock_dynamodb["moderation"].update_item.call_args[1]
        assert call_args["ExpressionAttributeValues"][":status"] == "APPROVED"
        assert call_args["ExpressionAttributeValues"][":reviewedBy"] == "reviewer-123"
        
        # Verify content was published to cache
        assert mock_dynamodb["cache"].put_item.call_count == 2  # 2 languages
    
    def test_approve_with_optional_feedback(self, mock_dynamodb, sample_pending_content):
        """Test approving without feedback"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = approve_content("content-123", {}, "reviewer-123")
        
        assert result["success"] is True
    
    def test_approve_nonexistent_content(self, mock_dynamodb):
        """Test approving non-existent content raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Content not found"):
            approve_content("nonexistent-123", {}, "reviewer-123")
    
    def test_approve_already_approved_content(self, mock_dynamodb, sample_pending_content):
        """Test approving already approved content raises error"""
        approved_content = {**sample_pending_content, "status": "APPROVED"}
        mock_dynamodb["moderation"].get_item.return_value = {"Item": approved_content}
        
        with pytest.raises(ValueError, match="not pending review"):
            approve_content("content-123", {}, "reviewer-123")


class TestRejectContent:
    """Test content rejection"""
    
    def test_reject_pending_content(self, mock_dynamodb, sample_pending_content):
        """Test rejecting pending content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        
        result = reject_content(
            "content-123",
            {"feedback": "Needs significant improvement"},
            "reviewer-123"
        )
        
        assert result["success"] is True
        assert result["contentId"] == "content-123"
        assert result["feedback"] == "Needs significant improvement"
        
        # Verify update was called
        mock_dynamodb["moderation"].update_item.assert_called_once()
        call_args = mock_dynamodb["moderation"].update_item.call_args[1]
        assert call_args["ExpressionAttributeValues"][":status"] == "REJECTED"
        assert call_args["ExpressionAttributeValues"][":reviewedBy"] == "reviewer-123"
    
    def test_reject_without_feedback(self, mock_dynamodb, sample_pending_content):
        """Test rejecting without feedback raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        with pytest.raises(ValueError, match="Feedback is required"):
            reject_content("content-123", {}, "reviewer-123")
    
    def test_reject_with_empty_feedback(self, mock_dynamodb, sample_pending_content):
        """Test rejecting with empty feedback raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        with pytest.raises(ValueError, match="Feedback is required"):
            reject_content("content-123", {"feedback": ""}, "reviewer-123")
    
    def test_reject_nonexistent_content(self, mock_dynamodb):
        """Test rejecting non-existent content raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Content not found"):
            reject_content("nonexistent-123", {"feedback": "Bad"}, "reviewer-123")
    
    def test_reject_already_rejected_content(self, mock_dynamodb, sample_pending_content):
        """Test rejecting already rejected content raises error"""
        rejected_content = {**sample_pending_content, "status": "REJECTED"}
        mock_dynamodb["moderation"].get_item.return_value = {"Item": rejected_content}
        
        with pytest.raises(ValueError, match="not pending review"):
            reject_content("content-123", {"feedback": "Bad"}, "reviewer-123")


class TestEditAndApproveContent:
    """Test content editing and approval"""
    
    def test_edit_and_approve_content(self, mock_dynamodb, sample_pending_content):
        """Test editing and approving content"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        edited_content = {
            "en": "This is edited English content",
            "hi": "यह संपादित हिंदी सामग्री है"
        }
        
        result = edit_and_approve_content(
            "content-123",
            {
                "editedContent": edited_content,
                "feedback": "Minor corrections made"
            },
            "reviewer-123"
        )
        
        assert result["success"] is True
        assert result["contentId"] == "content-123"
        assert "updatedContent" in result
        assert "publishedContent" in result
        
        # Verify update was called
        mock_dynamodb["moderation"].update_item.assert_called_once()
        call_args = mock_dynamodb["moderation"].update_item.call_args[1]
        assert call_args["ExpressionAttributeValues"][":status"] == "APPROVED"
        
        # Verify languages were updated
        updated_languages = call_args["ExpressionAttributeValues"][":languages"]
        assert updated_languages[0]["content"] == edited_content["en"]
        assert updated_languages[0]["edited"] is True
    
    def test_edit_partial_languages(self, mock_dynamodb, sample_pending_content):
        """Test editing only some languages"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        mock_dynamodb["moderation"].update_item.return_value = {}
        mock_dynamodb["cache"].put_item.return_value = {}
        
        # Only edit English
        edited_content = {"en": "Edited English only"}
        
        result = edit_and_approve_content(
            "content-123",
            {"editedContent": edited_content},
            "reviewer-123"
        )
        
        assert result["success"] is True
    
    def test_edit_without_edited_content(self, mock_dynamodb, sample_pending_content):
        """Test editing without editedContent raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        with pytest.raises(ValueError, match="editedContent is required"):
            edit_and_approve_content("content-123", {}, "reviewer-123")
    
    def test_edit_with_invalid_edited_content(self, mock_dynamodb, sample_pending_content):
        """Test editing with invalid editedContent type raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {"Item": sample_pending_content}
        
        with pytest.raises(ValueError, match="must be a dictionary"):
            edit_and_approve_content(
                "content-123",
                {"editedContent": "not a dict"},
                "reviewer-123"
            )
    
    def test_edit_nonexistent_content(self, mock_dynamodb):
        """Test editing non-existent content raises error"""
        mock_dynamodb["moderation"].get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Content not found"):
            edit_and_approve_content(
                "nonexistent-123",
                {"editedContent": {"en": "test"}},
                "reviewer-123"
            )


class TestGetModerationStats:
    """Test moderation statistics"""
    
    def test_get_stats_with_mixed_content(self, mock_dynamodb, sample_pending_content):
        """Test getting stats with mixed content statuses"""
        items = [
            {**sample_pending_content, "contentId": "c1", "status": "PENDING"},
            {**sample_pending_content, "contentId": "c2", "status": "PENDING"},
            {**sample_pending_content, "contentId": "c3", "status": "APPROVED"},
            {**sample_pending_content, "contentId": "c4", "status": "APPROVED"},
            {**sample_pending_content, "contentId": "c5", "status": "APPROVED"},
            {**sample_pending_content, "contentId": "c6", "status": "REJECTED"},
        ]
        mock_dynamodb["moderation"].scan.return_value = {"Items": items}
        
        result = get_moderation_stats()
        
        assert result["pending"] == 2
        assert result["approved"] == 3
        assert result["rejected"] == 1
        assert result["total"] == 6
    
    def test_get_stats_auto_approval_rate(self, mock_dynamodb, sample_pending_content, sample_high_quality_content):
        """Test auto-approval rate calculation"""
        items = [
            sample_pending_content,  # autoApprovalEligible: False
            sample_high_quality_content,  # autoApprovalEligible: True
            {**sample_high_quality_content, "contentId": "c3"},  # autoApprovalEligible: True
        ]
        mock_dynamodb["moderation"].scan.return_value = {"Items": items}
        
        result = get_moderation_stats()
        
        # 2 out of 3 are auto-approval eligible = 66.67%
        assert result["autoApprovalRate"] == 66.67
    
    def test_get_stats_empty_table(self, mock_dynamodb):
        """Test getting stats with empty table"""
        mock_dynamodb["moderation"].scan.return_value = {"Items": []}
        
        result = get_moderation_stats()
        
        assert result["pending"] == 0
        assert result["approved"] == 0
        assert result["rejected"] == 0
        assert result["total"] == 0
        assert result["autoApprovalRate"] == 0


class TestPublishToContentCache:
    """Test publishing content to cache"""
    
    def test_publish_multi_language_content(self, mock_dynamodb, sample_pending_content):
        """Test publishing content with multiple languages"""
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = publish_to_content_cache(sample_pending_content)
        
        assert result["artifactId"] == "artifact-456"
        assert result["contentType"] == "TEXT"
        assert len(result["publishedItems"]) == 2
        
        # Verify cache items were created
        assert mock_dynamodb["cache"].put_item.call_count == 2
        
        # Verify cache keys
        published_keys = [item["cacheKey"] for item in result["publishedItems"]]
        assert "artifact-456#en#TEXT" in published_keys
        assert "artifact-456#hi#TEXT" in published_keys
    
    def test_publish_with_audio_url(self, mock_dynamodb, sample_pending_content):
        """Test publishing content with audio URLs"""
        content_with_audio = {
            **sample_pending_content,
            "languages": [
                {
                    "code": "en",
                    "content": "Test content",
                    "audioUrl": "s3://bucket/audio-en.mp3",
                    "status": "APPROVED"
                }
            ]
        }
        mock_dynamodb["cache"].put_item.return_value = {}
        
        result = publish_to_content_cache(content_with_audio)
        
        assert result["artifactId"] == "artifact-456"
        
        # Verify audio URL was included in cache item
        call_args = mock_dynamodb["cache"].put_item.call_args[1]
        assert "s3Url" in call_args["Item"]
        assert call_args["Item"]["s3Url"] == "s3://bucket/audio-en.mp3"
    
    def test_publish_cache_key_format(self, mock_dynamodb, sample_pending_content):
        """Test cache key format is correct"""
        mock_dynamodb["cache"].put_item.return_value = {}
        
        publish_to_content_cache(sample_pending_content)
        
        # Get first call arguments
        first_call = mock_dynamodb["cache"].put_item.call_args_list[0][1]
        cache_item = first_call["Item"]
        
        # Verify cache key format: artifactId#language#contentType
        assert cache_item["cacheKey"] == "artifact-456#en#TEXT"
        assert "content" in cache_item
        assert "ttl" in cache_item
        assert "createdAt" in cache_item
        assert "metadata" in cache_item


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
