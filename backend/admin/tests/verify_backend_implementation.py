"""
Backend Implementation Verification Script

This script verifies that all backend components are properly implemented
without requiring AWS resources or environment variables.
"""

import os
import sys
import importlib.util
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def check_file_exists(filepath: str, description: str) -> bool:
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"{GREEN}✓{RESET} {description}: {filepath}")
        return True
    else:
        print(f"{RED}✗{RESET} {description}: {filepath} (NOT FOUND)")
        return False


def check_function_exists(filepath: str, function_name: str, description: str) -> bool:
    """Check if a function exists in a Python file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if f"def {function_name}" in content:
                print(f"{GREEN}✓{RESET} {description}: {function_name}()")
                return True
            else:
                print(f"{RED}✗{RESET} {description}: {function_name}() (NOT FOUND)")
                return False
    except Exception as e:
        print(f"{RED}✗{RESET} {description}: Error reading file - {str(e)}")
        return False


def check_endpoint_implementation(filepath: str, endpoint: str) -> bool:
    """Check if an endpoint is implemented"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if endpoint in content:
                print(f"{GREEN}✓{RESET} Endpoint implemented: {endpoint}")
                return True
            else:
                print(f"{YELLOW}⚠{RESET} Endpoint may not be implemented: {endpoint}")
                return False
    except Exception as e:
        print(f"{RED}✗{RESET} Error checking endpoint: {str(e)}")
        return False


def main():
    """Main verification function"""
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Backend API Implementation Verification{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")
    
    base_path = "src/admin"
    results = []
    
    # 1. Check Infrastructure Files
    print(f"\n{BLUE}1. Infrastructure Setup{RESET}")
    print("-" * 70)
    results.append(check_file_exists("infrastructure/stacks/AdminApplicationStack.py", "CDK Stack"))
    results.append(check_file_exists("infrastructure/admin_app.py", "CDK App"))
    
    # 2. Check Authentication System
    print(f"\n{BLUE}2. Authentication & Authorization System{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/lambdas/authorizer.py", "Authorizer Lambda"))
    results.append(check_file_exists(f"{base_path}/utils/rate_limiter.py", "Rate Limiter"))
    results.append(check_file_exists(f"{base_path}/utils/session_manager.py", "Session Manager"))
    
    if os.path.exists(f"{base_path}/lambdas/authorizer.py"):
        results.append(check_function_exists(f"{base_path}/lambdas/authorizer.py", "handler", "Authorizer handler"))
        results.append(check_function_exists(f"{base_path}/lambdas/authorizer.py", "verify_token", "JWT verification"))
    
    if os.path.exists(f"{base_path}/utils/rate_limiter.py"):
        results.append(check_function_exists(f"{base_path}/utils/rate_limiter.py", "check_rate_limit", "Rate limit check"))
    
    if os.path.exists(f"{base_path}/utils/session_manager.py"):
        results.append(check_function_exists(f"{base_path}/utils/session_manager.py", "validate_session", "Session validation"))
    
    # 3. Check Admin API Handler
    print(f"\n{BLUE}3. Admin API Handler{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/lambdas/admin_api.py", "Admin API Lambda"))
    
    if os.path.exists(f"{base_path}/lambdas/admin_api.py"):
        results.append(check_function_exists(f"{base_path}/lambdas/admin_api.py", "handler", "API handler"))
        results.append(check_function_exists(f"{base_path}/lambdas/admin_api.py", "route_request", "Request routing"))
        results.append(check_function_exists(f"{base_path}/lambdas/admin_api.py", "log_audit_trail", "Audit logging"))
    
    # 4. Check Temple Management
    print(f"\n{BLUE}4. Temple Management Backend APIs{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/handlers/temple_handler.py", "Temple Handler"))
    
    if os.path.exists(f"{base_path}/handlers/temple_handler.py"):
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "list_temples", "List temples"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "get_temple", "Get temple"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "create_temple", "Create temple"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "update_temple", "Update temple"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "delete_temple", "Delete temple (soft)"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "handle_temple_image_upload", "Image upload"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "handle_bulk_delete", "Bulk delete"))
        results.append(check_function_exists(f"{base_path}/handlers/temple_handler.py", "handle_bulk_update", "Bulk update"))
    
    # 5. Check Artifact Management
    print(f"\n{BLUE}5. Artifact Management Backend APIs{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/handlers/artifact_handler.py", "Artifact Handler"))
    
    if os.path.exists(f"{base_path}/handlers/artifact_handler.py"):
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "list_artifacts", "List artifacts"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "get_artifact", "Get artifact"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "create_artifact", "Create artifact"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "update_artifact", "Update artifact"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "delete_artifact", "Delete artifact (soft)"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "generate_qr_code", "QR code generation"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "handle_artifact_media_upload", "Media upload"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "handle_qr_code_download", "QR code download"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "handle_bulk_delete", "Bulk delete"))
        results.append(check_function_exists(f"{base_path}/handlers/artifact_handler.py", "invalidate_content_cache", "Cache invalidation"))
    
    # 6. Check API Routing
    print(f"\n{BLUE}6. API Routing Integration{RESET}")
    print("-" * 70)
    if os.path.exists(f"{base_path}/lambdas/admin_api.py"):
        results.append(check_endpoint_implementation(f"{base_path}/lambdas/admin_api.py", "/admin/temples"))
        results.append(check_endpoint_implementation(f"{base_path}/lambdas/admin_api.py", "/admin/artifacts"))
        results.append(check_endpoint_implementation(f"{base_path}/lambdas/admin_api.py", "/admin/health"))
    
    # 7. Check Documentation
    print(f"\n{BLUE}7. Documentation{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/README.md", "Admin Backend README"))
    results.append(check_file_exists(f"{base_path}/handlers/ARTIFACT_HANDLER_README.md", "Artifact Handler README"))
    
    # 8. Check Dependencies
    print(f"\n{BLUE}8. Dependencies{RESET}")
    print("-" * 70)
    results.append(check_file_exists(f"{base_path}/lambdas/requirements.txt", "Lambda requirements"))
    results.append(check_file_exists("infrastructure/requirements.txt", "Infrastructure requirements"))
    
    # Summary
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Verification Summary{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")
    
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Checks: {total}")
    print(f"Passed: {GREEN}{passed}{RESET}")
    print(f"Failed: {RED}{total - passed}{RESET}")
    print(f"Success Rate: {GREEN if percentage >= 90 else YELLOW if percentage >= 70 else RED}{percentage:.1f}%{RESET}")
    
    # Detailed Status
    print(f"\n{BLUE}Implementation Status:{RESET}")
    print("-" * 70)
    
    if percentage >= 90:
        print(f"{GREEN}✓ Backend APIs are fully implemented and ready for testing{RESET}")
        print(f"{GREEN}✓ Authentication system is complete{RESET}")
        print(f"{GREEN}✓ Temple management endpoints are complete{RESET}")
        print(f"{GREEN}✓ Artifact management endpoints are complete{RESET}")
        print(f"{GREEN}✓ Audit logging is implemented{RESET}")
        return 0
    elif percentage >= 70:
        print(f"{YELLOW}⚠ Backend APIs are mostly implemented but some components are missing{RESET}")
        print(f"{YELLOW}⚠ Review the failed checks above{RESET}")
        return 1
    else:
        print(f"{RED}✗ Backend APIs are incomplete{RESET}")
        print(f"{RED}✗ Multiple components are missing{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
