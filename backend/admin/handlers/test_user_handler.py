"""
Unit tests for user_handler.py

Basic tests to verify user management CRUD operations.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from user_handler import (
    handle_user_request,
    list_users,
    get_user,
    create_user,
    update_user,
    deactivate_user,
    activate_user,
    get_user_activity,
    get_permissions_for_role,
)


class TestUserHandler:
    """Test user handler functions"""
    
    @patch('user_handler.admin_users_table')
    def test_list_users_basic(self, mock_table):
        """Test listing users with basic parameters"""
        # Mock DynamoDB response
        mock_table.scan.return_value = {
            "Items": [
                {
                    "userId": "user-1",
                    "email": "admin@example.com",
                    "name": "Test Admin",
                    "role": "SUPER_ADMIN",
                    "status": "ACTIVE",
                    "createdAt": "2024-01-01T00:00:00",
                }
            ]
        }
        
        # Call function
        result = list_users({"page": "1", "limit": "50"})
        
        # Assertions
        assert "users" in result
        assert "pagination" in result
        assert len(result["users"]) == 1
        assert result["users"][0]["email"] == "admin@example.com"
        assert result["pagination"]["total"] == 1
    
    @patch('user_handler.admin_users_table')
    @patch('user_handler.get_user_activity')
    def test_get_user_success(self, mock_activity, mock_table):
        """Test getting a single user"""
        # Mock DynamoDB response
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "user-1",
                "email": "admin@example.com",
                "name": "Test Admin",
                "role": "SUPER_ADMIN",
                "status": "ACTIVE",
            }
        }
        
        # Mock activity
        mock_activity.return_value = {"activity": []}
        
        # Call function
        result = get_user("user-1", {})
        
        # Assertions
        assert "user" in result
        assert "activity" in result
        assert result["user"]["userId"] == "user-1"
    
    @patch('user_handler.admin_users_table')
    def test_get_user_not_found(self, mock_table):
        """Test getting a non-existent user"""
        # Mock DynamoDB response
        mock_table.get_item.return_value = {}
        
        # Call function and expect error
        with pytest.raises(ValueError, match="User not found"):
            get_user("non-existent", {})
    
    @patch('user_handler.send_activation_email')
    @patch('user_handler.admin_users_table')
    def test_create_user_success(self, mock_table, mock_email):
        """Test creating a new user"""
        # Mock email check (no existing user)
        mock_table.query.return_value = {"Items": []}
        
        # Mock user creation
        mock_table.put_item.return_value = {}
        
        # Mock email sending
        mock_email.return_value = True
        
        # Call function
        body = {
            "email": "newadmin@example.com",
            "name": "New Admin",
            "role": "CONTENT_ADMIN",
        }
        result = create_user(body, "creator-1")
        
        # Assertions
        assert "user" in result
        assert result["user"]["email"] == "newadmin@example.com"
        assert result["user"]["role"] == "CONTENT_ADMIN"
        assert result["user"]["status"] == "PENDING_ACTIVATION"
        assert result["activationEmailSent"] is True
        assert "permissions" in result["user"]
    
    @patch('user_handler.admin_users_table')
    def test_create_user_duplicate_email(self, mock_table):
        """Test creating user with duplicate email"""
        # Mock existing user with same email
        mock_table.query.return_value = {
            "Items": [{"userId": "existing-user", "email": "admin@example.com"}]
        }
        
        body = {
            "email": "admin@example.com",
            "name": "Duplicate Admin",
            "role": "SUPER_ADMIN",
        }
        
        with pytest.raises(ValueError, match="already exists"):
            create_user(body, "creator-1")
    
    @patch('user_handler.admin_users_table')
    def test_create_user_missing_fields(self, mock_table):
        """Test creating user with missing required fields"""
        body = {
            "email": "admin@example.com",
            # Missing name and role
        }
        
        with pytest.raises(ValueError, match="Missing required field"):
            create_user(body, "creator-1")
    
    @patch('user_handler.admin_users_table')
    def test_update_user_success(self, mock_table):
        """Test updating a user"""
        # Mock existing user
        mock_table.get_item.side_effect = [
            {
                "Item": {
                    "userId": "user-1",
                    "email": "admin@example.com",
                    "name": "Old Name",
                    "role": "CONTENT_ADMIN",
                }
            },
            {
                "Item": {
                    "userId": "user-1",
                    "email": "admin@example.com",
                    "name": "New Name",
                    "role": "CONTENT_ADMIN",
                }
            }
        ]
        
        # Mock update
        mock_table.update_item.return_value = {}
        
        # Call function
        body = {"name": "New Name"}
        result = update_user("user-1", body, "updater-1")
        
        # Assertions
        assert "user" in result
        assert result["user"]["name"] == "New Name"
    
    @patch('user_handler.terminate_user_sessions')
    @patch('user_handler.admin_users_table')
    def test_deactivate_user_success(self, mock_table, mock_terminate):
        """Test deactivating a user"""
        # Mock existing active user
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "user-1",
                "email": "admin@example.com",
                "status": "ACTIVE",
            }
        }
        
        # Mock update
        mock_table.update_item.return_value = {}
        
        # Mock session termination
        mock_terminate.return_value = 2
        
        # Call function
        result = deactivate_user("user-1", "deactivator-1")
        
        # Assertions
        assert result["message"] == "User deactivated successfully"
        assert result["userId"] == "user-1"
        assert result["terminatedSessions"] == 2
        mock_terminate.assert_called_once_with("user-1")
    
    @patch('user_handler.admin_users_table')
    def test_deactivate_user_already_deactivated(self, mock_table):
        """Test deactivating an already deactivated user"""
        # Mock existing deactivated user
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "user-1",
                "status": "DEACTIVATED",
            }
        }
        
        with pytest.raises(ValueError, match="already deactivated"):
            deactivate_user("user-1", "deactivator-1")
    
    @patch('user_handler.admin_users_table')
    def test_activate_user_success(self, mock_table):
        """Test activating a user"""
        # Mock existing deactivated user
        mock_table.get_item.return_value = {
            "Item": {
                "userId": "user-1",
                "email": "admin@example.com",
                "status": "DEACTIVATED",
            }
        }
        
        # Mock update
        mock_table.update_item.return_value = {}
        
        # Call function
        result = activate_user("user-1", "activator-1")
        
        # Assertions
        assert result["message"] == "User activated successfully"
        assert result["userId"] == "user-1"
    
    @patch('user_handler.audit_log_table')
    def test_get_user_activity(self, mock_audit_table):
        """Test getting user activity log"""
        # Mock audit log query
        mock_audit_table.query.return_value = {
            "Items": [
                {
                    "auditId": "audit-1",
                    "userId": "user-1",
                    "action": "POST /admin/temples",
                    "timestamp": "2024-01-01T00:00:00",
                }
            ]
        }
        
        # Call function
        result = get_user_activity("user-1", {"page": "1", "limit": "50"})
        
        # Assertions
        assert "activity" in result
        assert "pagination" in result
        assert len(result["activity"]) == 1
    
    def test_get_permissions_for_role(self):
        """Test getting permissions for different roles"""
        # Test SUPER_ADMIN
        super_admin_perms = get_permissions_for_role("SUPER_ADMIN")
        assert "MANAGE_USERS" in super_admin_perms
        assert "MANAGE_SYSTEM_CONFIG" in super_admin_perms
        assert len(super_admin_perms) == 8
        
        # Test CONTENT_ADMIN
        content_admin_perms = get_permissions_for_role("CONTENT_ADMIN")
        assert "MANAGE_TEMPLES" in content_admin_perms
        assert "MODERATE_CONTENT" in content_admin_perms
        assert "MANAGE_USERS" not in content_admin_perms
        
        # Test ANALYTICS_VIEWER
        analytics_perms = get_permissions_for_role("ANALYTICS_VIEWER")
        assert "VIEW_ANALYTICS" in analytics_perms
        assert "VIEW_LOGS" in analytics_perms
        assert len(analytics_perms) == 2
        
        # Test invalid role
        invalid_perms = get_permissions_for_role("INVALID_ROLE")
        assert invalid_perms == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
