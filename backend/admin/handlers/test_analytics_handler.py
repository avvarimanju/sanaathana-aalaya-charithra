"""
Unit tests for analytics handler

Tests analytics query endpoints and export functionality.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime, timedelta

# Import the handler
from analytics_handler import (
    handle_analytics_request,
    get_analytics_summary,
    get_qr_scan_analytics,
    get_content_generation_analytics,
    get_language_usage_analytics,
    get_geographic_analytics,
    get_audio_playback_analytics,
    get_qa_interaction_analytics,
    export_analytics_data,
    convert_to_csv,
)


@pytest.fixture
def mock_dynamodb_tables():
    """Mock DynamoDB tables"""
    with patch("analytics_handler.analytics_table") as mock_analytics, \
         patch("analytics_handler.heritage_sites_table") as mock_sites, \
         patch("analytics_handler.artifacts_table") as mock_artifacts, \
         patch("analytics_handler.content_cache_table") as mock_cache, \
         patch("analytics_handler.progress_table") as mock_progress:
        
        yield {
            "analytics": mock_analytics,
            "sites": mock_sites,
            "artifacts": mock_artifacts,
            "cache": mock_cache,
            "progress": mock_progress,
        }


@pytest.fixture
def mock_s3_client():
    """Mock S3 client"""
    with patch("analytics_handler.s3_client") as mock_s3:
        yield mock_s3


class TestAnalyticsSummary:
    """Test analytics summary endpoint"""
    
    def test_get_analytics_summary_returns_all_metrics(self, mock_dynamodb_tables):
        """Test that summary includes all required metrics"""
        # Mock temple count
        mock_dynamodb_tables["sites"].scan.return_value = {
            "Count": 10,
            "Items": []
        }
        
        # Mock artifact count
        mock_dynamodb_tables["artifacts"].scan.return_value = {
            "Count": 50,
            "Items": []
        }
        
        # Mock analytics for users
        now = datetime.utcnow()
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"userId": "user1", "date": now.strftime("%Y-%m-%d")},
                {"userId": "user2", "date": (now - timedelta(days=2)).strftime("%Y-%m-%d")},
                {"userId": "user3", "date": (now - timedelta(days=10)).strftime("%Y-%m-%d")},
                {"userId": "user1", "date": (now - timedelta(days=15)).strftime("%Y-%m-%d")},
            ]
        }
        
        result = get_analytics_summary()
        
        assert "summary" in result
        summary = result["summary"]
        assert summary["totalTemples"] == 10
        assert summary["totalArtifacts"] == 50
        assert summary["totalUsers"] == 3
        assert "activeUsers" in summary
        assert "daily" in summary["activeUsers"]
        assert "weekly" in summary["activeUsers"]
        assert "monthly" in summary["activeUsers"]


class TestQRScanAnalytics:
    """Test QR scan analytics endpoint"""
    
    def test_get_qr_scan_analytics_without_filters(self, mock_dynamodb_tables):
        """Test QR scan analytics without filters"""
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "QR_SCAN", "siteId": "temple1", "artifactId": "artifact1", "date": "2024-01-01"},
                {"eventType": "QR_SCAN", "siteId": "temple1", "artifactId": "artifact2", "date": "2024-01-02"},
                {"eventType": "QR_SCAN", "siteId": "temple2", "artifactId": "artifact3", "date": "2024-01-03"},
            ]
        }
        
        result = get_qr_scan_analytics({})
        
        assert "qrScans" in result
        qr_scans = result["qrScans"]
        assert qr_scans["total"] == 3
        assert "temple1" in qr_scans["byTemple"]
        assert qr_scans["byTemple"]["temple1"] == 2
        assert "artifact1" in qr_scans["byArtifact"]
        assert len(qr_scans["trend"]) > 0
    
    def test_get_qr_scan_analytics_with_date_filter(self, mock_dynamodb_tables):
        """Test QR scan analytics with date range filter"""
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "QR_SCAN", "siteId": "temple1", "artifactId": "artifact1", "date": "2024-01-15"},
            ]
        }
        
        result = get_qr_scan_analytics({"dateRange": "2024-01-01,2024-01-31"})
        
        assert result["qrScans"]["total"] == 1


class TestContentGenerationAnalytics:
    """Test content generation analytics endpoint"""
    
    def test_get_content_generation_analytics(self, mock_dynamodb_tables):
        """Test content generation analytics"""
        mock_dynamodb_tables["progress"].scan.return_value = {
            "Items": [
                {
                    "itemKey": "artifact1#en#TEXT",
                    "status": "COMPLETED",
                    "startTime": "2024-01-01T10:00:00",
                    "completionTime": "2024-01-01T10:05:00"
                },
                {
                    "itemKey": "artifact2#en#AUDIO",
                    "status": "COMPLETED",
                    "startTime": "2024-01-01T11:00:00",
                    "completionTime": "2024-01-01T11:10:00"
                },
                {
                    "itemKey": "artifact3#en#TEXT",
                    "status": "FAILED",
                    "startTime": "2024-01-01T12:00:00",
                    "completionTime": "2024-01-01T12:01:00"
                },
            ]
        }
        
        result = get_content_generation_analytics({})
        
        assert "contentGeneration" in result
        content_gen = result["contentGeneration"]
        assert content_gen["totalJobs"] == 3
        assert content_gen["successRate"] > 0
        assert content_gen["averageDuration"] > 0
        assert "TEXT" in content_gen["byType"]
        assert content_gen["byType"]["TEXT"] == 2


class TestLanguageUsageAnalytics:
    """Test language usage analytics endpoint"""
    
    def test_get_language_usage_analytics(self, mock_dynamodb_tables):
        """Test language usage analytics"""
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"language": "en"},
                {"language": "en"},
                {"language": "hi"},
                {"language": "ta"},
                {"language": "ta"},
                {"language": "ta"},
            ]
        }
        
        result = get_language_usage_analytics()
        
        assert "languageUsage" in result
        language_usage = result["languageUsage"]
        assert language_usage["en"] == 2
        assert language_usage["hi"] == 1
        assert language_usage["ta"] == 3


class TestGeographicAnalytics:
    """Test geographic analytics endpoint"""
    
    def test_get_geographic_analytics(self, mock_dynamodb_tables):
        """Test geographic distribution analytics"""
        mock_dynamodb_tables["sites"].scan.return_value = {
            "Items": [
                {"siteId": "temple1", "location": {"state": "Karnataka"}},
                {"siteId": "temple2", "location": {"state": "Tamil Nadu"}},
                {"siteId": "temple3", "location": {"state": "Karnataka"}},
            ]
        }
        
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "QR_SCAN", "siteId": "temple1"},
                {"eventType": "QR_SCAN", "siteId": "temple1"},
                {"eventType": "QR_SCAN", "siteId": "temple2"},
                {"eventType": "QR_SCAN", "siteId": "temple3"},
            ]
        }
        
        result = get_geographic_analytics()
        
        assert "geographicDistribution" in result
        geo_dist = result["geographicDistribution"]
        assert len(geo_dist) > 0
        
        # Find Karnataka entry
        karnataka = next((item for item in geo_dist if item["state"] == "Karnataka"), None)
        assert karnataka is not None
        assert karnataka["visits"] == 3


class TestAudioPlaybackAnalytics:
    """Test audio playback analytics endpoint"""
    
    def test_get_audio_playback_analytics(self, mock_dynamodb_tables):
        """Test audio playback analytics"""
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "AUDIO_PLAY", "metadata": {"duration": 120.5, "completed": True}},
                {"eventType": "AUDIO_PLAY", "metadata": {"duration": 90.0, "completed": False}},
                {"eventType": "AUDIO_PLAY", "metadata": {"duration": 150.0, "completed": True}},
            ]
        }
        
        result = get_audio_playback_analytics({})
        
        assert "audioPlayback" in result
        audio = result["audioPlayback"]
        assert audio["totalPlays"] == 3
        assert audio["averageDuration"] > 0
        assert audio["completionRate"] > 0


class TestQAInteractionAnalytics:
    """Test Q&A interaction analytics endpoint"""
    
    def test_get_qa_interaction_analytics(self, mock_dynamodb_tables):
        """Test Q&A interaction analytics"""
        mock_dynamodb_tables["analytics"].scan.return_value = {
            "Items": [
                {"eventType": "QA_INTERACTION", "metadata": {"responseTime": 1500, "satisfactionScore": 4.5}},
                {"eventType": "QA_INTERACTION", "metadata": {"responseTime": 2000, "satisfactionScore": 4.0}},
                {"eventType": "QA_INTERACTION", "metadata": {"responseTime": 1200, "satisfactionScore": 5.0}},
            ]
        }
        
        result = get_qa_interaction_analytics({})
        
        assert "qaInteractions" in result
        qa = result["qaInteractions"]
        assert qa["totalQuestions"] == 3
        assert qa["averageResponseTime"] > 0
        assert qa["satisfactionScore"] > 0


class TestAnalyticsExport:
    """Test analytics export endpoint"""
    
    def test_export_analytics_csv(self, mock_dynamodb_tables, mock_s3_client):
        """Test exporting analytics data as CSV"""
        # Mock summary data
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        # Mock S3 operations
        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/export.csv"
        
        body = {
            "format": "CSV",
            "dataType": "summary",
            "filters": {}
        }
        
        result = export_analytics_data(body, "user123")
        
        assert "exportUrl" in result
        assert "expiresAt" in result
        assert "fileName" in result
        assert result["format"] == "CSV"
        assert ".csv" in result["fileName"]
        
        # Verify S3 operations were called
        mock_s3_client.put_object.assert_called_once()
        mock_s3_client.generate_presigned_url.assert_called_once()
    
    def test_export_analytics_json(self, mock_dynamodb_tables, mock_s3_client):
        """Test exporting analytics data as JSON"""
        # Mock summary data
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        # Mock S3 operations
        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/export.json"
        
        body = {
            "format": "JSON",
            "dataType": "summary",
            "filters": {}
        }
        
        result = export_analytics_data(body, "user123")
        
        assert result["format"] == "JSON"
        assert ".json" in result["fileName"]
    
    def test_export_invalid_format_raises_error(self, mock_dynamodb_tables):
        """Test that invalid export format raises error"""
        body = {
            "format": "XML",
            "dataType": "summary",
            "filters": {}
        }
        
        with pytest.raises(ValueError, match="Invalid export format"):
            export_analytics_data(body, "user123")


class TestCSVConversion:
    """Test CSV conversion functionality"""
    
    def test_convert_summary_to_csv(self):
        """Test converting summary data to CSV"""
        data = {
            "summary": {
                "totalTemples": 10,
                "totalArtifacts": 50,
                "totalUsers": 100,
                "activeUsers": {
                    "daily": 20,
                    "weekly": 50,
                    "monthly": 80
                }
            }
        }
        
        csv_output = convert_to_csv(data, "summary")
        
        assert "Total Temples" in csv_output
        assert "10" in csv_output
        assert "Daily Active Users" in csv_output
        assert "20" in csv_output
    
    def test_convert_qr_scans_to_csv(self):
        """Test converting QR scan data to CSV"""
        data = {
            "qrScans": {
                "total": 100,
                "byTemple": {"temple1": 60, "temple2": 40},
                "byArtifact": {"artifact1": 30, "artifact2": 70}
            }
        }
        
        csv_output = convert_to_csv(data, "qr-scans")
        
        assert "Total QR Scans" in csv_output
        assert "100" in csv_output
        assert "temple1" in csv_output
        assert "60" in csv_output


class TestHandleAnalyticsRequest:
    """Test analytics request routing"""
    
    def test_route_summary_request(self, mock_dynamodb_tables):
        """Test routing to summary endpoint"""
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        result = handle_analytics_request(
            "GET",
            "/admin/analytics/summary",
            {},
            {},
            "user123"
        )
        
        assert "summary" in result
    
    def test_route_qr_scans_request(self, mock_dynamodb_tables):
        """Test routing to QR scans endpoint"""
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        
        result = handle_analytics_request(
            "GET",
            "/admin/analytics/qr-scans",
            {},
            {},
            "user123"
        )
        
        assert "qrScans" in result
    
    def test_route_export_request(self, mock_dynamodb_tables, mock_s3_client):
        """Test routing to export endpoint"""
        mock_dynamodb_tables["sites"].scan.return_value = {"Count": 5, "Items": []}
        mock_dynamodb_tables["artifacts"].scan.return_value = {"Count": 20, "Items": []}
        mock_dynamodb_tables["analytics"].scan.return_value = {"Items": []}
        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = "https://s3.example.com/export.csv"
        
        result = handle_analytics_request(
            "POST",
            "/admin/analytics/export",
            {"format": "CSV", "dataType": "summary", "filters": {}},
            {},
            "user123"
        )
        
        assert "exportUrl" in result
    
    def test_invalid_request_raises_error(self):
        """Test that invalid request raises error"""
        with pytest.raises(ValueError, match="Invalid analytics request"):
            handle_analytics_request(
                "DELETE",
                "/admin/analytics/invalid",
                {},
                {},
                "user123"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
