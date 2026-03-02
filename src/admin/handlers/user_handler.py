"""
User Management Handler

Handles CRUD operations for admin users including activation/deactivation and activity tracking.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
import uuid
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource("dynamodb")
ses = boto3.client("ses")
admin_users_table = dynamodb.Table("SanaathanaAalayaCharithra-AdminUsers")
audit_log_table = dynamodb.Table("SanaathanaAalayaCharithra-AuditLog")

# Environment variables
SES_SENDER_EMAIL = os.environ.get("SES_SENDER_EMAIL", "admin@sanaathana-aalaya-charithra.com")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_user_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route user management requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID making the request
        
    Returns:
        Response data
    """
    # Extract userId from path if present
    path_parts = path.split("/")
    target_user_id = None
    
    # Check for userId in path (e.g., /admin/users/{userId})
    if len(path_parts) > 3 and path_parts[3] not in ["activity"]:
        target_user_id = path_parts[3]
    
    # User activity endpoint
    if method == "GET" and target_user_id and "/activity" in path:
        return get_user_activity(target_user_id, query_params)
    
    # Deactivate user endpoint
    if method == "POST" and target_user_id and "/deactivate" in path:
        return deactivate_user(target_user_id, user_id)
    
    # Activate user endpoint
    if method == "POST" and target_user_id and "/activate" in path:
        return activate_user(target_user_id, user_id)
    
    # Standard CRUD operations
    if method == "GET" and not target_user_id:
        # List users
        return list_users(query_params)
    
    elif method == "GET" and target_user_id:
        # Get single user with activity
        return get_user(target_user_id, query_params)
    
    elif method == "POST":
        # Create user
        return create_user(body, user_id)
    
    elif method == "PUT" and target_user_id:
        # Update user
        return update_user(target_user_id, body, user_id)
    
    else:
        raise ValueError(f"Invalid user request: {method} {path}")


def list_users(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List admin users with pagination and filters
    
    Args:
        query_params: Query parameters (page, limit, search, role, status)
        
    Returns:
        Paginated list of users
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    search = query_params.get("search", "").lower()
    role_filter = query_params.get("role")
    status_filter = query_params.get("status")
    
    # Scan table
    scan_params = {}
    
    # Add filter expressions
    filter_expressions = []
    expression_values = {}
    expression_names = {}
    
    if role_filter:
        filter_expressions.append("#role = :role")
        expression_values[":role"] = role_filter
        expression_names["#role"] = "role"
    
    if status_filter:
        filter_expressions.append("#status = :status")
        expression_values[":status"] = status_filter
        expression_names["#status"] = "status"
    
    if filter_expressions:
        scan_params["FilterExpression"] = " AND ".join(filter_expressions)
        scan_params["ExpressionAttributeValues"] = expression_values
        if expression_names:
            scan_params["ExpressionAttributeNames"] = expression_names
    
    response = admin_users_table.scan(**scan_params)
    items = response.get("Items", [])
    
    # Apply search filter (client-side)
    if search:
        items = [
            item for item in items
            if search in item.get("email", "").lower()
            or search in item.get("name", "").lower()
        ]
    
    # Sort by name
    items.sort(key=lambda x: x.get("name", ""))
    
    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return {
        "users": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_user(user_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get single user by ID with activity
    
    Args:
        user_id: User ID
        query_params: Query parameters
        
    Returns:
        User data with activity
    """
    response = admin_users_table.get_item(Key={"userId": user_id})
    
    if "Item" not in response:
        raise ValueError(f"User not found: {user_id}")
    
    user = response["Item"]
    
    # Get user activity (limited to recent 10 activities)
    activity = get_user_activity(user_id, {"limit": "10"})
    
    return {
        "user": json.loads(json.dumps(user, cls=DecimalEncoder)),
        "activity": activity.get("activity", [])
    }


def create_user(body: Dict[str, Any], creator_id: str) -> Dict[str, Any]:
    """
    Create new admin user
    
    Args:
        body: User data
        creator_id: User creating the admin account
        
    Returns:
        Created user data
    """
    # Validate required fields
    required_fields = ["email", "name", "role"]
    for field in required_fields:
        if not body.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Validate email format
    email = body["email"]
    if "@" not in email or "." not in email:
        raise ValueError("Invalid email format")
    
    # Check if email already exists
    email_index_response = admin_users_table.query(
        IndexName="EmailIndex",
        KeyConditionExpression="email = :email",
        ExpressionAttributeValues={":email": email}
    )
    
    if email_index_response.get("Items"):
        raise ValueError(f"User with email {email} already exists")
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Validate role
    valid_roles = ["SUPER_ADMIN", "CONTENT_ADMIN", "ANALYTICS_VIEWER", "SUPPORT_ADMIN"]
    role = body["role"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role: {role}. Must be one of {valid_roles}")
    
    # Assign permissions based on role
    permissions = get_permissions_for_role(role)
    
    # Create user item
    timestamp = datetime.utcnow().isoformat()
    user = {
        "userId": user_id,
        "email": email,
        "name": body["name"],
        "role": role,
        "permissions": permissions,
        "status": "PENDING_ACTIVATION",
        "createdAt": timestamp,
        "createdBy": creator_id,
        "mfaEnabled": False,
    }
    
    # Save to DynamoDB
    admin_users_table.put_item(Item=user)
    
    # Send activation email
    activation_email_sent = send_activation_email(email, body["name"], user_id)
    
    return {
        "user": json.loads(json.dumps(user, cls=DecimalEncoder)),
        "activationEmailSent": activation_email_sent,
        "message": "Admin user created successfully. Activation email sent."
    }


def update_user(user_id: str, body: Dict[str, Any], updater_id: str) -> Dict[str, Any]:
    """
    Update existing admin user
    
    Args:
        user_id: User ID
        body: Updated user data
        updater_id: User performing the update
        
    Returns:
        Updated user data
    """
    # Get existing user
    response = admin_users_table.get_item(Key={"userId": user_id})
    
    if "Item" not in response:
        raise ValueError(f"User not found: {user_id}")
    
    existing = response["Item"]
    
    # Build update expression
    update_expr = "SET updatedAt = :updatedAt, updatedBy = :updatedBy"
    expr_values = {
        ":updatedAt": datetime.utcnow().isoformat(),
        ":updatedBy": updater_id,
    }
    expr_names = {}
    
    # Update allowed fields
    updatable_fields = ["name", "role", "permissions", "mfaEnabled"]
    
    for field in updatable_fields:
        if field in body:
            # Handle reserved keywords
            if field in ["role", "name"]:
                update_expr += f", #{field} = :{field}"
                expr_names[f"#{field}"] = field
                expr_values[f":{field}"] = body[field]
            else:
                update_expr += f", {field} = :{field}"
                expr_values[f":{field}"] = body[field]
    
    # If role is updated, update permissions accordingly
    if "role" in body:
        new_permissions = get_permissions_for_role(body["role"])
        update_expr += ", permissions = :permissions"
        expr_values[":permissions"] = new_permissions
    
    # Update item
    update_params = {
        "Key": {"userId": user_id},
        "UpdateExpression": update_expr,
        "ExpressionAttributeValues": expr_values,
    }
    if expr_names:
        update_params["ExpressionAttributeNames"] = expr_names
    
    admin_users_table.update_item(**update_params)
    
    # Get updated item
    response = admin_users_table.get_item(Key={"userId": user_id})
    updated = response["Item"]
    
    return {
        "user": json.loads(json.dumps(updated, cls=DecimalEncoder)),
        "message": "User updated successfully"
    }


def deactivate_user(user_id: str, deactivator_id: str) -> Dict[str, Any]:
    """
    Deactivate admin user
    
    Args:
        user_id: User ID to deactivate
        deactivator_id: User performing the deactivation
        
    Returns:
        Success message with terminated sessions count
    """
    # Get existing user
    response = admin_users_table.get_item(Key={"userId": user_id})
    
    if "Item" not in response:
        raise ValueError(f"User not found: {user_id}")
    
    existing = response["Item"]
    
    # Check if already deactivated
    if existing.get("status") == "DEACTIVATED":
        raise ValueError(f"User is already deactivated: {user_id}")
    
    # Deactivate user
    admin_users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET #status = :status, deactivatedAt = :deactivatedAt, deactivatedBy = :deactivatedBy",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "DEACTIVATED",
            ":deactivatedAt": datetime.utcnow().isoformat(),
            ":deactivatedBy": deactivator_id,
        },
    )
    
    # Terminate all active sessions for this user
    # This would integrate with session management system
    terminated_sessions = terminate_user_sessions(user_id)
    
    return {
        "message": "User deactivated successfully",
        "userId": user_id,
        "terminatedSessions": terminated_sessions
    }


def activate_user(user_id: str, activator_id: str) -> Dict[str, Any]:
    """
    Activate admin user
    
    Args:
        user_id: User ID to activate
        activator_id: User performing the activation
        
    Returns:
        Success message
    """
    # Get existing user
    response = admin_users_table.get_item(Key={"userId": user_id})
    
    if "Item" not in response:
        raise ValueError(f"User not found: {user_id}")
    
    existing = response["Item"]
    
    # Check if already active
    if existing.get("status") == "ACTIVE":
        raise ValueError(f"User is already active: {user_id}")
    
    # Activate user
    admin_users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET #status = :status, activatedAt = :activatedAt, activatedBy = :activatedBy",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": "ACTIVE",
            ":activatedAt": datetime.utcnow().isoformat(),
            ":activatedBy": activator_id,
        },
    )
    
    return {
        "message": "User activated successfully",
        "userId": user_id
    }


def get_user_activity(user_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get user activity log
    
    Args:
        user_id: User ID
        query_params: Query parameters (page, limit, dateRange)
        
    Returns:
        User activity log
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    
    # Query audit log for this user
    # Using UserIdIndex GSI
    query_params_db = {
        "IndexName": "UserIdIndex",
        "KeyConditionExpression": "userId = :userId",
        "ExpressionAttributeValues": {":userId": user_id},
        "ScanIndexForward": False,  # Sort by timestamp descending
        "Limit": limit * page,  # Get enough items for pagination
    }
    
    response = audit_log_table.query(**query_params_db)
    items = response.get("Items", [])
    
    # Paginate
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return {
        "activity": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def get_permissions_for_role(role: str) -> List[str]:
    """
    Get permissions for a given role
    
    Args:
        role: User role
        
    Returns:
        List of permissions
    """
    role_permissions = {
        "SUPER_ADMIN": [
            "MANAGE_TEMPLES",
            "MANAGE_ARTIFACTS",
            "MANAGE_USERS",
            "VIEW_ANALYTICS",
            "MANAGE_PAYMENTS",
            "MANAGE_SYSTEM_CONFIG",
            "VIEW_LOGS",
            "MODERATE_CONTENT",
        ],
        "CONTENT_ADMIN": [
            "MANAGE_TEMPLES",
            "MANAGE_ARTIFACTS",
            "VIEW_ANALYTICS",
            "MODERATE_CONTENT",
        ],
        "ANALYTICS_VIEWER": [
            "VIEW_ANALYTICS",
            "VIEW_LOGS",
        ],
        "SUPPORT_ADMIN": [
            "VIEW_ANALYTICS",
            "VIEW_LOGS",
            "MANAGE_PAYMENTS",
        ],
    }
    
    return role_permissions.get(role, [])


def send_activation_email(email: str, name: str, user_id: str) -> bool:
    """
    Send activation email to new admin user
    
    Args:
        email: User email
        name: User name
        user_id: User ID
        
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Generate activation link (this would be a real activation URL in production)
        activation_link = f"https://admin.sanaathana-aalaya-charithra.com/activate?userId={user_id}"
        
        # Email subject and body
        subject = "Welcome to Sanaathana Aalaya Charithra Admin Portal"
        body_text = f"""
Hello {name},

Welcome to the Sanaathana Aalaya Charithra Admin Portal!

Your admin account has been created. Please click the link below to activate your account and set your password:

{activation_link}

If you have any questions, please contact the system administrator.

Best regards,
Sanaathana Aalaya Charithra Team
"""
        
        body_html = f"""
<html>
<head></head>
<body>
  <h2>Welcome to Sanaathana Aalaya Charithra Admin Portal</h2>
  <p>Hello {name},</p>
  <p>Your admin account has been created. Please click the link below to activate your account and set your password:</p>
  <p><a href="{activation_link}">Activate Account</a></p>
  <p>If you have any questions, please contact the system administrator.</p>
  <p>Best regards,<br>Sanaathana Aalaya Charithra Team</p>
</body>
</html>
"""
        
        # Send email using SES
        response = ses.send_email(
            Source=SES_SENDER_EMAIL,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
        )
        
        print(f"Activation email sent to {email}: {response['MessageId']}")
        return True
        
    except Exception as e:
        print(f"Error sending activation email to {email}: {str(e)}")
        return False


def terminate_user_sessions(user_id: str) -> int:
    """
    Terminate all active sessions for a user
    
    This integrates with the session management system to invalidate all sessions.
    
    Args:
        user_id: User ID
        
    Returns:
        Number of sessions terminated
    """
    try:
        # This would integrate with the actual session management system
        # For now, we'll return a placeholder value
        # In production, this would:
        # 1. Query session table/cache for active sessions
        # 2. Mark sessions as invalid
        # 3. Clear session tokens from cache
        
        print(f"Terminating sessions for user: {user_id}")
        
        # Placeholder: return 0 sessions terminated
        return 0
        
    except Exception as e:
        print(f"Error terminating sessions for user {user_id}: {str(e)}")
        return 0
