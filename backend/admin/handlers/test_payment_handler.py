"""
Unit tests for Payment Handler

Tests payment transaction operations, Razorpay integration,
refunds, subscriptions, and revenue statistics.
"""

import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from handlers.payment_handler import (
    handle_payment_request,
    list_transactions,
    get_transaction_details,
    issue_refund,
    list_subscriptions,
    cancel_subscription,
    get_revenue_statistics,
    export_transactions,
    get_razorpay_client,
)


# Mock AWS resources
@pytest.fixture(autouse=True)
def mock_aws_resources():
    """Mock AWS resources for all tests"""
    with patch("handlers.payment_handler.dynamodb") as mock_dynamodb, \
         patch("handlers.payment_handler.secretsmanager") as mock_secrets, \
         patch("handlers.payment_handler.boto3") as mock_boto3:
        
        # Mock DynamoDB tables
        mock_purchases_table = Mock()
        mock_audit_table = Mock()
        
        mock_dynamodb.Table.side_effect = lambda name: {
            "SanaathanaAalayaCharithra-Purchases": mock_purchases_table,
            "SanaathanaAalayaCharithra-AuditLog": mock_audit_table,
        }.get(name, Mock())
        
        # Mock Secrets Manager
        mock_secrets.get_secret_value.return_value = {
            "SecretString": json.dumps({
                "key_id": "test_key_id",
                "key_secret": "test_key_secret"
            })
        }
        
        # Mock S3 client
        mock_s3 = Mock()
        mock_s3.put_object.return_value = {}
        mock_s3.generate_presigned_url.return_value = "https://s3.example.com/export.csv"
        mock_boto3.client.return_value = mock_s3
        
        yield {
            "purchases_table": mock_purchases_table,
            "audit_table": mock_audit_table,
            "secrets": mock_secrets,
            "s3": mock_s3,
        }


@pytest.fixture
def sample_transaction():
    """Sample transaction data"""
    return {
        "userId": "user123",
        "purchaseId": "txn123",
        "razorpayPaymentId": "pay_123",
        "razorpayOrderId": "order_123",
        "templeId": "temple123",
        "templeName": "Test Temple",
        "userName": "Test User",
        "amount": Decimal("100.00"),
        "currency": "INR",
        "status": "CAPTURED",
        "paymentMethod": "card",
        "purchaseDate": "2024-01-15T10:00:00",
        "capturedAt": "2024-01-15T10:01:00",
        "metadata": {}
    }


@pytest.fixture
def sample_subscription():
    """Sample subscription data"""
    return {
        "id": "sub_123",
        "plan_id": "plan_123",
        "status": "active",
        "start_at": int(datetime.utcnow().timestamp()),
        "end_at": int((datetime.utcnow() + timedelta(days=30)).timestamp()),
        "notes": {
            "userId": "user123",
            "planName": "Premium Plan"
        },
        "plan": {
            "item": {
                "amount": 50000  # 500.00 INR in paise
            }
        }
    }


class TestHandlePaymentRequest:
    """Test payment request routing"""
    
    def test_list_transactions(self, mock_aws_resources):
        """Test routing to list transactions"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        result = handle_payment_request(
            "GET",
            "/admin/payments/transactions",
            {},
            {"page": "1", "limit": "50"},
            "admin123"
        )
        
        assert "transactions" in result
        assert "total" in result
    
    def test_get_transaction_details(self, mock_aws_resources, sample_transaction):
        """Test routing to get transaction details"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.fetch.return_value = {"id": "pay_123"}
            mock_client.return_value = mock_razorpay
            
            result = handle_payment_request(
                "GET",
                "/admin/payments/transactions/txn123",
                {},
                {},
                "admin123"
            )
            
            assert "transaction" in result
            assert result["transaction"]["transactionId"] == "txn123"
    
    def test_issue_refund(self, mock_aws_resources, sample_transaction):
        """Test routing to issue refund"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        mock_aws_resources["purchases_table"].update_item.return_value = {}
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.refund.return_value = {
                "id": "rfnd_123",
                "status": "processed"
            }
            mock_client.return_value = mock_razorpay
            
            result = handle_payment_request(
                "POST",
                "/admin/payments/transactions/txn123/refund",
                {"reason": "Customer request"},
                {},
                "admin123"
            )
            
            assert result["success"] is True
            assert "refund" in result
    
    def test_list_subscriptions(self, mock_aws_resources):
        """Test routing to list subscriptions"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.all.return_value = {
                "items": [],
                "count": 0
            }
            mock_client.return_value = mock_razorpay
            
            result = handle_payment_request(
                "GET",
                "/admin/payments/subscriptions",
                {},
                {},
                "admin123"
            )
            
            assert "subscriptions" in result
    
    def test_cancel_subscription(self, mock_aws_resources):
        """Test routing to cancel subscription"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.cancel.return_value = {
                "id": "sub_123",
                "status": "cancelled"
            }
            mock_client.return_value = mock_razorpay
            
            result = handle_payment_request(
                "POST",
                "/admin/payments/subscriptions/sub_123/cancel",
                {"reason": "User request"},
                {},
                "admin123"
            )
            
            assert result["success"] is True
    
    def test_get_revenue_statistics(self, mock_aws_resources):
        """Test routing to get revenue statistics"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        result = handle_payment_request(
            "GET",
            "/admin/payments/revenue",
            {},
            {"period": "monthly"},
            "admin123"
        )
        
        assert "revenue" in result
    
    def test_export_transactions(self, mock_aws_resources):
        """Test routing to export transactions"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        result = handle_payment_request(
            "POST",
            "/admin/payments/export",
            {"format": "CSV"},
            {},
            "admin123"
        )
        
        assert "exportUrl" in result
    
    def test_invalid_request(self):
        """Test invalid request path"""
        with pytest.raises(ValueError, match="Invalid payment request"):
            handle_payment_request(
                "GET",
                "/admin/payments/invalid",
                {},
                {},
                "admin123"
            )


class TestListTransactions:
    """Test listing transactions"""
    
    def test_list_all_transactions(self, mock_aws_resources, sample_transaction):
        """Test listing all transactions without filters"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = list_transactions({"page": "1", "limit": "50"})
        
        assert result["total"] == 1
        assert len(result["transactions"]) == 1
        assert result["transactions"][0]["transactionId"] == "txn123"
    
    def test_list_with_status_filter(self, mock_aws_resources, sample_transaction):
        """Test listing transactions with status filter"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = list_transactions({
            "page": "1",
            "limit": "50",
            "status": "CAPTURED"
        })
        
        assert result["total"] == 1
        mock_aws_resources["purchases_table"].scan.assert_called_once()
        call_kwargs = mock_aws_resources["purchases_table"].scan.call_args[1]
        assert "FilterExpression" in call_kwargs
    
    def test_list_with_date_range_filter(self, mock_aws_resources, sample_transaction):
        """Test listing transactions with date range filter"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = list_transactions({
            "page": "1",
            "limit": "50",
            "dateRange": "2024-01-01,2024-01-31"
        })
        
        assert result["total"] == 1
        call_kwargs = mock_aws_resources["purchases_table"].scan.call_args[1]
        assert "FilterExpression" in call_kwargs
    
    def test_list_with_amount_range_filter(self, mock_aws_resources, sample_transaction):
        """Test listing transactions with amount range filter"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = list_transactions({
            "page": "1",
            "limit": "50",
            "amountRange": "50,150"
        })
        
        assert result["total"] == 1
        call_kwargs = mock_aws_resources["purchases_table"].scan.call_args[1]
        assert "FilterExpression" in call_kwargs
    
    def test_pagination(self, mock_aws_resources, sample_transaction):
        """Test transaction pagination"""
        # Create multiple transactions
        transactions = []
        for i in range(100):
            txn = sample_transaction.copy()
            txn["purchaseId"] = f"txn{i}"
            transactions.append(txn)
        
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": transactions
        }
        
        # Get page 2 with 50 items per page
        result = list_transactions({"page": "2", "limit": "50"})
        
        assert result["total"] == 100
        assert len(result["transactions"]) == 50
        assert result["page"] == 2
        assert result["totalPages"] == 2
    
    def test_empty_results(self, mock_aws_resources):
        """Test listing with no transactions"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        result = list_transactions({"page": "1", "limit": "50"})
        
        assert result["total"] == 0
        assert len(result["transactions"]) == 0


class TestGetTransactionDetails:
    """Test getting transaction details"""
    
    def test_get_existing_transaction(self, mock_aws_resources, sample_transaction):
        """Test getting details of existing transaction"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.fetch.return_value = {
                "id": "pay_123",
                "method": "card"
            }
            mock_client.return_value = mock_razorpay
            
            result = get_transaction_details("txn123")
            
            assert "transaction" in result
            assert result["transaction"]["transactionId"] == "txn123"
            assert result["transaction"]["amount"] == 100.0
            assert "razorpayDetails" in result["transaction"]
    
    def test_get_nonexistent_transaction(self, mock_aws_resources):
        """Test getting details of nonexistent transaction"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        with pytest.raises(ValueError, match="Transaction not found"):
            get_transaction_details("nonexistent")
    
    def test_razorpay_fetch_error(self, mock_aws_resources, sample_transaction):
        """Test handling Razorpay fetch error"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.fetch.side_effect = Exception("Razorpay error")
            mock_client.return_value = mock_razorpay
            
            result = get_transaction_details("txn123")
            
            # Should still return transaction even if Razorpay fails
            assert "transaction" in result
            assert result["transaction"]["razorpayDetails"] is None


class TestIssueRefund:
    """Test issuing refunds"""
    
    def test_issue_full_refund(self, mock_aws_resources, sample_transaction):
        """Test issuing full refund"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        mock_aws_resources["purchases_table"].update_item.return_value = {}
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.refund.return_value = {
                "id": "rfnd_123",
                "status": "processed"
            }
            mock_client.return_value = mock_razorpay
            
            result = issue_refund(
                "txn123",
                {"reason": "Customer request"},
                "admin123"
            )
            
            assert result["success"] is True
            assert result["refund"]["amount"] == 100.0
            mock_razorpay.payment.refund.assert_called_once()
    
    def test_issue_partial_refund(self, mock_aws_resources, sample_transaction):
        """Test issuing partial refund"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        mock_aws_resources["purchases_table"].update_item.return_value = {}
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.refund.return_value = {
                "id": "rfnd_123",
                "status": "processed"
            }
            mock_client.return_value = mock_razorpay
            
            result = issue_refund(
                "txn123",
                {"amount": 50.0, "reason": "Partial refund"},
                "admin123"
            )
            
            assert result["success"] is True
            assert result["refund"]["amount"] == 50.0
            # Verify Razorpay was called with correct amount in paise
            call_args = mock_razorpay.payment.refund.call_args
            assert call_args[0][1]["amount"] == 5000  # 50.00 * 100
    
    def test_refund_missing_reason(self, mock_aws_resources, sample_transaction):
        """Test refund without reason"""
        with pytest.raises(ValueError, match="Missing required field: reason"):
            issue_refund("txn123", {}, "admin123")
    
    def test_refund_already_refunded(self, mock_aws_resources, sample_transaction):
        """Test refunding already refunded transaction"""
        refunded_txn = sample_transaction.copy()
        refunded_txn["status"] = "REFUNDED"
        
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [refunded_txn]
        }
        
        with pytest.raises(ValueError, match="already refunded"):
            issue_refund(
                "txn123",
                {"reason": "Test"},
                "admin123"
            )
    
    def test_refund_invalid_status(self, mock_aws_resources, sample_transaction):
        """Test refunding transaction with invalid status"""
        pending_txn = sample_transaction.copy()
        pending_txn["status"] = "PENDING"
        
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [pending_txn]
        }
        
        with pytest.raises(ValueError, match="Cannot refund transaction"):
            issue_refund(
                "txn123",
                {"reason": "Test"},
                "admin123"
            )
    
    def test_refund_nonexistent_transaction(self, mock_aws_resources):
        """Test refunding nonexistent transaction"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": []
        }
        
        with pytest.raises(ValueError, match="Transaction not found"):
            issue_refund(
                "nonexistent",
                {"reason": "Test"},
                "admin123"
            )
    
    def test_refund_razorpay_error(self, mock_aws_resources, sample_transaction):
        """Test handling Razorpay refund error"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.payment.refund.side_effect = Exception("Razorpay error")
            mock_client.return_value = mock_razorpay
            
            with pytest.raises(ValueError, match="Failed to issue refund"):
                issue_refund(
                    "txn123",
                    {"reason": "Test"},
                    "admin123"
                )


class TestListSubscriptions:
    """Test listing subscriptions"""
    
    def test_list_all_subscriptions(self, mock_aws_resources, sample_subscription):
        """Test listing all subscriptions"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.all.return_value = {
                "items": [sample_subscription],
                "count": 1
            }
            mock_client.return_value = mock_razorpay
            
            result = list_subscriptions({"page": "1", "limit": "50"})
            
            assert result["total"] == 1
            assert len(result["subscriptions"]) == 1
            assert result["subscriptions"][0]["subscriptionId"] == "sub_123"
    
    def test_list_with_status_filter(self, mock_aws_resources, sample_subscription):
        """Test listing subscriptions with status filter"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.all.return_value = {
                "items": [sample_subscription],
                "count": 1
            }
            mock_client.return_value = mock_razorpay
            
            result = list_subscriptions({
                "page": "1",
                "limit": "50",
                "status": "active"
            })
            
            assert len(result["subscriptions"]) == 1
    
    def test_list_razorpay_error(self, mock_aws_resources):
        """Test handling Razorpay error when listing subscriptions"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.all.side_effect = Exception("Razorpay error")
            mock_client.return_value = mock_razorpay
            
            result = list_subscriptions({"page": "1", "limit": "50"})
            
            # Should return empty list on error
            assert result["subscriptions"] == []
            assert "error" in result


class TestCancelSubscription:
    """Test cancelling subscriptions"""
    
    def test_cancel_subscription(self, mock_aws_resources):
        """Test cancelling a subscription"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.cancel.return_value = {
                "id": "sub_123",
                "status": "cancelled"
            }
            mock_client.return_value = mock_razorpay
            
            result = cancel_subscription(
                "sub_123",
                {"reason": "User request"},
                "admin123"
            )
            
            assert result["success"] is True
            assert result["subscription"]["status"] == "cancelled"
            mock_razorpay.subscription.cancel.assert_called_once()
    
    def test_cancel_razorpay_error(self, mock_aws_resources):
        """Test handling Razorpay error when cancelling"""
        with patch("handlers.payment_handler.get_razorpay_client") as mock_client:
            mock_razorpay = Mock()
            mock_razorpay.subscription.cancel.side_effect = Exception("Razorpay error")
            mock_client.return_value = mock_razorpay
            
            with pytest.raises(ValueError, match="Failed to cancel subscription"):
                cancel_subscription(
                    "sub_123",
                    {"reason": "Test"},
                    "admin123"
                )


class TestGetRevenueStatistics:
    """Test getting revenue statistics"""
    
    def test_get_monthly_revenue(self, mock_aws_resources, sample_transaction):
        """Test getting monthly revenue statistics"""
        transactions = []
        for i in range(10):
            txn = sample_transaction.copy()
            txn["purchaseId"] = f"txn{i}"
            txn["purchaseDate"] = f"2024-01-{15+i:02d}T10:00:00"
            transactions.append(txn)
        
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": transactions
        }
        
        result = get_revenue_statistics({"period": "monthly"})
        
        assert "revenue" in result
        assert "monthly" in result["revenue"]
        assert "byTemple" in result["revenue"]
        assert result["revenue"]["total"] == 1000.0  # 10 * 100
    
    def test_get_daily_revenue(self, mock_aws_resources, sample_transaction):
        """Test getting daily revenue statistics"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = get_revenue_statistics({"period": "daily"})
        
        assert "revenue" in result
        assert "daily" in result["revenue"]
    
    def test_get_weekly_revenue(self, mock_aws_resources, sample_transaction):
        """Test getting weekly revenue statistics"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = get_revenue_statistics({"period": "weekly"})
        
        assert "revenue" in result
        assert "weekly" in result["revenue"]
    
    def test_revenue_with_date_range(self, mock_aws_resources, sample_transaction):
        """Test revenue statistics with custom date range"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = get_revenue_statistics({
            "period": "monthly",
            "dateRange": "2024-01-01,2024-01-31"
        })
        
        assert "revenue" in result
        call_kwargs = mock_aws_resources["purchases_table"].scan.call_args[1]
        assert "FilterExpression" in call_kwargs


class TestExportTransactions:
    """Test exporting transactions"""
    
    def test_export_csv(self, mock_aws_resources, sample_transaction):
        """Test exporting transactions to CSV"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = export_transactions(
            {"format": "CSV"},
            "admin123"
        )
        
        assert "exportUrl" in result
        assert "expiresAt" in result
        assert "filename" in result
        assert result["count"] == 1
        
        # Verify S3 upload was called
        mock_aws_resources["s3"].put_object.assert_called_once()
    
    def test_export_with_date_range(self, mock_aws_resources, sample_transaction):
        """Test exporting with date range filter"""
        mock_aws_resources["purchases_table"].scan.return_value = {
            "Items": [sample_transaction]
        }
        
        result = export_transactions(
            {
                "format": "CSV",
                "dateRange": {
                    "start": "2024-01-01",
                    "end": "2024-01-31"
                }
            },
            "admin123"
        )
        
        assert "exportUrl" in result
    
    def test_export_invalid_format(self, mock_aws_resources):
        """Test exporting with invalid format"""
        with pytest.raises(ValueError, match="Only CSV format is supported"):
            export_transactions(
                {"format": "JSON"},
                "admin123"
            )


class TestGetRazorpayClient:
    """Test Razorpay client initialization"""
    
    def test_client_initialization(self, mock_aws_resources):
        """Test successful client initialization"""
        with patch("handlers.payment_handler.razorpay") as mock_razorpay:
            mock_client = Mock()
            mock_razorpay.Client.return_value = mock_client
            
            # Reset global client
            import handlers.payment_handler
            handlers.payment_handler._razorpay_client = None
            
            client = get_razorpay_client()
            
            assert client is not None
            mock_razorpay.Client.assert_called_once_with(
                auth=("test_key_id", "test_key_secret")
            )
    
    def test_client_caching(self, mock_aws_resources):
        """Test that client is cached after first initialization"""
        with patch("handlers.payment_handler.razorpay") as mock_razorpay:
            mock_client = Mock()
            mock_razorpay.Client.return_value = mock_client
            
            # Reset global client
            import handlers.payment_handler
            handlers.payment_handler._razorpay_client = None
            
            # Call twice
            client1 = get_razorpay_client()
            client2 = get_razorpay_client()
            
            # Should only initialize once
            assert mock_razorpay.Client.call_count == 1
            assert client1 is client2
    
    def test_missing_credentials(self, mock_aws_resources):
        """Test handling missing credentials"""
        mock_aws_resources["secrets"].get_secret_value.return_value = {
            "SecretString": json.dumps({})
        }
        
        # Reset global client
        import handlers.payment_handler
        handlers.payment_handler._razorpay_client = None
        
        with pytest.raises(ValueError, match="Missing Razorpay credentials"):
            get_razorpay_client()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
