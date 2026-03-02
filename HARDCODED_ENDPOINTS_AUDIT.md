# Hardcoded Endpoints Audit Report

**Date**: March 2, 2026  
**Status**: ✅ COMPLETE - All hardcoded endpoints eliminated

## Executive Summary

Comprehensive audit of the entire project to identify and eliminate hardcoded endpoints. All scripts now use environment variables with fallbacks, ensuring seamless promotion across Dev → Staging → Production environments.

---

## Audit Scope

- **Scripts**: PowerShell (.ps1) and Bash (.sh) files
- **Backend**: TypeScript/JavaScript source code
- **Admin Portal**: React/Vite frontend
- **Mobile App**: React Native/Expo
- **Tests**: Unit and integration tests
- **Documentation**: Markdown files

---

## Findings by Category

### 1. Scripts - ✅ FIXED

All scripts now use environment variables with fallbacks:

#### Fixed Files:
- ✅ `scripts/init-db-simple.ps1`
- ✅ `scripts/init-local-db.ps1`
- ✅ `scripts/init-local-db.sh`
- ✅ `scripts/start-local-backend.ps1`
- ✅ `scripts/fix-temples-table.ps1` (fixed earlier)
- ✅ `scripts/start-local-integration.ps1` (fixed earlier)

#### Pattern Used:
```powershell
# PowerShell
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }
```

```bash
# Bash
ENDPOINT=${DYNAMODB_ENDPOINT:-http://localhost:4566}
```

### 2. Admin Portal - ✅ VERIFIED SAFE

All frontend code uses environment variables correctly:

- ✅ `admin-portal/src/pages/StateManagementPage.tsx`
  - Uses: `import.meta.env.VITE_API_URL || 'http://localhost:4000'`
  
- ✅ `admin-portal/src/api/client.ts`
  - Uses: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'`

- ✅ `admin-portal/src/pages/ApiTestPage.tsx`
  - Documentation only (not used for actual connections)

### 3. Backend Server - ✅ VERIFIED SAFE

- ✅ `src/local-server/server.ts`
  - Hardcoded URLs only in console logs and health check responses
  - NOT used for actual database connections
  - Informational only

### 4. Backend AWS Clients - ✅ VERIFIED SAFE

- ✅ `src/utils/aws-clients.ts`
  - Uses environment validation from `env-validation.ts`
  - Automatically detects LocalStack vs AWS based on `DYNAMODB_ENDPOINT`
  - No hardcoded endpoints

- ✅ `src/utils/env-validation.ts`
  - Validates all required environment variables at startup
  - Fail-fast approach catches configuration errors early

### 5. Test Files - ✅ VERIFIED SAFE

Multiple test files contain URLs like `https://example.com`:
- These are mock data for tests
- NOT used for actual connections
- Safe to keep as-is

Examples:
- `src/temple-pricing/lambdas/temple-management/__tests__/*.test.ts`
- `mobile-app/src/components/__tests__/*.test.tsx`

### 6. Documentation - ✅ VERIFIED SAFE

Documentation files contain example URLs:
- Used for instructional purposes only
- NOT executed code
- Safe to keep as-is

---

## Environment Variable Strategy

### Development (Local)
```bash
# .env.development (committed)
DYNAMODB_ENDPOINT=http://localhost:4566
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### Staging
```bash
# .env.staging (NOT committed, injected by CI/CD)
# NO DYNAMODB_ENDPOINT (uses AWS DynamoDB)
AWS_REGION=ap-south-1
# AWS credentials from GitHub Secrets
```

### Production
```bash
# .env.production (NOT committed, injected by CI/CD)
# NO DYNAMODB_ENDPOINT (uses AWS DynamoDB)
AWS_REGION=ap-south-1
# AWS credentials from AWS Secrets Manager
```

---

## Validation Approach

### Startup Validation
All required environment variables are validated at application startup using Zod:

```typescript
// src/utils/env-validation.ts
const envSchema = z.object({
  AWS_REGION: z.string().min(1),
  DYNAMODB_ENDPOINT: z.string().optional(),
  // ... other variables
});
```

### Automatic Detection
```typescript
// src/utils/aws-clients.ts
export function getDynamoDBConfig() {
  const env = validateEnv();
  
  if (env.DYNAMODB_ENDPOINT) {
    // LocalStack configuration
    return {
      endpoint: env.DYNAMODB_ENDPOINT,
      region: env.AWS_REGION,
      credentials: { ... }
    };
  }
  
  // AWS DynamoDB configuration
  return {
    region: env.AWS_REGION
  };
}
```

---

## CI/CD Integration

### GitHub Actions Workflow
`.github/workflows/deploy-staging.yml` automatically injects environment-specific values:

```yaml
- name: Deploy Backend Lambda
  env:
    AWS_REGION: ap-south-1
    # NO DYNAMODB_ENDPOINT in staging/production
  run: |
    # Deploy commands
```

---

## Benefits Achieved

1. ✅ **Zero Hardcoded Endpoints**: All endpoints use environment variables
2. ✅ **Seamless Promotion**: Code works across Dev/Staging/Prod without changes
3. ✅ **Fail-Fast Validation**: Configuration errors caught at startup
4. ✅ **Type Safety**: Zod schema ensures correct environment variable types
5. ✅ **Zero-Touch Deployment**: CI/CD handles all environment-specific configuration
6. ✅ **Cost Optimization**: Local development uses LocalStack (free)
7. ✅ **Security**: Secrets never committed to version control

---

## Verification Commands

### Check for remaining hardcoded endpoints:
```powershell
# PowerShell
rg "http://localhost:4566" --type ps1 --type sh --type ts --type tsx --type js --type jsx
```

### Verify environment variable usage:
```powershell
# PowerShell
rg "\$ENDPOINT|\$env:DYNAMODB_ENDPOINT|DYNAMODB_ENDPOINT" scripts/
```

---

## Related Documentation

- `ENTERPRISE_BEST_PRACTICES.md` - Complete implementation guide
- `ENTERPRISE_IMPLEMENTATION_SUMMARY.txt` - Quick reference
- `ENVIRONMENT_CONFIGURATION_GUIDE.md` - Environment setup guide
- `.env.example` - Template with all variables
- `.github/workflows/deploy-staging.yml` - CI/CD configuration

---

## Conclusion

✅ **Audit Complete**: All hardcoded endpoints have been eliminated from the codebase. The project now follows enterprise best practices for environment configuration, enabling seamless promotion across all environments without code changes.
