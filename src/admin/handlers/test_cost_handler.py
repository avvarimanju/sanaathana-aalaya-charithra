"""
Unit tests for cost monitoring handler
"""

import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
from cost_handler import (
    handle_cost_request,
    get_current_costs,
    get_cost_trend,
    get_resource_usage,
    get_cost_alerts,
    create_cost_alert,
    update_cost_alert,
    delete_cost_alert,
    map_service_name,
)


@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB resource"""
    with patch("cost_handler.dynamodb") as mock_db:
        yield mock_db


@pytest.fixture
def mock_ce_client():
    """Mock Cost Explorer client"""
    with patch("cost_handler.ce_client") as mock_ce:
        yield mock_ce


@pytest.fixture
def mock_cloudwatch():
    """Mock CloudWatch client"""
    with patch("cost_handler.cloudwatch") as mock_cw:
        yield mock_cw


@pytest.fixture
def sample_cost_response():
    """Sample Cost Explorer API response"""
    return {
        "ResultsByTime": [
            {
                "TimePeriod": {
                    "Start": "2024-01-01",
                    "End": "2024-01-31"
                },
                "Groups": [
                    {
                        "Keys": ["AWS Lambda"],
                        "Metrics": {
                            "UnblendedCost": {
                                "Amount": "150.50",
                                "Unit": "USD"
                            }
                        }
                    },
                    {
                        "Keys": ["Amazon DynamoDB"],
                        "Metrics": {
                            "UnblendedCost": {
                                "Amount": "75.25",
                                "Unit": "USD"
                            }
                        }
                    },
                    {
                        "Keys": ["Amazon Simple Storage Service"],
                        "Metrics": {
                            "UnblendedCost": {
                                "Amount": "50.00",
                                "Unit": "USD"
                            }
                        }
                    }
                ]
            }
        ]
    }


class TestHandleCostRequest:
    """Tests for handle_cost_request routing function"""

    def test_route_current_costs(self, mock_dynamodb, mock_ce_client):
        """Test routing to get_current_costs"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        mock_ce_client.get_cost_and_usage.return_value = {
            "ResultsByTime": [{"Groups": []}]
        }
        
        result = handle_cost_request(
            "GET",
            "/admin/costs/current",
            {},
            {},
            "user123"
        )
        
        assert "currentMonth" in result

    def test_route_cost_trend(self, mock_dynamodb, mock_ce_client):
        """Test routing to get_cost_trend"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        mock_ce_client.get_cost_and_usage.return_value = {
            "ResultsByTime": []
        }
        
        result = handle_cost_request(
            "GET",
            "/admin/costs/trend",
            {},
            {"months": "6"},
            "user123"
        )
        
        assert "trend" in result

    def test_route_resource_usage(self, mock_dynamodb, mock_cloudwatch):
        """Test routing to get_resource_usage"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        mock_cloudwatch.get_metric_statistics.return_value = {
            "Datapoints": []
        }
        
        result = handle_cost_request(
            "GET",
            "/admin/costs/resources",
            {},
            {},
            "user123"
        )
        
        assert "usage" in result

    def test_route_get_alerts(self, mock_dynamodb):
        """Test routing to get_cost_alerts"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.scan.return_value = {"Items": []}
        mock_table.get_item.return_value = {}
        
        result = handle_cost_request(
            "GET",
            "/admin/costs/alerts",
            {},
            {},
            "user123"
        )
        
        assert "alerts" in result

    def test_route_create_alert(self, mock_dynamodb):
        """Test routing to create_cost_alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        result = handle_cost_request(
            "POST",
            "/admin/costs/alerts",
            {"service": "lambda", "threshold": 100.0},
            {},
            "user123"
        )
        
        assert "alert" in result

    def test_route_update_alert(self, mock_dynamodb):
        """Test routing to update_cost_alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "alertId": "alert123",
                "service": "lambda",
                "threshold": Decimal("100.0")
            }
        }
        
        result = handle_cost_request(
            "PUT",
            "/admin/costs/alerts/alert123",
            {"threshold": 150.0},
            {},
            "user123"
        )
        
        assert "alert" in result

    def test_route_delete_alert(self, mock_dynamodb):
        """Test routing to delete_cost_alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            "Item": {
                "alertId": "alert123",
                "service": "lambda",
                "threshold": Decimal("100.0")
            }
        }
        
        result = handle_cost_request(
            "DELETE",
            "/admin/costs/alerts/alert123",
            {},
            {},
            "user123"
        )
        
        assert result["success"] is True

    def test_invalid_route(self):
        """Test invalid route raises error"""
        with pytest.raises(ValueError, match="Invalid cost request"):
            handle_cost_request(
                "POST",
                "/admin/costs/invalid",
                {},
                {},
                "user123"
            )


class TestGetCurrentCosts:
    """Tests for get_current_costs function"""

    def test_get_current_costs_from_cache(self, mock_dynamodb):
        """Test getting current costs from cache"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock cache hit
        mock_table.get_item.return_value = {
            "Item": {
                "cacheKey": "current_month_2024-01",
                "data": {
                    "total": 275.75,
                    "byService": {
                        "lambda": 150.50,
                        "dynamodb": 75.25,
                        "s3": 50.00
                    }
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        result = get_current_costs()
        
        assert result["cached"] is True
        assert result["currentMonth"]["total"] == 275.75
        assert "lambda" in result["currentMonth"]["byService"]

    def test_get_current_costs_from_api(self, mock_dynamodb, mock_ce_client, sample_cost_response):
        """Test getting current costs from Cost Explorer API"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock cache miss
        mock_table.get_item.return_value = {}
        
        # Mock Cost Explorer response
        mock_ce_client.get_cost_and_usage.return_value = sample_cost_response
        
        result = get_current_costs()
        
        assert result["cached"] is False
        assert result["currentMonth"]["total"] == 275.75
        assert result["currentMonth"]["byService"]["lambda"] == 150.50
        assert result["currentMonth"]["byService"]["dynamodb"] == 75.25
        assert result["currentMonth"]["byService"]["s3"] == 50.00

    def test_get_current_costs_api_error(self, mock_dynamodb, mock_ce_client):
        """Test handling Cost Explorer API error"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        # Mock API error
        mock_ce_client.get_cost_and_usage.side_effect = Exception("API Error")
        
        result = get_current_costs()
        
        assert "error" in result
        assert result["currentMonth"]["total"] == 0.0


class TestGetCostTrend:
    """Tests for get_cost_trend function"""

    def test_get_cost_trend_from_cache(self, mock_dynamodb):
        """Test getting cost trend from cache"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock cache hit
        mock_table.get_item.return_value = {
            "Item": {
                "cacheKey": "cost_trend_12months",
                "data": [
                    {
                        "month": "2024-01",
                        "total": 275.75,
                        "byService": {"lambda": 150.50}
                    }
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        result = get_cost_trend({"months": "12"})
        
        assert result["cached"] is True
        assert len(result["trend"]) == 1
        assert result["trend"][0]["month"] == "2024-01"

    def test_get_cost_trend_from_api(self, mock_dynamodb, mock_ce_client):
        """Test getting cost trend from Cost Explorer API"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        # Mock Cost Explorer response with multiple months
        mock_ce_client.get_cost_and_usage.return_value = {
            "ResultsByTime": [
                {
                    "TimePeriod": {"Start": "2024-01-01", "End": "2024-01-31"},
                    "Groups": [
                        {
                            "Keys": ["AWS Lambda"],
                            "Metrics": {"UnblendedCost": {"Amount": "100.00"}}
                        }
                    ]
                },
                {
                    "TimePeriod": {"Start": "2024-02-01", "End": "2024-02-29"},
                    "Groups": [
                        {
                            "Keys": ["AWS Lambda"],
                            "Metrics": {"UnblendedCost": {"Amount": "120.00"}}
                        }
                    ]
                }
            ]
        }
        
        result = get_cost_trend({"months": "6"})
        
        assert result["cached"] is False
        assert len(result["trend"]) == 2
        assert result["trend"][0]["month"] == "2024-01-01"
        assert result["trend"][1]["month"] == "2024-02-01"


class TestGetResourceUsage:
    """Tests for get_resource_usage function"""

    def test_get_resource_usage_from_cache(self, mock_dynamodb):
        """Test getting resource usage from cache"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock cache hit
        mock_table.get_item.return_value = {
            "Item": {
                "cacheKey": f"resource_usage_{datetime.utcnow().strftime('%Y-%m-%d')}",
                "data": {
                    "lambda": {"invocations": 1000, "duration": 50000},
                    "dynamodb": {"readCapacityUnits": 500}
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        result = get_resource_usage()
        
        assert result["cached"] is True
        assert result["usage"]["lambda"]["invocations"] == 1000

    def test_get_resource_usage_from_cloudwatch(self, mock_dynamodb, mock_cloudwatch):
        """Test getting resource usage from CloudWatch"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        # Mock CloudWatch responses
        mock_cloudwatch.get_metric_statistics.return_value = {
            "Datapoints": [
                {"Sum": 1000.0},
                {"Sum": 500.0}
            ]
        }
        
        result = get_resource_usage()
        
        assert result["cached"] is False
        assert "lambda" in result["usage"]
        assert "dynamodb" in result["usage"]


class TestCostAlerts:
    """Tests for cost alert management functions"""

    def test_get_cost_alerts(self, mock_dynamodb, mock_ce_client):
        """Test getting all cost alerts"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock alerts
        mock_table.scan.return_value = {
            "Items": [
                {
                    "alertId": "alert1",
                    "service": "lambda",
                    "threshold": Decimal("100.0")
                },
                {
                    "alertId": "alert2",
                    "service": "dynamodb",
                    "threshold": Decimal("50.0")
                }
            ]
        }
        
        # Mock current costs
        mock_table.get_item.return_value = {}
        mock_ce_client.get_cost_and_usage.return_value = {
            "ResultsByTime": [
                {
                    "Groups": [
                        {
                            "Keys": ["AWS Lambda"],
                            "Metrics": {"UnblendedCost": {"Amount": "150.0"}}
                        }
                    ]
                }
            ]
        }
        
        result = get_cost_alerts()
        
        assert len(result["alerts"]) == 2
        assert result["alerts"][0]["triggered"] is True  # Lambda exceeds threshold
        assert result["alerts"][1]["triggered"] is False  # DynamoDB below threshold

    def test_create_cost_alert(self, mock_dynamodb):
        """Test creating a cost alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        body = {
            "service": "lambda",
            "threshold": 100.0
        }
        
        result = create_cost_alert(body, "user123")
        
        assert "alert" in result
        assert result["alert"]["service"] == "lambda"
        assert result["alert"]["threshold"] == 100.0
        mock_table.put_item.assert_called_once()

    def test_create_cost_alert_missing_fields(self):
        """Test creating alert with missing fields"""
        with pytest.raises(ValueError, match="Missing required fields"):
            create_cost_alert({}, "user123")

    def test_create_cost_alert_invalid_threshold(self):
        """Test creating alert with invalid threshold"""
        with pytest.raises(ValueError, match="Threshold must be greater than 0"):
            create_cost_alert(
                {"service": "lambda", "threshold": -10.0},
                "user123"
            )

    def test_update_cost_alert(self, mock_dynamodb):
        """Test updating a cost alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock existing alert
        mock_table.get_item.side_effect = [
            {
                "Item": {
                    "alertId": "alert123",
                    "service": "lambda",
                    "threshold": Decimal("100.0")
                }
            },
            {
                "Item": {
                    "alertId": "alert123",
                    "service": "lambda",
                    "threshold": Decimal("150.0")
                }
            }
        ]
        
        body = {"threshold": 150.0}
        
        result = update_cost_alert("alert123", body, "user123")
        
        assert "alert" in result
        assert result["alert"]["threshold"] == 150.0
        mock_table.update_item.assert_called_once()

    def test_update_cost_alert_not_found(self, mock_dynamodb):
        """Test updating non-existent alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Alert not found"):
            update_cost_alert("alert123", {"threshold": 150.0}, "user123")

    def test_delete_cost_alert(self, mock_dynamodb):
        """Test deleting a cost alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Mock existing alert
        mock_table.get_item.return_value = {
            "Item": {
                "alertId": "alert123",
                "service": "lambda",
                "threshold": Decimal("100.0")
            }
        }
        
        result = delete_cost_alert("alert123", "user123")
        
        assert result["success"] is True
        mock_table.delete_item.assert_called_once()

    def test_delete_cost_alert_not_found(self, mock_dynamodb):
        """Test deleting non-existent alert"""
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.get_item.return_value = {}
        
        with pytest.raises(ValueError, match="Alert not found"):
            delete_cost_alert("alert123", "user123")


class TestHelperFunctions:
    """Tests for helper functions"""

    def test_map_service_name(self):
        """Test service name mapping"""
        assert map_service_name("AWS Lambda") == "lambda"
        assert map_service_name("Amazon DynamoDB") == "dynamodb"
        assert map_service_name("Amazon Simple Storage Service") == "s3"
        assert map_service_name("Amazon Bedrock") == "bedrock"
        assert map_service_name("Amazon Polly") == "polly"
        assert map_service_name("Unknown Service") == "unknown_service"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
