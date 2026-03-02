"""
Payment Management Handler

Handles payment transaction operations including Razorpay integration,
transaction management, refunds, subscriptions, and revenue statistics.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

# AWS clients
dynamodb = boto3.resource("dynamodb")
secretsmanager = boto3.client("secretsmanager")

# DynamoDB tables
purchases_table = dynamodb.Table("SanaathanaAalayaCharithra-Purchases")
audit_log_table = dynamodb.Table("SanaathanaAalayaCharithra-AuditLog")

# Environment variables
RAZORPAY_SECRET_NAME = os.environ.get("RAZORPAY_SECRET_NAME", "razorpay/admin/credentials")
EXPORTS_BUCKET = os.environ.get("EXPORTS_BUCKET", "sanaathana-aalaya-charithra-exports")

# Razorpay client (lazy loaded)
_razorpay_client = None


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def get_razorpay_client():
    """
    Get Razorpay client with credentials from Secrets Manager
    
    Returns:
        Razorpay client instance
    """
    global _razorpay_client
    
    if _razorpay_client is None:
        try:
            # Get credentials from Secrets Manager
            response = secretsmanager.get_secret_value(SecretId=RAZORPAY_SECRET_NAME)
            credentials = json.loads(response["SecretString"])
            
            key_id = credentials.get("key_id")
            key_secret = credentials.get("key_secret")
            
            if not key_id or not key_secret:
                raise ValueError("Missing Razorpay credentials in Secrets Manager")
            
            # Import Razorpay SDK
            import razorpay
            _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
            
        except Exception as e:
            print(f"Error initializing Razorpay client: {str(e)}")
            raise ValueError(f"Failed to initialize Razorpay client: {str(e)}")
    
    return _razorpay_client


def handle_payment_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route payment management requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID making the request
        
    Returns:
        Response data
    """
    # Extract IDs from path
    path_parts = path.split("/")
    
    # Transactions endpoints
    if "/transactions" in path:
        if method == "GET" and len(path_parts) == 4:
            # GET /admin/payments/transactions
            return list_transactions(query_params)
        elif method == "GET" and len(path_parts) == 5:
            # GET /admin/payments/transactions/{transactionId}
            transaction_id = path_parts[4]
            return get_transaction_details(transaction_id)
        elif method == "POST" and "/refund" in path:
            # POST /admin/payments/transactions/{transactionId}/refund
            transaction_id = path_parts[4]
            return issue_refund(transaction_id, body, user_id)
    
    # Subscriptions endpoints
    elif "/subscriptions" in path:
        if method == "GET":
            # GET /admin/payments/subscriptions
            return list_subscriptions(query_params)
        elif method == "POST" and "/cancel" in path:
            # POST /admin/payments/subscriptions/{subscriptionId}/cancel
            subscription_id = path_parts[4]
            return cancel_subscription(subscription_id, body, user_id)
    
    # Revenue statistics endpoint
    elif method == "GET" and "/revenue" in path:
        return get_revenue_statistics(query_params)
    
    # Export transactions endpoint
    elif method == "POST" and "/export" in path:
        return export_transactions(body, user_id)
    
    else:
        raise ValueError(f"Invalid payment request: {method} {path}")


def list_transactions(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List all transactions with filtering
    
    Args:
        query_params: Query parameters (page, limit, status, dateRange, amountRange)
        
    Returns:
        Paginated list of transactions
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    status_filter = query_params.get("status")
    date_range = query_params.get("dateRange")  # Format: "start,end"
    amount_range = query_params.get("amountRange")  # Format: "min,max"
    
    try:
        # Scan purchases table (in production, use GSI for better performance)
        scan_kwargs = {}
        filter_expressions = []
        expression_attribute_values = {}
        
        # Apply status filter
        if status_filter:
            filter_expressions.append("status = :status")
            expression_attribute_values[":status"] = status_filter
        
        # Apply date range filter
        if date_range:
            start_date, end_date = date_range.split(",")
            filter_expressions.append("purchaseDate BETWEEN :start_date AND :end_date")
            expression_attribute_values[":start_date"] = start_date
            expression_attribute_values[":end_date"] = end_date
        
        # Apply amount range filter
        if amount_range:
            min_amount, max_amount = amount_range.split(",")
            filter_expressions.append("amount BETWEEN :min_amount AND :max_amount")
            expression_attribute_values[":min_amount"] = Decimal(min_amount)
            expression_attribute_values[":max_amount"] = Decimal(max_amount)
        
        # Build filter expression
        if filter_expressions:
            scan_kwargs["FilterExpression"] = " AND ".join(filter_expressions)
            scan_kwargs["ExpressionAttributeValues"] = expression_attribute_values
        
        # Scan table
        response = purchases_table.scan(**scan_kwargs)
        items = response.get("Items", [])
        
        # Handle pagination
        while "LastEvaluatedKey" in response:
            scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
            response = purchases_table.scan(**scan_kwargs)
            items.extend(response.get("Items", []))
        
        # Sort by date (newest first)
        items.sort(key=lambda x: x.get("purchaseDate", ""), reverse=True)
        
        # Calculate pagination
        total = len(items)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_items = items[start_idx:end_idx]
        
        # Transform items to Transaction format
        transactions = []
        for item in paginated_items:
            transactions.append({
                "transactionId": item.get("purchaseId"),
                "razorpayPaymentId": item.get("razorpayPaymentId"),
                "razorpayOrderId": item.get("razorpayOrderId"),
                "userId": item.get("userId"),
                "userName": item.get("userName", "Unknown"),
                "templeId": item.get("templeId"),
                "templeName": item.get("templeName", "Unknown"),
                "amount": float(item.get("amount", 0)),
                "currency": item.get("currency", "INR"),
                "status": item.get("status"),
                "paymentMethod": item.get("paymentMethod", "Unknown"),
                "createdAt": item.get("purchaseDate"),
                "capturedAt": item.get("capturedAt"),
                "refundedAt": item.get("refundedAt"),
                "refundAmount": float(item.get("refundAmount", 0)) if item.get("refundAmount") else None,
                "refundReason": item.get("refundReason"),
                "metadata": item.get("metadata", {})
            })
        
        return {
            "transactions": transactions,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        print(f"Error listing transactions: {str(e)}")
        raise ValueError(f"Failed to list transactions: {str(e)}")


def get_transaction_details(transaction_id: str) -> Dict[str, Any]:
    """
    Get detailed transaction information
    
    Args:
        transaction_id: Transaction ID (purchaseId)
        
    Returns:
        Transaction details
    """
    try:
        # Query by purchaseId (need to scan since it's sort key)
        response = purchases_table.scan(
            FilterExpression="purchaseId = :purchase_id",
            ExpressionAttributeValues={":purchase_id": transaction_id}
        )
        
        items = response.get("Items", [])
        if not items:
            raise ValueError(f"Transaction not found: {transaction_id}")
        
        item = items[0]
        
        # Get additional details from Razorpay if available
        razorpay_details = None
        if item.get("razorpayPaymentId"):
            try:
                client = get_razorpay_client()
                razorpay_details = client.payment.fetch(item["razorpayPaymentId"])
            except Exception as e:
                print(f"Error fetching Razorpay details: {str(e)}")
        
        transaction = {
            "transactionId": item.get("purchaseId"),
            "razorpayPaymentId": item.get("razorpayPaymentId"),
            "razorpayOrderId": item.get("razorpayOrderId"),
            "userId": item.get("userId"),
            "userName": item.get("userName", "Unknown"),
            "templeId": item.get("templeId"),
            "templeName": item.get("templeName", "Unknown"),
            "amount": float(item.get("amount", 0)),
            "currency": item.get("currency", "INR"),
            "status": item.get("status"),
            "paymentMethod": item.get("paymentMethod", "Unknown"),
            "createdAt": item.get("purchaseDate"),
            "capturedAt": item.get("capturedAt"),
            "refundedAt": item.get("refundedAt"),
            "refundAmount": float(item.get("refundAmount", 0)) if item.get("refundAmount") else None,
            "refundReason": item.get("refundReason"),
            "metadata": item.get("metadata", {}),
            "razorpayDetails": razorpay_details
        }
        
        return {"transaction": transaction}
        
    except Exception as e:
        print(f"Error getting transaction details: {str(e)}")
        raise ValueError(f"Failed to get transaction details: {str(e)}")


def issue_refund(transaction_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Issue a refund for a transaction
    
    Args:
        transaction_id: Transaction ID
        body: Refund data (amount, reason)
        user_id: User issuing the refund
        
    Returns:
        Refund result
    """
    # Validate required fields
    reason = body.get("reason")
    if not reason:
        raise ValueError("Missing required field: reason")
    
    try:
        # Get transaction
        response = purchases_table.scan(
            FilterExpression="purchaseId = :purchase_id",
            ExpressionAttributeValues={":purchase_id": transaction_id}
        )
        
        items = response.get("Items", [])
        if not items:
            raise ValueError(f"Transaction not found: {transaction_id}")
        
        item = items[0]
        user_id_key = item["userId"]
        purchase_id_key = item["purchaseId"]
        
        # Check if already refunded
        if item.get("status") == "REFUNDED":
            raise ValueError("Transaction already refunded")
        
        # Check if transaction is captured
        if item.get("status") != "CAPTURED":
            raise ValueError(f"Cannot refund transaction with status: {item.get('status')}")
        
        razorpay_payment_id = item.get("razorpayPaymentId")
        if not razorpay_payment_id:
            raise ValueError("Missing Razorpay payment ID")
        
        # Calculate refund amount
        refund_amount = body.get("amount")
        if refund_amount:
            refund_amount = float(refund_amount)
        else:
            refund_amount = float(item.get("amount", 0))
        
        # Convert to paise (Razorpay uses smallest currency unit)
        refund_amount_paise = int(refund_amount * 100)
        
        # Process refund through Razorpay
        client = get_razorpay_client()
        refund_response = client.payment.refund(
            razorpay_payment_id,
            {
                "amount": refund_amount_paise,
                "notes": {
                    "reason": reason,
                    "refunded_by": user_id
                }
            }
        )
        
        # Update transaction in DynamoDB
        purchases_table.update_item(
            Key={
                "userId": user_id_key,
                "purchaseId": purchase_id_key
            },
            UpdateExpression="SET #status = :status, refundedAt = :refunded_at, refundAmount = :refund_amount, refundReason = :reason",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "REFUNDED",
                ":refunded_at": datetime.utcnow().isoformat(),
                ":refund_amount": Decimal(str(refund_amount)),
                ":reason": reason
            }
        )
        
        # Log audit entry
        log_audit_entry(
            user_id=user_id,
            action="ISSUE_REFUND",
            resource="transaction",
            resource_id=transaction_id,
            before={"status": item.get("status")},
            after={
                "status": "REFUNDED",
                "refundAmount": refund_amount,
                "refundReason": reason
            }
        )
        
        return {
            "success": True,
            "refund": {
                "refundId": refund_response.get("id"),
                "amount": refund_amount,
                "currency": item.get("currency", "INR"),
                "status": refund_response.get("status"),
                "createdAt": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error issuing refund: {str(e)}")
        raise ValueError(f"Failed to issue refund: {str(e)}")


def list_subscriptions(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List active subscriptions
    
    Args:
        query_params: Query parameters (page, limit, status, userId)
        
    Returns:
        Paginated list of subscriptions
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    status_filter = query_params.get("status")
    user_id_filter = query_params.get("userId")
    
    try:
        # Get Razorpay client
        client = get_razorpay_client()
        
        # Fetch subscriptions from Razorpay
        # Note: Razorpay API has its own pagination
        razorpay_params = {
            "count": limit,
            "skip": (page - 1) * limit
        }
        
        subscriptions_response = client.subscription.all(razorpay_params)
        razorpay_subscriptions = subscriptions_response.get("items", [])
        
        # Transform to our format
        subscriptions = []
        for sub in razorpay_subscriptions:
            # Apply filters
            if status_filter and sub.get("status") != status_filter:
                continue
            if user_id_filter and sub.get("notes", {}).get("userId") != user_id_filter:
                continue
            
            subscriptions.append({
                "subscriptionId": sub.get("id"),
                "userId": sub.get("notes", {}).get("userId", "Unknown"),
                "planId": sub.get("plan_id"),
                "planName": sub.get("notes", {}).get("planName", "Unknown"),
                "status": sub.get("status"),
                "startDate": datetime.fromtimestamp(sub.get("start_at", 0)).isoformat() if sub.get("start_at") else None,
                "endDate": datetime.fromtimestamp(sub.get("end_at", 0)).isoformat() if sub.get("end_at") else None,
                "autoRenew": not sub.get("has_scheduled_changes", False),
                "amount": float(sub.get("plan", {}).get("item", {}).get("amount", 0)) / 100  # Convert from paise
            })
        
        total = subscriptions_response.get("count", len(subscriptions))
        
        return {
            "subscriptions": subscriptions,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        print(f"Error listing subscriptions: {str(e)}")
        # Return empty list on error (Razorpay might not be configured)
        return {
            "subscriptions": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "totalPages": 0,
            "error": str(e)
        }


def cancel_subscription(subscription_id: str, body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Cancel a subscription
    
    Args:
        subscription_id: Subscription ID
        body: Cancellation data (reason)
        user_id: User cancelling the subscription
        
    Returns:
        Cancellation result
    """
    reason = body.get("reason", "Cancelled by admin")
    
    try:
        # Get Razorpay client
        client = get_razorpay_client()
        
        # Cancel subscription through Razorpay
        cancel_response = client.subscription.cancel(
            subscription_id,
            {
                "cancel_at_cycle_end": 0  # Cancel immediately
            }
        )
        
        # Log audit entry
        log_audit_entry(
            user_id=user_id,
            action="CANCEL_SUBSCRIPTION",
            resource="subscription",
            resource_id=subscription_id,
            after={
                "status": "cancelled",
                "reason": reason
            }
        )
        
        return {
            "success": True,
            "subscription": {
                "subscriptionId": subscription_id,
                "status": cancel_response.get("status"),
                "cancelledAt": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error cancelling subscription: {str(e)}")
        raise ValueError(f"Failed to cancel subscription: {str(e)}")


def get_revenue_statistics(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get revenue statistics
    
    Args:
        query_params: Query parameters (period, dateRange)
        
    Returns:
        Revenue statistics
    """
    period = query_params.get("period", "monthly")  # daily, weekly, monthly
    date_range = query_params.get("dateRange")  # Format: "start,end"
    
    try:
        # Determine date range
        if date_range:
            start_date_str, end_date_str = date_range.split(",")
            start_date = datetime.fromisoformat(start_date_str)
            end_date = datetime.fromisoformat(end_date_str)
        else:
            # Default to last 30 days
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        
        # Scan purchases table for transactions in date range
        response = purchases_table.scan(
            FilterExpression="purchaseDate BETWEEN :start_date AND :end_date AND #status = :status",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":start_date": start_date.isoformat(),
                ":end_date": end_date.isoformat(),
                ":status": "CAPTURED"
            }
        )
        
        items = response.get("Items", [])
        
        # Handle pagination
        while "LastEvaluatedKey" in response:
            response = purchases_table.scan(
                FilterExpression="purchaseDate BETWEEN :start_date AND :end_date AND #status = :status",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":start_date": start_date.isoformat(),
                    ":end_date": end_date.isoformat(),
                    ":status": "CAPTURED"
                },
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
        
        # Calculate revenue by period
        revenue_data = []
        by_temple = {}
        
        for item in items:
            amount = float(item.get("amount", 0))
            purchase_date = datetime.fromisoformat(item.get("purchaseDate", ""))
            temple_id = item.get("templeId", "Unknown")
            
            # Aggregate by temple
            if temple_id not in by_temple:
                by_temple[temple_id] = 0
            by_temple[temple_id] += amount
            
            # Aggregate by period
            if period == "daily":
                period_key = purchase_date.strftime("%Y-%m-%d")
            elif period == "weekly":
                # Get week start (Monday)
                week_start = purchase_date - timedelta(days=purchase_date.weekday())
                period_key = week_start.strftime("%Y-%m-%d")
            else:  # monthly
                period_key = purchase_date.strftime("%Y-%m")
            
            # Find or create period entry
            period_entry = next((r for r in revenue_data if r["timestamp"] == period_key), None)
            if not period_entry:
                period_entry = {"timestamp": period_key, "value": 0}
                revenue_data.append(period_entry)
            
            period_entry["value"] += amount
        
        # Sort by timestamp
        revenue_data.sort(key=lambda x: x["timestamp"])
        
        return {
            "revenue": {
                period: revenue_data,
                "byTemple": by_temple,
                "total": sum(r["value"] for r in revenue_data)
            }
        }
        
    except Exception as e:
        print(f"Error getting revenue statistics: {str(e)}")
        raise ValueError(f"Failed to get revenue statistics: {str(e)}")


def export_transactions(body: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Export transactions to CSV
    
    Args:
        body: Export parameters (format, dateRange)
        user_id: User requesting export
        
    Returns:
        Export URL
    """
    export_format = body.get("format", "CSV")
    date_range = body.get("dateRange")  # Format: {"start": "...", "end": "..."}
    
    if export_format != "CSV":
        raise ValueError("Only CSV format is supported")
    
    try:
        # Get transactions
        query_params = {}
        if date_range:
            query_params["dateRange"] = f"{date_range['start']},{date_range['end']}"
        
        transactions_response = list_transactions(query_params)
        transactions = transactions_response["transactions"]
        
        # Generate CSV content
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "transactionId", "razorpayPaymentId", "userId", "userName",
                "templeId", "templeName", "amount", "currency", "status",
                "paymentMethod", "createdAt", "capturedAt", "refundedAt",
                "refundAmount", "refundReason"
            ]
        )
        
        writer.writeheader()
        for transaction in transactions:
            writer.writerow({
                "transactionId": transaction.get("transactionId", ""),
                "razorpayPaymentId": transaction.get("razorpayPaymentId", ""),
                "userId": transaction.get("userId", ""),
                "userName": transaction.get("userName", ""),
                "templeId": transaction.get("templeId", ""),
                "templeName": transaction.get("templeName", ""),
                "amount": transaction.get("amount", 0),
                "currency": transaction.get("currency", ""),
                "status": transaction.get("status", ""),
                "paymentMethod": transaction.get("paymentMethod", ""),
                "createdAt": transaction.get("createdAt", ""),
                "capturedAt": transaction.get("capturedAt", ""),
                "refundedAt": transaction.get("refundedAt", ""),
                "refundAmount": transaction.get("refundAmount", ""),
                "refundReason": transaction.get("refundReason", "")
            })
        
        csv_content = output.getvalue()
        
        # Upload to S3
        s3_client = boto3.client("s3")
        export_id = str(uuid.uuid4())
        filename = f"transactions_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        s3_key = f"exports/{export_id}/{filename}"
        
        s3_client.put_object(
            Bucket=EXPORTS_BUCKET,
            Key=s3_key,
            Body=csv_content.encode("utf-8"),
            ContentType="text/csv"
        )
        
        # Generate pre-signed URL (valid for 1 hour)
        export_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": EXPORTS_BUCKET, "Key": s3_key},
            ExpiresIn=3600
        )
        
        expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        # Log audit entry
        log_audit_entry(
            user_id=user_id,
            action="EXPORT_TRANSACTIONS",
            resource="transactions",
            resource_id=export_id,
            after={
                "format": export_format,
                "count": len(transactions),
                "exportUrl": export_url
            }
        )
        
        return {
            "exportUrl": export_url,
            "expiresAt": expires_at,
            "filename": filename,
            "count": len(transactions)
        }
        
    except Exception as e:
        print(f"Error exporting transactions: {str(e)}")
        raise ValueError(f"Failed to export transactions: {str(e)}")


def log_audit_entry(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log action to audit trail
    
    Args:
        user_id: User ID
        action: Action performed
        resource: Resource type
        resource_id: Resource ID
        before: State before action
        after: State after action
    """
    try:
        audit_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Calculate TTL (365 days from now)
        import time
        ttl = int(time.time()) + (365 * 24 * 60 * 60)
        
        audit_entry = {
            "auditId": audit_id,
            "timestamp": timestamp,
            "userId": user_id,
            "userName": user_id,  # Would need to fetch from user table
            "action": action,
            "resource": resource,
            "resourceId": resource_id,
            "success": True,
            "ttl": ttl,
        }
        
        if before:
            audit_entry["before"] = json.loads(json.dumps(before, cls=DecimalEncoder))
        if after:
            audit_entry["after"] = json.loads(json.dumps(after, cls=DecimalEncoder))
        
        audit_log_table.put_item(Item=audit_entry)
        
    except Exception as e:
        print(f"Error logging audit trail: {str(e)}")
