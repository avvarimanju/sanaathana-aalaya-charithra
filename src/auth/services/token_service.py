"""
Token Service Module

This module manages session tokens and refresh operations using AWS Cognito.
It handles token generation, refresh, revocation, and validation.

Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
"""

import boto3
from typing import Dict, Optional
from botocore.exceptions import ClientError
import jwt
from jwt import PyJWKClient
import time

from ..config import AuthConfig, AuthErrorCode


class TokenService:
    """
    Manages session tokens and refresh operations.
    
    This service handles:
    - Generating access and refresh tokens via Cognito
    - Refreshing access tokens using refresh tokens
    - Revoking user sessions and invalidating tokens
    - Validating access tokens
    """
    
    def __init__(
        self,
        user_pool_id: Optional[str] = None,
        client_id: Optional[str] = None,
        region: Optional[str] = None
    ):
        """
        Initialize the token service.
        
        Args:
            user_pool_id: AWS Cognito User Pool ID (defaults to config)
            client_id: AWS Cognito User Pool Client ID (defaults to config)
            region: AWS region (defaults to config)
        """
        self.user_pool_id = user_pool_id or AuthConfig.USER_POOL_ID
        self.client_id = client_id or AuthConfig.USER_POOL_CLIENT_ID
        self.region = region or AuthConfig.AWS_REGION
        
        self.cognito_client = boto3.client("cognito-idp", region_name=self.region)
        
        # JWKS client for token validation
        jwks_url = (
            f"https://cognito-idp.{self.region}.amazonaws.com/"
            f"{self.user_pool_id}/.well-known/jwks.json"
        )
        self.jwks_client = PyJWKClient(jwks_url)
    
    def generate_session_tokens(
        self,
        user_id: str,
        provider: str,
        user_attributes: Optional[Dict[str, str]] = None
    ) -> Dict:
        """
        Generates access and refresh tokens via Cognito.
        
        Uses Cognito's AdminInitiateAuth to generate session tokens for a user.
        If the user doesn't exist in Cognito, creates the user first.
        
        Args:
            user_id: Unique user identifier (UUID)
            provider: Social provider used for authentication
            user_attributes: Optional user attributes (email, name, etc.)
            
        Returns:
            dict: Session tokens containing:
                - access_token (str): Access token with 1-hour expiration
                - refresh_token (str): Refresh token with 30-day expiration
                - id_token (str): ID token with user claims
                - expires_in (int): Token expiration in seconds (3600)
                - token_type (str): Token type ("Bearer")
                
        Raises:
            Exception: If token generation fails
            
        Requirements: 8.1, 8.2
        
        Example:
            >>> token_service = TokenService()
            >>> tokens = token_service.generate_session_tokens(
            ...     "user-123",
            ...     "google",
            ...     {"email": "user@example.com", "name": "John Doe"}
            ... )
            >>> print(tokens["access_token"])
            eyJraWQiOiJ...
        """
        try:
            # Ensure user exists in Cognito
            self._ensure_user_exists(user_id, user_attributes)
            
            # Generate tokens using AdminInitiateAuth
            response = self.cognito_client.admin_initiate_auth(
                UserPoolId=self.user_pool_id,
                ClientId=self.client_id,
                AuthFlow="CUSTOM_AUTH",  # Using custom auth flow
                AuthParameters={
                    "USERNAME": user_id
                }
            )
            
            # Extract tokens from response
            auth_result = response.get("AuthenticationResult", {})
            
            return {
                "access_token": auth_result["AccessToken"],
                "refresh_token": auth_result["RefreshToken"],
                "id_token": auth_result["IdToken"],
                "expires_in": auth_result.get("ExpiresIn", AuthConfig.ACCESS_TOKEN_EXPIRATION),
                "token_type": "Bearer"
            }
            
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            
            if error_code == "UserNotFoundException":
                # User doesn't exist, create and retry
                self._create_cognito_user(user_id, user_attributes)
                return self.generate_session_tokens(user_id, provider, user_attributes)
            else:
                raise Exception(
                    f"Failed to generate session tokens: {e.response['Error']['Message']}"
                )
        except Exception as e:
            raise Exception(f"Failed to generate session tokens: {str(e)}")
    
    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Generates new access token using refresh token.
        
        Uses Cognito's refresh token flow to obtain a new access token
        without requiring the user to re-authenticate.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            dict: New tokens containing:
                - access_token (str): New access token with 1-hour expiration
                - id_token (str): New ID token
                - expires_in (int): Token expiration in seconds (3600)
                - token_type (str): Token type ("Bearer")
                
        Raises:
            Exception: If refresh token is invalid or expired (AUTH_SESSION_EXPIRED)
            
        Requirements: 8.3, 8.4, 8.5
        
        Example:
            >>> token_service = TokenService()
            >>> new_tokens = token_service.refresh_access_token("refresh_token_xyz")
            >>> print(new_tokens["access_token"])
            eyJraWQiOiJ...
        """
        try:
            response = self.cognito_client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={
                    "REFRESH_TOKEN": refresh_token
                }
            )
            
            auth_result = response.get("AuthenticationResult", {})
            
            return {
                "access_token": auth_result["AccessToken"],
                "id_token": auth_result["IdToken"],
                "expires_in": auth_result.get("ExpiresIn", AuthConfig.ACCESS_TOKEN_EXPIRATION),
                "token_type": "Bearer"
            }
            
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            
            if error_code in ["NotAuthorizedException", "UserNotFoundException"]:
                raise Exception(
                    f"{AuthErrorCode.AUTH_SESSION_EXPIRED}: "
                    "Refresh token is invalid or expired"
                )
            else:
                raise Exception(
                    f"Failed to refresh access token: {e.response['Error']['Message']}"
                )
        except Exception as e:
            raise Exception(f"Failed to refresh access token: {str(e)}")
    
    def revoke_session(self, access_token: str) -> bool:
        """
        Revokes user session and invalidates tokens.
        
        Signs out the user globally, invalidating all tokens associated
        with the session.
        
        Args:
            access_token: Valid access token for the session to revoke
            
        Returns:
            bool: True if session was successfully revoked
            
        Raises:
            Exception: If session revocation fails
            
        Requirements: 8.7
        
        Example:
            >>> token_service = TokenService()
            >>> success = token_service.revoke_session("access_token_xyz")
            >>> print(success)
            True
        """
        try:
            # Global sign out invalidates all tokens for the user
            self.cognito_client.global_sign_out(
                AccessToken=access_token
            )
            
            return True
            
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            
            if error_code == "NotAuthorizedException":
                # Token already invalid, consider it revoked
                return True
            else:
                raise Exception(
                    f"Failed to revoke session: {e.response['Error']['Message']}"
                )
        except Exception as e:
            raise Exception(f"Failed to revoke session: {str(e)}")
    
    def validate_access_token(self, access_token: str) -> Dict:
        """
        Validates access token and extracts claims.
        
        Verifies the JWT signature using Cognito's public keys and
        validates token expiration and claims.
        
        Args:
            access_token: Access token to validate
            
        Returns:
            dict: Token claims containing:
                - sub (str): User ID (subject)
                - username (str): Username
                - token_use (str): Token type ("access")
                - exp (int): Expiration timestamp
                - iat (int): Issued at timestamp
                - Additional custom claims
                
        Raises:
            Exception: If token is invalid or expired (AUTH_INVALID_TOKEN)
            
        Requirements: 8.4
        
        Example:
            >>> token_service = TokenService()
            >>> claims = token_service.validate_access_token("access_token_xyz")
            >>> print(claims["sub"])
            user-123
        """
        try:
            # Get signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(access_token)
            
            # Decode and validate token
            claims = jwt.decode(
                access_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.client_id,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": True
                }
            )
            
            # Verify token_use claim
            if claims.get("token_use") != "access":
                raise Exception(
                    f"{AuthErrorCode.AUTH_INVALID_TOKEN}: "
                    "Token is not an access token"
                )
            
            return claims
            
        except jwt.ExpiredSignatureError:
            raise Exception(
                f"{AuthErrorCode.AUTH_INVALID_TOKEN}: "
                "Access token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise Exception(
                f"{AuthErrorCode.AUTH_INVALID_TOKEN}: "
                f"Invalid access token: {str(e)}"
            )
        except Exception as e:
            raise Exception(f"Failed to validate access token: {str(e)}")
    
    def _ensure_user_exists(
        self,
        user_id: str,
        user_attributes: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Ensure user exists in Cognito user pool.
        
        Checks if user exists, creates if not found.
        
        Args:
            user_id: User identifier
            user_attributes: Optional user attributes
        """
        try:
            self.cognito_client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "UserNotFoundException":
                self._create_cognito_user(user_id, user_attributes)
            else:
                raise
    
    def _create_cognito_user(
        self,
        user_id: str,
        user_attributes: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Create user in Cognito user pool.
        
        Args:
            user_id: User identifier
            user_attributes: User attributes (email, name, etc.)
            
        Raises:
            Exception: If user creation fails
        """
        try:
            # Build user attributes list
            attributes = []
            
            if user_attributes:
                if "email" in user_attributes:
                    attributes.append({
                        "Name": "email",
                        "Value": user_attributes["email"]
                    })
                    attributes.append({
                        "Name": "email_verified",
                        "Value": "true"
                    })
                
                if "name" in user_attributes:
                    attributes.append({
                        "Name": "name",
                        "Value": user_attributes["name"]
                    })
                
                if "picture" in user_attributes:
                    attributes.append({
                        "Name": "picture",
                        "Value": user_attributes["picture"]
                    })
            
            # Create user
            self.cognito_client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                UserAttributes=attributes,
                MessageAction="SUPPRESS"  # Don't send welcome email
            )
            
            # Set permanent password (user authenticated via social provider)
            self.cognito_client.admin_set_user_password(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                Password=self._generate_random_password(),
                Permanent=True
            )
            
        except ClientError as e:
            raise Exception(
                f"Failed to create Cognito user: {e.response['Error']['Message']}"
            )
    
    def _generate_random_password(self) -> str:
        """
        Generate random password for Cognito user.
        
        Social auth users don't use passwords, but Cognito requires one.
        Generate a secure random password that meets Cognito requirements.
        
        Returns:
            str: Random password
        """
        import secrets
        import string
        
        # Generate 32-character password with mixed case, digits, and symbols
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = "".join(secrets.choice(alphabet) for _ in range(32))
        
        return password
    
    def get_user_from_token(self, access_token: str) -> Dict:
        """
        Get user information from access token.
        
        Validates token and retrieves user details from Cognito.
        
        Args:
            access_token: Valid access token
            
        Returns:
            dict: User information from Cognito
            
        Raises:
            Exception: If token is invalid or user not found
        """
        try:
            # Validate token first
            claims = self.validate_access_token(access_token)
            
            # Get user details from Cognito
            response = self.cognito_client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=claims["username"]
            )
            
            # Convert attributes to dict
            user_attributes = {}
            for attr in response.get("UserAttributes", []):
                user_attributes[attr["Name"]] = attr["Value"]
            
            return {
                "user_id": response["Username"],
                "attributes": user_attributes,
                "enabled": response.get("Enabled", True),
                "user_status": response.get("UserStatus", "UNKNOWN")
            }
            
        except Exception as e:
            raise Exception(f"Failed to get user from token: {str(e)}")
