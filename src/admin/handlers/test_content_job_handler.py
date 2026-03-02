"""
Unit tests for content job handler
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from content_job_handler import (
    handle_content_job_request,
    list_jobs,
    get_job_details,
    retry_job,
    cancel_job,
    get_job_stats,
    enrich_job_item,
)


@pytest.fixture
def mock_dynamodb_tables():
    """Mock DynamoDB tables"""
    with patch('content_job_handler.progress_table') as mock_progress, \
         patch('content_job_handler.artifacts_table') as mock_artifacts, \
         patch('content_job_handler.heritage_sites_table') as mock_sites:
        yield {
            'progress': mock_progress,
            'artifacts': mock_artifacts,
            'sites': mock_sites,
        }


@pytest.fixture
def mock_lambda_client():
    """Mock Lambda client"""
    with patch('content_job_handler.lambda_client') as mock_client:
        yield mock_client


@pytest.fixture
def sample_job_item():
    """Sample job item from DynamoDB"""
    return {
        "jobId": "job-123",
        "itemKey": "artifact-456#en#TEXT",
        "status": "COMPLETED",
        "startTime": "2024-01-01T10:00:00Z",
        "completionTime": "2024-01-01T10:05:00Z",
        "outputUrl": "https://s3.amazonaws.com/content/artifact-456/en/text.json",
        "metadata": {},
    }


@pytest.fixture
def sample_artifact():
    """Sample artifact from DynamoDB"""
    return {
        "artifactId": "artifact-456",
        "siteId": "site-789",
        "artifactName": "Test Artifact",
        "description": "Test description",
    }


@pytest.fixture
def sample_temple():
    """Sample temple from DynamoDB"""
    return {
        "siteId": "site-789",
        "siteName": "Test Temple",
        "stateLocation": "Karnataka",
    }


def test_handle_content_job_request_list(mock_dynamodb_tables):
    """Test listing jobs"""
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": []
    }
    
    result = handle_content_job_request(
        method="GET",
        path="/admin/content-jobs",
        body={},
        query_params={},
        user_id="user-123"
    )
    
    assert "jobs" in result
    assert "pagination" in result
    assert result["pagination"]["page"] == 1


def test_handle_content_job_request_stats(mock_dynamodb_tables):
    """Test getting job stats"""
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": [
            {"status": "COMPLETED"},
            {"status": "COMPLETED"},
            {"status": "FAILED"},
        ]
    }
    
    result = handle_content_job_request(
        method="GET",
        path="/admin/content-jobs/stats",
        body={},
        query_params={},
        user_id="user-123"
    )
    
    assert "total" in result
    assert "byStatus" in result
    assert "successRate" in result
    assert result["total"] == 3


def test_list_jobs_with_filters(mock_dynamodb_tables):
    """Test listing jobs with filters"""
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": [
            {
                "jobId": "job-123",
                "itemKey": "artifact-456#en#TEXT",
                "status": "COMPLETED",
                "startTime": "2024-01-01T10:00:00Z",
            }
        ]
    }
    
    mock_dynamodb_tables['artifacts'].get_item.return_value = {
        "Item": {
            "artifactId": "artifact-456",
            "siteId": "site-789",
            "artifactName": "Test Artifact",
        }
    }
    
    mock_dynamodb_tables['sites'].get_item.return_value = {
        "Item": {
            "siteId": "site-789",
            "siteName": "Test Temple",
        }
    }
    
    result = list_jobs({
        "page": "1",
        "limit": "10",
        "status": "COMPLETED",
    })
    
    assert "jobs" in result
    assert len(result["jobs"]) == 1
    assert result["jobs"][0]["status"] == "COMPLETED"


def test_get_job_details(mock_dynamodb_tables):
    """Test getting job details"""
    mock_dynamodb_tables['progress'].query.return_value = {
        "Items": [
            {
                "jobId": "job-123",
                "itemKey": "artifact-456#en#TEXT",
                "status": "COMPLETED",
                "startTime": "2024-01-01T10:00:00Z",
                "completionTime": "2024-01-01T10:05:00Z",
            },
            {
                "jobId": "job-123",
                "itemKey": "artifact-456#hi#TEXT",
                "status": "FAILED",
                "startTime": "2024-01-01T10:00:00Z",
                "completionTime": "2024-01-01T10:02:00Z",
                "error": {
                    "message": "Test error",
                    "stackTrace": "Test stack trace",
                }
            }
        ]
    }
    
    mock_dynamodb_tables['artifacts'].get_item.return_value = {
        "Item": {
            "artifactId": "artifact-456",
            "siteId": "site-789",
            "artifactName": "Test Artifact",
        }
    }
    
    mock_dynamodb_tables['sites'].get_item.return_value = {
        "Item": {
            "siteId": "site-789",
            "siteName": "Test Temple",
        }
    }
    
    result = get_job_details("job-123")
    
    assert "job" in result
    assert "logs" in result
    assert result["job"]["jobId"] == "job-123"
    assert result["job"]["summary"]["total"] == 2
    assert result["job"]["summary"]["completed"] == 1
    assert result["job"]["summary"]["failed"] == 1
    assert len(result["logs"]) == 1


def test_retry_job(mock_dynamodb_tables, mock_lambda_client):
    """Test retrying a failed job"""
    mock_dynamodb_tables['progress'].query.return_value = {
        "Items": [
            {
                "jobId": "job-123",
                "itemKey": "artifact-456#en#TEXT",
                "status": "FAILED",
            }
        ]
    }
    
    mock_lambda_client.invoke.return_value = {}
    
    result = retry_job("job-123", "user-123")
    
    assert "newJobId" in result
    assert "originalJobId" in result
    assert result["originalJobId"] == "job-123"
    assert result["itemsToRetry"] == 1
    
    # Verify Lambda was invoked
    mock_lambda_client.invoke.assert_called_once()


def test_retry_job_no_failed_items(mock_dynamodb_tables):
    """Test retrying a job with no failed items"""
    mock_dynamodb_tables['progress'].query.return_value = {
        "Items": []
    }
    
    with pytest.raises(ValueError, match="No failed items found"):
        retry_job("job-123", "user-123")


def test_cancel_job(mock_dynamodb_tables):
    """Test cancelling an in-progress job"""
    mock_dynamodb_tables['progress'].query.return_value = {
        "Items": [
            {
                "jobId": "job-123",
                "itemKey": "artifact-456#en#TEXT",
                "status": "IN_PROGRESS",
            }
        ]
    }
    
    mock_dynamodb_tables['progress'].update_item.return_value = {}
    
    result = cancel_job("job-123", "user-123")
    
    assert "jobId" in result
    assert "cancelledItems" in result
    assert result["cancelledItems"] == 1


def test_cancel_job_no_in_progress_items(mock_dynamodb_tables):
    """Test cancelling a job with no in-progress items"""
    mock_dynamodb_tables['progress'].query.return_value = {
        "Items": []
    }
    
    with pytest.raises(ValueError, match="No in-progress items found"):
        cancel_job("job-123", "user-123")


def test_get_job_stats(mock_dynamodb_tables):
    """Test getting job statistics"""
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": [
            {
                "status": "COMPLETED",
                "startTime": "2024-01-01T10:00:00Z",
                "completionTime": "2024-01-01T10:05:00Z",
            },
            {
                "status": "COMPLETED",
                "startTime": "2024-01-01T10:00:00Z",
                "completionTime": "2024-01-01T10:03:00Z",
            },
            {
                "status": "FAILED",
                "startTime": "2024-01-01T10:00:00Z",
                "completionTime": "2024-01-01T10:01:00Z",
            },
            {
                "status": "IN_PROGRESS",
                "startTime": "2024-01-01T10:00:00Z",
            },
        ]
    }
    
    result = get_job_stats()
    
    assert result["total"] == 4
    assert result["byStatus"]["COMPLETED"] == 2
    assert result["byStatus"]["FAILED"] == 1
    assert result["byStatus"]["IN_PROGRESS"] == 1
    assert result["successRate"] == 66.67  # 2 completed out of 3 finished


def test_enrich_job_item(mock_dynamodb_tables, sample_job_item, sample_artifact, sample_temple):
    """Test enriching job item with artifact and temple names"""
    mock_dynamodb_tables['artifacts'].get_item.return_value = {
        "Item": sample_artifact
    }
    
    mock_dynamodb_tables['sites'].get_item.return_value = {
        "Item": sample_temple
    }
    
    result = enrich_job_item(sample_job_item)
    
    assert result["artifactId"] == "artifact-456"
    assert result["language"] == "en"
    assert result["contentType"] == "TEXT"
    assert result["artifactName"] == "Test Artifact"
    assert result["siteId"] == "site-789"
    assert result["templeName"] == "Test Temple"
    assert "duration" in result


def test_enrich_job_item_missing_artifact(mock_dynamodb_tables, sample_job_item):
    """Test enriching job item when artifact is not found"""
    mock_dynamodb_tables['artifacts'].get_item.return_value = {}
    
    result = enrich_job_item(sample_job_item)
    
    assert result["artifactName"] == "Unknown"
    assert result["templeName"] == "Unknown"


def test_list_jobs_pagination(mock_dynamodb_tables):
    """Test job list pagination"""
    # Create 75 mock items
    items = []
    for i in range(75):
        items.append({
            "jobId": f"job-{i}",
            "itemKey": f"artifact-{i}#en#TEXT",
            "status": "COMPLETED",
            "startTime": f"2024-01-01T10:{i:02d}:00Z",
        })
    
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": items
    }
    
    mock_dynamodb_tables['artifacts'].get_item.return_value = {
        "Item": {
            "artifactId": "artifact-0",
            "siteId": "site-0",
            "artifactName": "Test Artifact",
        }
    }
    
    mock_dynamodb_tables['sites'].get_item.return_value = {
        "Item": {
            "siteId": "site-0",
            "siteName": "Test Temple",
        }
    }
    
    # Test first page
    result = list_jobs({"page": "1", "limit": "50"})
    assert len(result["jobs"]) == 50
    assert result["pagination"]["total"] == 75
    assert result["pagination"]["totalPages"] == 2
    
    # Test second page
    result = list_jobs({"page": "2", "limit": "50"})
    assert len(result["jobs"]) == 25


def test_list_jobs_multiple_status_filter(mock_dynamodb_tables):
    """Test listing jobs with multiple status filters"""
    mock_dynamodb_tables['progress'].scan.return_value = {
        "Items": [
            {
                "jobId": "job-1",
                "itemKey": "artifact-1#en#TEXT",
                "status": "COMPLETED",
                "startTime": "2024-01-01T10:00:00Z",
            },
            {
                "jobId": "job-2",
                "itemKey": "artifact-2#en#TEXT",
                "status": "FAILED",
                "startTime": "2024-01-01T10:00:00Z",
            }
        ]
    }
    
    mock_dynamodb_tables['artifacts'].get_item.return_value = {
        "Item": {
            "artifactId": "artifact-1",
            "siteId": "site-1",
            "artifactName": "Test Artifact",
        }
    }
    
    mock_dynamodb_tables['sites'].get_item.return_value = {
        "Item": {
            "siteId": "site-1",
            "siteName": "Test Temple",
        }
    }
    
    result = list_jobs({
        "status": "COMPLETED,FAILED",
    })
    
    assert len(result["jobs"]) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
