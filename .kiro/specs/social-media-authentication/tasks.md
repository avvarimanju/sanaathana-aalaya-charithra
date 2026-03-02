# Implementation Plan: Social Media Authentication

## Overview

This implementation plan breaks down the social media authentication feature into discrete coding tasks. The system provides OAuth 2.0 authentication for 7 social providers (Google, Facebook, Instagram, Apple, Twitter/X, GitHub, Microsoft) using Python 3.11, AWS Lambda, Cognito, DynamoDB, and API Gateway. The implementation follows a bottom-up approach: infrastructure → core services → provider implementations → Lambda handlers → API integration → testing.

## Tasks

- [x] 1. Set up project structure and infrastructure foundation
  - [x] 1.1 Create Python project structure for authentication service
    - Create directory structure: `src/auth/{lambdas,services,providers,models,utils}`
    - Set up `requirements.txt` with dependencies: boto3, PyJWT, cryptography, requests, hypothesis
    - Create `__init__.py` files for all packages
    - _Requirements: 13.1, 13.5, 13.6_

  - [x] 1.2 Implement AWS CDK stack for authentication infrastructure
    - Create `infrastructure/stacks/AuthenticationStack.py` with Cognito User Pool
    - Add DynamoDB tables: UserProfiles (with ProviderUserIdIndex GSI) and AuthRateLimits (with TTL)
    - Configure Lambda layer for shared dependencies
    - Add Secrets Manager placeholders for OAuth credentials
    - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6_

  - [x] 1.3 Create data models and configuration
    - Implement `src/auth/models/user_profile.py` with UserProfile and LinkedProvider dataclasses
    - Implement `src/auth/models/session.py` with SessionTokens dataclass
    - Implement `src/auth/models/oauth_tokens.py` with OAuthTokens and UserClaims dataclasses
    - Create `src/auth/config.py` for environment variables and constants
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2. Implement core utility services
  - [x] 2.1 Implement encryption utilities
    - Create `src/auth/utils/crypto.py` with AES-256 encryption/decryption functions
    - Implement encrypt_refresh_token() and decrypt_refresh_token() functions
    - _Requirements: 10.5_

  - [ ]* 2.2 Write property test for encryption round trip
    - **Property 15: Refresh Token Encryption Round Trip**
    - **Validates: Requirements 10.5**

  - [x] 2.3 Implement token validation utilities
    - Create `src/auth/utils/validators.py` with JWT validation functions
    - Implement validate_jwt_signature() using provider JWKS
    - Implement validate_redirect_uri() with whitelist checking
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 10.6_

  - [ ]* 2.4 Write property tests for token validation
    - **Property 2: Token Signature Validation**
    - **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**

  - [ ]* 2.5 Write property test for redirect URI validation
    - **Property 16: Redirect URL Whitelist Validation**
    - **Validates: Requirements 10.6**

  - [x] 2.6 Implement rate limiting logic
    - Create `src/auth/utils/rate_limiter.py` with RateLimiter class
    - Implement check_rate_limit() and record_attempt() using DynamoDB
    - Implement sliding window rate limiting (5 attempts per 15 minutes)
    - _Requirements: 10.3, 10.4_

  - [ ]* 2.7 Write property test for rate limiting enforcement
    - **Property 14: Rate Limiting Enforcement**
    - **Validates: Requirements 10.3, 10.4**

- [x] 3. Implement base OAuth provider interface
  - [x] 3.1 Create abstract base provider class
    - Create `src/auth/providers/base_provider.py` with BaseOAuthProvider abstract class
    - Define abstract methods: get_authorization_url(), exchange_code_for_tokens(), validate_id_token(), get_user_info(), get_jwks_uri()
    - Implement common OAuth helper methods
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [ ]* 3.2 Write unit tests for base provider
    - Test abstract method enforcement
    - Test common helper methods
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 4. Implement social provider implementations
  - [x] 4.1 Implement Google OAuth provider
    - Create `src/auth/providers/google_provider.py` extending BaseOAuthProvider
    - Implement Google-specific OAuth endpoints and scopes
    - Implement Google ID token validation using Google's JWKS
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 Implement Facebook OAuth provider
    - Create `src/auth/providers/facebook_provider.py` extending BaseOAuthProvider
    - Implement Facebook-specific OAuth endpoints and scopes
    - Implement Facebook token validation
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.3 Implement Instagram OAuth provider
    - Create `src/auth/providers/instagram_provider.py` extending BaseOAuthProvider
    - Implement Instagram-specific OAuth endpoints and scopes
    - Implement Instagram token validation
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.4 Implement Apple OAuth provider
    - Create `src/auth/providers/apple_provider.py` extending BaseOAuthProvider
    - Implement Apple-specific OAuth endpoints and scopes
    - Implement Apple ID token validation with public key rotation support
    - Handle Apple private relay email addresses
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 4.5 Write property test for Apple private relay email
    - **Property 6: Apple Private Relay Email Storage**
    - **Validates: Requirements 4.6**

  - [x] 4.6 Implement Twitter/X OAuth provider
    - Create `src/auth/providers/twitter_provider.py` extending BaseOAuthProvider
    - Implement Twitter/X-specific OAuth endpoints and scopes
    - Implement Twitter/X token validation
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.7 Implement GitHub OAuth provider
    - Create `src/auth/providers/github_provider.py` extending BaseOAuthProvider
    - Implement GitHub-specific OAuth endpoints and scopes
    - Implement GitHub token validation
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.8 Implement Microsoft OAuth provider
    - Create `src/auth/providers/microsoft_provider.py` extending BaseOAuthProvider
    - Implement Microsoft-specific OAuth endpoints and scopes
    - Implement Microsoft ID token validation
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.9 Implement provider factory
    - Create `src/auth/services/provider_factory.py` with get_provider() function
    - Map provider names to provider classes
    - Load OAuth credentials from Secrets Manager
    - _Requirements: 13.2_

  - [ ]* 4.10 Write unit tests for each provider
    - Test provider-specific OAuth endpoints
    - Test provider-specific token validation
    - Test provider-specific user info extraction
    - _Requirements: 1.1-7.3_

- [x] 5. Checkpoint - Ensure provider implementations are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement core authentication services
  - [x] 6.1 Implement OAuth service
    - Create `src/auth/services/oauth_service.py` with OAuthService class
    - Implement initiate_auth() to generate authorization URLs with CSRF state
    - Implement handle_callback() to exchange authorization codes for tokens
    - Implement validate_token() for ID token validation
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2_

  - [ ]* 6.2 Write property test for OAuth flow initiation
    - **Property 1: OAuth Flow Initiation**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1**

  - [ ]* 6.3 Write property test for invalid token error handling
    - **Property 5: Invalid Token Error Handling**
    - **Validates: Requirements 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5**

  - [x] 6.2 Implement token service
    - Create `src/auth/services/token_service.py` with TokenService class
    - Implement generate_session_tokens() using Cognito AdminInitiateAuth
    - Implement refresh_access_token() using Cognito refresh token flow
    - Implement revoke_session() to invalidate tokens
    - Implement validate_access_token() for token verification
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 6.3 Write property test for session token generation
    - **Property 4: Session Token Generation**
    - **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.1, 8.2**

  - [ ]* 6.4 Write property test for token refresh round trip
    - **Property 7: Token Refresh Round Trip**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [ ]* 6.5 Write property test for invalid refresh token error
    - **Property 8: Invalid Refresh Token Error Handling**
    - **Validates: Requirements 8.6**

  - [ ]* 6.6 Write property test for session revocation
    - **Property 9: Session Revocation**
    - **Validates: Requirements 8.7**

  - [x] 6.7 Implement profile service
    - Create `src/auth/services/profile_service.py` with ProfileService class
    - Implement create_profile() to create user profiles in DynamoDB
    - Implement get_profile() to retrieve profiles by user_id
    - Implement get_profile_by_provider() using ProviderUserIdIndex GSI
    - Implement link_provider() to add linked social accounts
    - Implement unlink_provider() with last provider protection
    - Implement update_profile_from_provider() to sync latest provider data
    - _Requirements: 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 6.8 Write property test for profile creation or retrieval
    - **Property 3: Profile Creation or Retrieval**
    - **Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**

  - [ ]* 6.9 Write property test for profile field extraction
    - **Property 17: Profile Field Extraction**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

  - [ ]* 6.10 Write property test for profile update on sign-in
    - **Property 18: Profile Update on Sign-In**
    - **Validates: Requirements 11.5**

  - [ ]* 6.11 Write property test for provider linking
    - **Property 10: Provider Linking**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 6.12 Write property test for duplicate provider linking prevention
    - **Property 11: Duplicate Provider Linking Prevention**
    - **Validates: Requirements 9.3**

  - [ ]* 6.13 Write property test for multi-provider authentication
    - **Property 12: Multi-Provider Authentication**
    - **Validates: Requirements 9.4**

  - [ ]* 6.14 Write property test for provider unlinking
    - **Property 13: Provider Unlinking**
    - **Validates: Requirements 9.5**

- [x] 7. Checkpoint - Ensure core services are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Lambda handlers
  - [x] 8.1 Implement authentication handler Lambda
    - Create `src/auth/lambdas/auth_handler.py` with handler() function
    - Implement POST /auth/initiate/{provider} endpoint logic
    - Implement POST /auth/callback/{provider} endpoint logic
    - Integrate OAuthService, TokenService, and ProfileService
    - Implement error handling with standardized error codes
    - Add CloudWatch logging for all operations
    - _Requirements: 1.1-7.6, 10.1, 10.2, 12.1, 13.4, 13.6_

  - [ ]* 8.2 Write integration tests for auth handler
    - Test OAuth flow end-to-end with mock providers
    - Test error scenarios (invalid tokens, rate limiting)
    - Test CloudWatch logging
    - _Requirements: 1.1-7.6_

  - [x] 8.3 Implement token handler Lambda
    - Create `src/auth/lambdas/token_handler.py` with handler() function
    - Implement POST /auth/refresh endpoint logic
    - Implement POST /auth/signout endpoint logic
    - Integrate TokenService
    - Implement error handling with standardized error codes
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 12.2, 12.4_

  - [ ]* 8.4 Write integration tests for token handler
    - Test token refresh flow
    - Test signout flow
    - Test error scenarios
    - _Requirements: 8.3-8.7_

  - [x] 8.5 Implement profile handler Lambda
    - Create `src/auth/lambdas/profile_handler.py` with handler() function
    - Implement POST /profile/link/{provider} endpoint logic
    - Implement DELETE /profile/unlink/{provider} endpoint logic
    - Implement GET /profile/me endpoint logic
    - Integrate ProfileService
    - Implement error handling with standardized error codes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 12.3_

  - [ ]* 8.6 Write integration tests for profile handler
    - Test account linking flow
    - Test account unlinking flow
    - Test profile retrieval
    - Test error scenarios (duplicate linking, last provider unlinking)
    - _Requirements: 9.1-9.6_

- [x] 9. Implement API Gateway configuration
  - [x] 9.1 Complete API Gateway REST API in CDK stack
    - Add all API resources and methods to AuthenticationStack
    - Configure CORS for mobile app domain
    - Add Lambda integrations for all endpoints
    - Configure request/response models
    - Add API Gateway logging
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 13.7_

  - [ ]* 9.2 Write property test for JSON response format
    - **Property 19: JSON Response Format**
    - **Validates: Requirements 12.5**

  - [ ]* 9.3 Write property test for standardized error response format
    - **Property 20: Standardized Error Response Format**
    - **Validates: Requirements 12.6**

  - [ ]* 9.4 Write integration tests for API Gateway
    - Test CORS configuration
    - Test request validation
    - Test response formatting
    - _Requirements: 12.7_

- [x] 10. Implement security features
  - [x] 10.1 Add rate limiting to authentication handler
    - Integrate RateLimiter into auth_handler.py
    - Extract device_id from request headers
    - Return AUTH_RATE_LIMITED error when limit exceeded
    - _Requirements: 10.3, 10.4_

  - [x] 10.2 Add CSRF protection to OAuth flow
    - Generate cryptographically random state parameter (32+ bytes)
    - Store state in DynamoDB with short TTL (10 minutes)
    - Validate state parameter on callback
    - Return AUTH_INVALID_STATE error on mismatch
    - _Requirements: 10.6_

  - [x] 10.3 Implement comprehensive error handling
    - Create `src/auth/utils/errors.py` with AuthErrorCode enum
    - Create standardized error response builder
    - Add error logging to CloudWatch with structured format
    - Handle provider-specific errors gracefully
    - _Requirements: 10.1, 10.2, 12.6_

  - [ ]* 10.4 Write unit tests for error handling
    - Test all error codes
    - Test error response format
    - Test error logging
    - _Requirements: 10.1, 10.2, 12.6_

- [x] 11. Create deployment configuration
  - [x] 11.1 Create Lambda deployment packages
    - Create `src/auth/layers/dependencies/requirements.txt` with all dependencies
    - Create build script to package Lambda layers
    - Create deployment script for Lambda functions
    - _Requirements: 13.6_

  - [x] 11.2 Create Secrets Manager setup script
    - Create script to initialize OAuth credentials in Secrets Manager
    - Document required credentials for each provider
    - Create template for credential structure
    - _Requirements: 13.2_

  - [x] 11.3 Update CDK stack with environment-specific configuration
    - Add environment variables for dev/staging/prod
    - Configure CloudWatch log retention
    - Add CloudWatch alarms for errors and rate limiting
    - Configure DynamoDB backup and point-in-time recovery
    - _Requirements: 13.4, 13.5_

  - [x] 11.4 Create deployment documentation
    - Document deployment steps
    - Document required AWS permissions
    - Document OAuth app setup for each provider
    - Document environment variables and secrets
    - _Requirements: 13.1-13.7_

- [x] 12. Final integration and testing
  - [x] 12.1 Run all property-based tests
    - Execute all 20 property tests with 100+ iterations each
    - Verify all properties pass
    - Generate test coverage report
    - _Requirements: All_

  - [x] 12.2 Run all unit tests
    - Execute all unit tests for providers, services, and handlers
    - Verify edge cases are handled correctly
    - Generate test coverage report (target: 80%+)
    - _Requirements: All_

  - [x] 12.3 Run integration tests with AWS services
    - Test Cognito integration
    - Test DynamoDB operations
    - Test Secrets Manager access
    - Test API Gateway endpoints
    - _Requirements: 13.1, 13.2, 13.3, 13.7_

  - [x] 12.4 Deploy to staging environment and perform end-to-end testing
    - Deploy CDK stack to staging
    - Configure OAuth apps for all 7 providers
    - Test complete authentication flow for each provider
    - Test account linking and unlinking
    - Test token refresh and signout
    - Test rate limiting and error scenarios
    - _Requirements: All_

- [x] 13. Final checkpoint - Ensure all tests pass and system is ready for production
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and provider-specific behavior
- Integration tests validate AWS service interactions
- The implementation follows a bottom-up approach: infrastructure → utilities → providers → services → handlers → API
- All 7 social providers (Google, Facebook, Instagram, Apple, Twitter/X, GitHub, Microsoft) are implemented with the same base interface
- Security features (rate limiting, CSRF protection, encryption) are integrated throughout
- Comprehensive error handling with standardized error codes ensures consistent API responses
