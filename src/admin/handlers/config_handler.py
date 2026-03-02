"""
System Configuration Handler

Handles CRUD operations for system configuration including language settings,
Bedrock settings, Polly settings, payment settings, and session settings.
"""

import json
import os
from typing import Dict, Any, List, Optional
import boto3
from datetime import datetime
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource("dynamodb")
eventbridge = boto3.client("events")
system_config_table = dynamodb.Table("SanaathanaAalayaCharithra-SystemConfiguration")
audit_log_table = dynamodb.Table("SanaathanaAalayaCharithra-AuditLog")

# Environment variables
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "SanaathanaAalayaCharithra-EventBus")


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handle_config_request(
    method: str,
    path: str,
    body: Dict[str, Any],
    query_params: Dict[str, str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Route configuration management requests
    
    Args:
        method: HTTP method
        path: Request path
        body: Request body
        query_params: Query parameters
        user_id: User ID making the request
        
    Returns:
        Response data
    """
    # Extract configId from path if present
    path_parts = path.split("/")
    config_id = None
    
    # Check for configId in path (e.g., /admin/config/{configId})
    if len(path_parts) > 3:
        config_id = path_parts[3]
    
    # Configuration history endpoint
    if method == "GET" and config_id and "/history" in path:
        return get_config_history(config_id, query_params)
    
    # Configuration validation endpoint
    if method == "POST" and "/validate" in path:
        return validate_config(body)
    
    # Standard CRUD operations
    if method == "GET" and not config_id:
        # List configurations
        return list_configs(query_params)
    
    elif method == "GET" and config_id:
        # Get single configuration
        return get_config(config_id)
    
    elif method == "PUT" and config_id:
        # Update configuration
        return update_config(config_id, body, user_id)
    
    else:
        raise ValueError(f"Invalid config request: {method} {path}")


def list_configs(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List system configurations with optional category filter
    
    Args:
        query_params: Query parameters (category)
        
    Returns:
        List of configurations
    """
    category_filter = query_params.get("category")
    
    # Scan or query based on filter
    if category_filter:
        # Query by category prefix
        response = system_config_table.scan(
            FilterExpression="begins_with(configId, :category)",
            ExpressionAttributeValues={":category": f"{category_filter}#"}
        )
    else:
        # Scan all configurations
        response = system_config_table.scan()
    
    items = response.get("Items", [])
    
    # Sort by configId
    items.sort(key=lambda x: x.get("configId", ""))
    
    return {
        "configurations": json.loads(json.dumps(items, cls=DecimalEncoder))
    }


def get_config(config_id: str) -> Dict[str, Any]:
    """
    Get single configuration by ID
    
    Args:
        config_id: Configuration ID (format: category#key)
        
    Returns:
        Configuration data
    """
    response = system_config_table.get_item(Key={"configId": config_id})
    
    if "Item" not in response:
        raise ValueError(f"Configuration not found: {config_id}")
    
    config = response["Item"]
    
    return {
        "configuration": json.loads(json.dumps(config, cls=DecimalEncoder))
    }


def update_config(config_id: str, body: Dict[str, Any], updater_id: str) -> Dict[str, Any]:
    """
    Update system configuration
    
    Args:
        config_id: Configuration ID
        body: Updated configuration data (must include 'settings')
        updater_id: User performing the update
        
    Returns:
        Updated configuration data
    """
    # Validate required fields
    if "settings" not in body:
        raise ValueError("Missing required field: settings")
    
    settings = body["settings"]
    
    # Extract category from configId
    category = config_id.split("#")[0] if "#" in config_id else "UNKNOWN"
    
    # Validate configuration values
    validation_result = validate_config({"category": category, "settings": settings})
    if not validation_result.get("valid"):
        raise ValueError(f"Invalid configuration: {', '.join(validation_result.get('errors', []))}")
    
    # Get existing configuration to track changes
    existing_config = None
    try:
        response = system_config_table.get_item(Key={"configId": config_id})
        existing_config = response.get("Item")
    except Exception:
        pass
    
    # Increment version
    current_version = existing_config.get("version", 0) if existing_config else 0
    new_version = current_version + 1
    
    # Create updated configuration
    timestamp = datetime.utcnow().isoformat()
    updated_config = {
        "configId": config_id,
        "category": category,
        "settings": settings,
        "updatedAt": timestamp,
        "updatedBy": updater_id,
        "version": new_version,
    }
    
    # Save to DynamoDB
    system_config_table.put_item(Item=updated_config)
    
    # Log audit trail
    log_audit_entry(
        user_id=updater_id,
        action="UPDATE_CONFIG",
        resource="SystemConfiguration",
        resource_id=config_id,
        before=existing_config.get("settings") if existing_config else None,
        after=settings,
    )
    
    # Notify affected Lambda functions via EventBridge
    notify_config_change(config_id, category, settings)
    
    return {
        "configuration": json.loads(json.dumps(updated_config, cls=DecimalEncoder)),
        "message": "Configuration updated successfully"
    }


def get_config_history(config_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Get configuration change history
    
    Args:
        config_id: Configuration ID
        query_params: Query parameters (page, limit)
        
    Returns:
        Configuration history
    """
    # Parse query parameters
    page = int(query_params.get("page", "1"))
    limit = int(query_params.get("limit", "50"))
    
    # Query audit log for this configuration
    query_params_db = {
        "IndexName": "ResourceIndex",
        "KeyConditionExpression": "#resource = :resource",
        "FilterExpression": "resourceId = :resourceId",
        "ExpressionAttributeNames": {"#resource": "resource"},
        "ExpressionAttributeValues": {
            ":resource": "SystemConfiguration",
            ":resourceId": config_id,
        },
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
        "history": json.loads(json.dumps(paginated_items, cls=DecimalEncoder)),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


def validate_config(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate configuration values
    
    Args:
        body: Configuration data (category, settings)
        
    Returns:
        Validation result
    """
    category = body.get("category")
    settings = body.get("settings", {})
    
    errors = []
    
    # Validate based on category
    if category == "LANGUAGES":
        errors.extend(validate_language_config(settings))
    elif category == "BEDROCK":
        errors.extend(validate_bedrock_config(settings))
    elif category == "POLLY":
        errors.extend(validate_polly_config(settings))
    elif category == "PAYMENT":
        errors.extend(validate_payment_config(settings))
    elif category == "SESSION":
        errors.extend(validate_session_config(settings))
    elif category == "QR":
        errors.extend(validate_qr_config(settings))
    else:
        errors.append(f"Unknown configuration category: {category}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors if errors else None
    }


def validate_language_config(settings: Dict[str, Any]) -> List[str]:
    """Validate language configuration"""
    errors = []
    
    if "supportedLanguages" not in settings:
        errors.append("Missing required field: supportedLanguages")
        return errors
    
    supported_languages = settings["supportedLanguages"]
    
    if not isinstance(supported_languages, list):
        errors.append("supportedLanguages must be a list")
        return errors
    
    if len(supported_languages) == 0:
        errors.append("At least one language must be supported")
    
    for lang in supported_languages:
        if not isinstance(lang, dict):
            errors.append("Each language must be an object")
            continue
        
        if "code" not in lang or "name" not in lang or "enabled" not in lang:
            errors.append("Each language must have code, name, and enabled fields")
        
        if "code" in lang and not isinstance(lang["code"], str):
            errors.append("Language code must be a string")
        
        if "enabled" in lang and not isinstance(lang["enabled"], bool):
            errors.append("Language enabled must be a boolean")
    
    return errors


def validate_bedrock_config(settings: Dict[str, Any]) -> List[str]:
    """Validate Bedrock configuration"""
    errors = []
    
    required_fields = ["modelId", "temperature", "maxTokens"]
    for field in required_fields:
        if field not in settings:
            errors.append(f"Missing required field: {field}")
    
    if "temperature" in settings:
        temp = settings["temperature"]
        if not isinstance(temp, (int, float)) or temp < 0 or temp > 1:
            errors.append("temperature must be a number between 0 and 1")
    
    if "maxTokens" in settings:
        max_tokens = settings["maxTokens"]
        if not isinstance(max_tokens, int) or max_tokens < 1 or max_tokens > 100000:
            errors.append("maxTokens must be an integer between 1 and 100000")
    
    if "topP" in settings:
        top_p = settings["topP"]
        if not isinstance(top_p, (int, float)) or top_p < 0 or top_p > 1:
            errors.append("topP must be a number between 0 and 1")
    
    return errors


def validate_polly_config(settings: Dict[str, Any]) -> List[str]:
    """Validate Polly configuration"""
    errors = []
    
    if "voicesByLanguage" not in settings:
        errors.append("Missing required field: voicesByLanguage")
        return errors
    
    voices = settings["voicesByLanguage"]
    
    if not isinstance(voices, dict):
        errors.append("voicesByLanguage must be an object")
        return errors
    
    for lang_code, voice_config in voices.items():
        if not isinstance(voice_config, dict):
            errors.append(f"Voice config for {lang_code} must be an object")
            continue
        
        if "voiceId" not in voice_config:
            errors.append(f"Missing voiceId for language {lang_code}")
        
        if "engine" in voice_config:
            engine = voice_config["engine"]
            if engine not in ["standard", "neural"]:
                errors.append(f"Invalid engine for {lang_code}: must be 'standard' or 'neural'")
    
    if "outputFormat" in settings:
        output_format = settings["outputFormat"]
        if output_format not in ["mp3", "ogg_vorbis", "pcm"]:
            errors.append("outputFormat must be one of: mp3, ogg_vorbis, pcm")
    
    return errors


def validate_payment_config(settings: Dict[str, Any]) -> List[str]:
    """Validate payment configuration"""
    errors = []
    
    required_fields = ["razorpayKeyId", "currency"]
    for field in required_fields:
        if field not in settings:
            errors.append(f"Missing required field: {field}")
    
    if "currency" in settings:
        currency = settings["currency"]
        if not isinstance(currency, str) or len(currency) != 3:
            errors.append("currency must be a 3-letter ISO code (e.g., INR, USD)")
    
    if "subscriptionPlans" in settings:
        plans = settings["subscriptionPlans"]
        if not isinstance(plans, list):
            errors.append("subscriptionPlans must be a list")
        else:
            for plan in plans:
                if not isinstance(plan, dict):
                    errors.append("Each subscription plan must be an object")
                    continue
                
                required_plan_fields = ["planId", "name", "price", "duration"]
                for field in required_plan_fields:
                    if field not in plan:
                        errors.append(f"Missing required field in subscription plan: {field}")
                
                if "price" in plan and not isinstance(plan["price"], (int, float)):
                    errors.append("Subscription plan price must be a number")
                
                if "duration" in plan and not isinstance(plan["duration"], int):
                    errors.append("Subscription plan duration must be an integer (days)")
    
    return errors


def validate_session_config(settings: Dict[str, Any]) -> List[str]:
    """Validate session configuration"""
    errors = []
    
    if "timeoutMinutes" in settings:
        timeout = settings["timeoutMinutes"]
        if not isinstance(timeout, int) or timeout < 5 or timeout > 1440:
            errors.append("timeoutMinutes must be an integer between 5 and 1440 (24 hours)")
    
    if "mfaRequired" in settings:
        mfa = settings["mfaRequired"]
        if not isinstance(mfa, bool):
            errors.append("mfaRequired must be a boolean")
    
    return errors


def validate_qr_config(settings: Dict[str, Any]) -> List[str]:
    """Validate QR code configuration"""
    errors = []
    
    if "expirationDays" in settings:
        expiration = settings["expirationDays"]
        if not isinstance(expiration, int) or expiration < 0:
            errors.append("expirationDays must be a non-negative integer")
    
    if "errorCorrectionLevel" in settings:
        level = settings["errorCorrectionLevel"]
        if level not in ["L", "M", "Q", "H"]:
            errors.append("errorCorrectionLevel must be one of: L, M, Q, H")
    
    return errors


def notify_config_change(config_id: str, category: str, settings: Dict[str, Any]) -> None:
    """
    Notify affected Lambda functions of configuration changes via EventBridge
    
    Args:
        config_id: Configuration ID
        category: Configuration category
        settings: Updated settings
    """
    try:
        # Create event detail
        event_detail = {
            "configId": config_id,
            "category": category,
            "settings": settings,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Put event to EventBridge
        response = eventbridge.put_events(
            Entries=[
                {
                    "Source": "admin.config",
                    "DetailType": "ConfigurationUpdated",
                    "Detail": json.dumps(event_detail, cls=DecimalEncoder),
                    "EventBusName": EVENT_BUS_NAME,
                }
            ]
        )
        
        print(f"Configuration change notification sent: {response}")
        
    except Exception as e:
        print(f"Error sending configuration change notification: {str(e)}")
        # Don't fail the update if notification fails


def log_audit_entry(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str,
    before: Optional[Any] = None,
    after: Optional[Any] = None,
) -> None:
    """
    Log audit trail entry
    
    Args:
        user_id: User performing the action
        action: Action performed
        resource: Resource type
        resource_id: Resource ID
        before: Before value (for updates)
        after: After value (for updates)
    """
    try:
        # Generate audit ID (ULID-like)
        audit_id = f"{int(datetime.utcnow().timestamp() * 1000)}-{user_id[:8]}"
        timestamp = datetime.utcnow().isoformat()
        
        # Create audit log entry
        audit_entry = {
            "auditId": audit_id,
            "timestamp": timestamp,
            "userId": user_id,
            "action": action,
            "resource": resource,
            "resourceId": resource_id,
            "success": True,
        }
        
        if before is not None:
            audit_entry["before"] = before
        
        if after is not None:
            audit_entry["after"] = after
        
        # Set TTL (365 days retention)
        ttl = int(datetime.utcnow().timestamp()) + (365 * 24 * 60 * 60)
        audit_entry["ttl"] = ttl
        
        # Save to audit log table
        audit_log_table.put_item(Item=audit_entry)
        
    except Exception as e:
        print(f"Error logging audit entry: {str(e)}")
        # Don't fail the operation if audit logging fails
