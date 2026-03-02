# Social Media Authentication - Deployment Guide

This guide provides step-by-step instructions for deploying the Social Media Authentication system to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OAuth Provider Setup](#oauth-provider-setup)
3. [AWS Configuration](#aws-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- Python 3.11 or higher
- Node.js 18.x or higher (for AWS CDK)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

### Required AWS Permissions

The deploying IAM user/role needs the following permissions:

- CloudFormation: Full access
- Lambda: Create/update functions and layers
- API Gateway: Create/update REST APIs
- DynamoDB: Create/update tables
- Cognito: Create/update user pools
- Secrets Manager: Create/update secrets
- IAM: Create/update roles and policies
- CloudWatch: Create/update log groups and alarms
- SNS: Create/update topics (for alarms)

## OAuth Provider Setup

Before deploying, you need to register OAuth applications with each social provider you want to support.

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/callback`
5. Copy the Client ID and Client Secret

**Required Scopes**: `openid`, `email`, `profile`

### 2. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app or select existing app
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs in Settings > Basic
5. Copy the App ID (client_id) and App Secret (client_secret)

**Required Scopes**: `email`, `public_profile`

### 3. Instagram OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app or select existing app
3. Add "Instagram Basic Display" product
4. Create an Instagram App ID
5. Configure OAuth redirect URIs
6. Copy the Instagram App ID and App Secret

**Required Scopes**: `user_profile`, `user_media`

### 4. Apple Sign In Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Create a new Services ID
3. Enable "Sign In with Apple"
4. Configure return URLs
5. Create a private key for Sign In with Apple
6. Copy the Services ID, Team ID, Key ID, and private key

**Required Scopes**: `email`, `name`

### 5. Twitter/X OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or select existing app
3. Enable OAuth 2.0
4. Add callback URLs
5. Copy the Client ID and Client Secret

**Required Scopes**: `users.read`, `tweet.read`

### 6. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Add authorization callback URL
4. Copy the Client ID and Client Secret

**Required Scopes**: `user:email`, `read:user`

### 7. Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Add redirect URIs in Authentication
4. Create a client secret in Certificates & secrets
5. Copy the Application (client) ID and client secret value

**Required Scopes**: `openid`, `email`, `profile`

## AWS Configuration

### 1. Configure OAuth Credentials in Secrets Manager

Create a JSON file with your OAuth credentials:

```bash
cp scripts/oauth-credentials-template.json oauth-credentials.json
```

Edit `oauth-credentials.json` and fill in your OAuth credentials for each provider.

Run the setup script:

```bash
# Interactive mode
python scripts/setup-oauth-secrets.py

# From config file
python scripts/setup-oauth-secrets.py --config oauth-credentials.json

# Specific provider only
python scripts/setup-oauth-secrets.py --provider google --config oauth-credentials.json
```

### 2. Create Encryption Key Secret

Create a secret for encrypting refresh tokens:

```bash
aws secretsmanager create-secret \
    --name social-auth/encryption-key \
    --secret-string "$(openssl rand -base64 32)" \
    --description "Encryption key for social auth refresh tokens"
```

## Deployment Steps

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r src/auth/requirements.txt

# Install CDK dependencies
cd infrastructure
npm install
cd ..
```

### 2. Build Lambda Layer

```bash
chmod +x scripts/build-lambda-layer.sh
./scripts/build-lambda-layer.sh
```

### 3. Deploy Infrastructure

#### Development Environment

```bash
cd infrastructure
cdk deploy SanaathanaAalayaCharithra-Authentication \
    --context environment=dev \
    --require-approval never
cd ..
```

#### Staging Environment

```bash
cd infrastructure
cdk deploy SanaathanaAalayaCharithra-Authentication \
    --context environment=staging \
    --context alarmEmail=your-email@example.com \
    --require-approval never
cd ..
```

#### Production Environment

```bash
cd infrastructure
cdk deploy SanaathanaAalayaCharithra-Authentication \
    --context environment=prod \
    --context alarmEmail=your-email@example.com \
    --require-approval never
cd ..
```

### 4. Note the Outputs

After deployment, CDK will output important values:

- `ApiGatewayUrl`: The API endpoint URL
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito User Pool Client ID

Save these values for your application configuration.

## Post-Deployment Configuration

### 1. Update OAuth Redirect URIs

Update the redirect URIs in each OAuth provider's configuration to match your deployed API Gateway URL:

```
https://<api-gateway-id>.execute-api.<region>.amazonaws.com/prod/auth/callback/<provider>
```

### 2. Configure CORS

Update the `CORS_ALLOWED_ORIGINS` environment variable in Lambda functions to match your application domain:

```bash
aws lambda update-function-configuration \
    --function-name SanaathanaAalayaCharithra-AuthHandler-prod \
    --environment Variables="{CORS_ALLOWED_ORIGINS=https://your-app-domain.com}"
```

### 3. Configure Allowed Redirect URIs

Update the `ALLOWED_REDIRECT_URIS` environment variable:

```bash
aws lambda update-function-configuration \
    --function-name SanaathanaAalayaCharithra-AuthHandler-prod \
    --environment Variables="{ALLOWED_REDIRECT_URIS=https://your-app-domain.com/callback}"
```

### 4. Enable CloudWatch Alarms (Production)

If you provided an alarm email during deployment, confirm the SNS subscription:

1. Check your email for the SNS subscription confirmation
2. Click the confirmation link

## Testing

### 1. Test OAuth Flow Initiation

```bash
curl -X POST https://<api-gateway-url>/prod/auth/initiate/google \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device-123" \
  -d '{
    "redirect_uri": "https://your-app-domain.com/callback"
  }'
```

Expected response:

```json
{
  "data": {
    "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "..."
  }
}
```

### 2. Test OAuth Callback

After completing the OAuth flow in a browser, test the callback endpoint:

```bash
curl -X POST https://<api-gateway-url>/prod/auth/callback/google \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device-123" \
  -d '{
    "code": "authorization_code_from_provider",
    "state": "state_from_initiate_response"
  }'
```

### 3. Test Token Refresh

```bash
curl -X POST https://<api-gateway-url>/prod/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "refresh_token": "refresh_token_from_callback"
  }'
```

### 4. Test Profile Retrieval

```bash
curl -X GET https://<api-gateway-url>/prod/profile/me \
  -H "Authorization: Bearer <access_token>"
```

## Troubleshooting

### Common Issues

#### 1. OAuth Provider Errors

**Error**: `AUTH_PROVIDER_ERROR: invalid_client`

**Solution**: Verify that the client ID and client secret in Secrets Manager match the values from the OAuth provider.

#### 2. Redirect URI Mismatch

**Error**: `AUTH_INVALID_REDIRECT_URI`

**Solution**: 
- Ensure the redirect URI is in the `ALLOWED_REDIRECT_URIS` environment variable
- Verify the redirect URI matches exactly in the OAuth provider configuration

#### 3. Rate Limiting

**Error**: `AUTH_RATE_LIMITED`

**Solution**: Wait 15 minutes or clear the rate limit record in DynamoDB:

```bash
aws dynamodb delete-item \
    --table-name SanaathanaAalayaCharithra-AuthRateLimits-prod \
    --key '{"device_id": {"S": "your-device-id"}}'
```

#### 4. CSRF State Validation Failed

**Error**: `AUTH_INVALID_STATE`

**Solution**: 
- Ensure the state parameter from the initiate response is passed to the callback
- Check that the OAuth state table exists and has proper TTL configuration
- Verify the state hasn't expired (10-minute TTL)

#### 5. Lambda Timeout

**Error**: Lambda function timeout

**Solution**:
- Check CloudWatch logs for the specific error
- Increase Lambda timeout if needed (current: 30 seconds)
- Verify network connectivity to OAuth providers

### Viewing Logs

#### CloudWatch Logs

```bash
# View auth handler logs
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-AuthHandler-prod --follow

# View token handler logs
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-TokenHandler-prod --follow

# View profile handler logs
aws logs tail /aws/lambda/SanaathanaAalayaCharithra-ProfileHandler-prod --follow
```

#### API Gateway Logs

```bash
aws logs tail <api-gateway-log-group> --follow
```

### Monitoring

#### CloudWatch Metrics

Key metrics to monitor:

- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- DynamoDB read/write throttles
- Lambda duration (latency)

#### CloudWatch Alarms

If configured, alarms will trigger for:

- Lambda errors (>5 in 5 minutes)
- Lambda throttles (>10 in 5 minutes)
- High latency (p99 >5 seconds)
- API Gateway errors (>50 4xx or >10 5xx in 5 minutes)
- DynamoDB throttles

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `USER_POOL_ID` | Cognito User Pool ID | `us-east-1_abc123` |
| `USER_POOL_CLIENT_ID` | Cognito User Pool Client ID | `abc123def456` |
| `USER_PROFILES_TABLE` | DynamoDB table for user profiles | `UserProfiles-prod` |
| `RATE_LIMITS_TABLE` | DynamoDB table for rate limiting | `AuthRateLimits-prod` |
| `ENCRYPTION_KEY_SECRET` | Secrets Manager secret for encryption | `social-auth/encryption-key` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `ENVIRONMENT` | Environment name | `prod` |
| `ALLOWED_REDIRECT_URIS` | Comma-separated allowed redirect URIs | `https://app.example.com/callback` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `https://app.example.com` |

## Security Considerations

1. **Secrets Management**: Never commit OAuth credentials to version control
2. **HTTPS Only**: Always use HTTPS for redirect URIs in production
3. **Rate Limiting**: Monitor rate limit metrics to detect abuse
4. **CORS**: Configure CORS origins to match only your application domains
5. **Encryption**: Refresh tokens are encrypted at rest using AES-256-GCM
6. **CSRF Protection**: State parameters are validated to prevent CSRF attacks
7. **Token Expiration**: Access tokens expire after 1 hour, refresh tokens after 30 days

## Rollback

If you need to rollback a deployment:

```bash
cd infrastructure
cdk deploy SanaathanaAalayaCharithra-Authentication \
    --context environment=prod \
    --rollback
cd ..
```

Or manually rollback via CloudFormation console.

## Support

For issues or questions:

1. Check CloudWatch logs for detailed error messages
2. Review the troubleshooting section above
3. Consult the OAuth provider documentation
4. Check AWS service health dashboard

## Next Steps

After successful deployment:

1. Integrate the authentication API with your mobile/web application
2. Implement token refresh logic in your application
3. Set up monitoring dashboards in CloudWatch
4. Configure backup policies for DynamoDB tables
5. Implement user profile management features
6. Add additional OAuth providers as needed
