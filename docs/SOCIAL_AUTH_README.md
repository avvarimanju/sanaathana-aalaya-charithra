# Social Media Authentication System

A comprehensive OAuth 2.0 authentication system supporting 7 major social providers, built with Python 3.11 and AWS serverless architecture.

## Overview

This system provides secure, scalable social media authentication for the Sanaathana Aalaya Charithra application. Users can sign in with Google, Facebook, Instagram, Apple, Twitter/X, GitHub, or Microsoft accounts, and link multiple social accounts to a single user profile.

## Features

### Supported Providers

- **Google** - OAuth 2.0 with OpenID Connect
- **Facebook** - OAuth 2.0 with Graph API
- **Instagram** - OAuth 2.0 with Basic Display API
- **Apple** - Sign In with Apple (OAuth 2.0)
- **Twitter/X** - OAuth 2.0
- **GitHub** - OAuth 2.0
- **Microsoft** - OAuth 2.0 with Azure AD

### Core Capabilities

- **Multi-Provider Authentication**: Users can sign in with any supported provider
- **Account Linking**: Link multiple social accounts to one user profile
- **Token Management**: Secure token generation, refresh, and revocation
- **Profile Management**: Unified user profile across all linked providers
- **Rate Limiting**: Protection against brute force attacks (5 attempts per 15 minutes)
- **CSRF Protection**: Cryptographically secure state parameters
- **Encryption**: AES-256-GCM encryption for refresh tokens
- **Error Handling**: Standardized error codes and responses
- **Monitoring**: CloudWatch alarms for errors, throttles, and high latency

## Architecture

### AWS Services

- **AWS Lambda**: Serverless compute for authentication logic
- **Amazon Cognito**: User identity management and token generation
- **Amazon DynamoDB**: User profiles and rate limiting data
- **Amazon API Gateway**: RESTful API endpoints
- **AWS Secrets Manager**: Secure OAuth credential storage
- **Amazon CloudWatch**: Logging, metrics, and alarms

### Components

```
┌─────────────────┐
│  Mobile/Web App │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────────┐
    ▼         ▼            ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐    ┌────────┐
│ Auth   │ │ Token  │ │Profile │    │ Lambda │
│Handler │ │Handler │ │Handler │    │ Layer  │
└───┬────┘ └───┬────┘ └───┬────┘    └────────┘
    │          │          │
    └──────────┴──────────┘
               │
    ┌──────────┼──────────┬──────────────┐
    ▼          ▼          ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐    ┌────────┐
│Cognito │ │DynamoDB│ │Secrets │    │Provider│
│        │ │        │ │Manager │    │  APIs  │
└────────┘ └────────┘ └────────┘    └────────┘
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/initiate/{provider}

Initiate OAuth flow for a provider.

**Request:**
```json
{
  "redirect_uri": "https://app.example.com/callback"
}
```

**Response:**
```json
{
  "data": {
    "authorization_url": "https://provider.com/oauth/authorize?...",
    "state": "csrf_token"
  }
}
```

#### POST /auth/callback/{provider}

Handle OAuth callback and exchange code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "state": "csrf_token"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "id_token": "...",
    "expires_in": 3600,
    "user": {
      "user_id": "...",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://..."
    }
  }
}
```

### Token Endpoints

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "..."
}
```

**Response:**
```json
{
  "data": {
    "access_token": "...",
    "expires_in": 3600
  }
}
```

#### POST /auth/signout

Sign out and revoke tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "data": {
    "message": "Successfully signed out"
  }
}
```

### Profile Endpoints

#### GET /profile/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "data": {
    "user_id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "linked_providers": [
      {
        "provider": "google",
        "provider_user_id": "...",
        "linked_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /profile/link/{provider}

Link additional social account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "code": "authorization_code",
  "state": "csrf_token"
}
```

**Response:**
```json
{
  "data": {
    "message": "Provider linked successfully",
    "provider": "facebook"
  }
}
```

#### DELETE /profile/unlink/{provider}

Unlink social account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "data": {
    "message": "Provider unlinked successfully",
    "provider": "facebook"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_TOKEN` | Invalid or malformed token |
| `AUTH_SESSION_EXPIRED` | Session has expired |
| `AUTH_ACCOUNT_ALREADY_LINKED` | Social account already linked to another user |
| `AUTH_CANNOT_UNLINK_LAST_PROVIDER` | Cannot unlink the last authentication provider |
| `AUTH_RATE_LIMITED` | Too many authentication attempts |
| `AUTH_INVALID_REDIRECT_URI` | Redirect URI not authorized |
| `AUTH_PROVIDER_ERROR` | Error from authentication provider |
| `AUTH_INVALID_STATE` | Invalid CSRF state parameter |
| `AUTH_USER_NOT_FOUND` | User profile not found |
| `AUTH_INTERNAL_ERROR` | Internal server error |
| `AUTH_INVALID_PROVIDER` | Provider not supported |
| `AUTH_MISSING_EMAIL` | Email not provided by provider |

## Security Features

### Rate Limiting

- 5 authentication attempts per device per 15 minutes
- Sliding window implementation
- Device identified by `X-Device-Id` header

### CSRF Protection

- Cryptographically secure state parameters (32 bytes)
- State stored in DynamoDB with 10-minute TTL
- State validated on OAuth callback

### Token Security

- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Refresh tokens encrypted with AES-256-GCM
- Tokens managed by AWS Cognito

### Data Protection

- All data encrypted at rest (DynamoDB, Secrets Manager)
- All data encrypted in transit (HTTPS/TLS)
- OAuth credentials stored in AWS Secrets Manager
- No sensitive data in logs

## Deployment

See [SOCIAL_AUTH_DEPLOYMENT.md](./SOCIAL_AUTH_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Start

1. Configure OAuth credentials:
   ```bash
   python scripts/setup-oauth-secrets.py --config oauth-credentials.json
   ```

2. Deploy infrastructure:
   ```bash
   cd infrastructure
   cdk deploy SanaathanaAalayaCharithra-Authentication --context environment=prod
   ```

3. Update OAuth provider redirect URIs with deployed API Gateway URL

4. Test authentication flow

## Monitoring

### CloudWatch Metrics

- Lambda invocations and errors
- API Gateway request count and errors
- DynamoDB read/write capacity
- Lambda duration (latency)

### CloudWatch Alarms

- Lambda errors (>5 in 5 minutes)
- Lambda throttles (>10 in 5 minutes)
- High latency (p99 >5 seconds)
- API Gateway 4xx errors (>50 in 5 minutes)
- API Gateway 5xx errors (>10 in 5 minutes)
- DynamoDB throttles

## Development

### Project Structure

```
src/auth/
├── lambdas/           # Lambda function handlers
│   ├── auth_handler.py
│   ├── token_handler.py
│   └── profile_handler.py
├── services/          # Business logic services
│   ├── oauth_service.py
│   ├── token_service.py
│   ├── profile_service.py
│   └── provider_factory.py
├── providers/         # OAuth provider implementations
│   ├── base_provider.py
│   ├── google_provider.py
│   ├── facebook_provider.py
│   ├── instagram_provider.py
│   ├── apple_provider.py
│   ├── twitter_provider.py
│   ├── github_provider.py
│   └── microsoft_provider.py
├── models/            # Data models
│   ├── user_profile.py
│   ├── session.py
│   └── oauth_tokens.py
├── utils/             # Utility functions
│   ├── crypto.py
│   ├── validators.py
│   ├── rate_limiter.py
│   └── errors.py
└── config.py          # Configuration management
```

### Running Tests

```bash
# Run all tests
./scripts/run-auth-tests.sh

# Run specific test file
python -m pytest src/auth/utils/test_rate_limiter.py -v
```

### Building Lambda Layer

```bash
./scripts/build-lambda-layer.sh
```

## Configuration

### Environment Variables

See [SOCIAL_AUTH_DEPLOYMENT.md](./SOCIAL_AUTH_DEPLOYMENT.md#environment-variables-reference) for complete list.

### OAuth Provider Configuration

Each provider requires:
- Client ID
- Client Secret
- Redirect URIs
- Scopes

Configuration stored in AWS Secrets Manager at:
- `social-auth/google/credentials`
- `social-auth/facebook/credentials`
- `social-auth/instagram/credentials`
- `social-auth/apple/credentials`
- `social-auth/twitter/credentials`
- `social-auth/github/credentials`
- `social-auth/microsoft/credentials`

## Troubleshooting

See [SOCIAL_AUTH_DEPLOYMENT.md](./SOCIAL_AUTH_DEPLOYMENT.md#troubleshooting) for common issues and solutions.

## License

Proprietary - Sanaathana Aalaya Charithra

## Support

For issues or questions, contact the development team or check CloudWatch logs for detailed error information.
