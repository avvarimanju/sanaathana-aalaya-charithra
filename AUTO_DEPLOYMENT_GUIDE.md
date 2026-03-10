# Auto-Deployment Guide

## Overview
Automated deployment for all three applications:
- **Admin Portal** (React/Vite)
- **Mobile App** (React Native/Expo)
- **Backend** (AWS CDK/Lambda)

## Quick Start

### Deploy Everything to Dev
```powershell
.\scripts\auto-deploy-all.ps1 -Environment dev
```

### Deploy Specific Application
```powershell
# Admin Portal only
.\scripts\auto-deploy-all.ps1 -Target admin -Environment staging

# Mobile App only
.\scripts\auto-deploy-all.ps1 -Target mobile -Environment production

# Backend only
.\scripts\auto-deploy-all.ps1 -Target backend -Environment staging
```

### Dry Run (Preview)
```powershell
.\scripts\auto-deploy-all.ps1 -Environment production -DryRun
```

## Deployment Environments

### 1. Development (dev)
- **Purpose**: Local development and testing
- **Admin Portal**: http://localhost:5173
- **Mobile App**: Expo Dev Client
- **Backend**: http://localhost:4000

```powershell
.\scripts\auto-deploy-all.ps1 -Environment dev
```

### 2. Staging
- **Purpose**: Pre-production testing
- **Admin Portal**: Deployed to staging URL
- **Mobile App**: EAS Preview builds
- **Backend**: AWS staging environment

```powershell
.\scripts\auto-deploy-all.ps1 -Environment staging
```

### 3. Production
- **Purpose**: Live production environment
- **Admin Portal**: Production URL
- **Mobile App**: App stores (Google Play, Apple App Store)
- **Backend**: AWS production environment

```powershell
.\scripts\auto-deploy-all.ps1 -Environment production
```

## Deployment Options

### Skip Tests
```powershell
.\scripts\auto-deploy-all.ps1 -SkipTests
```

### Skip Build
```powershell
.\scripts\auto-deploy-all.ps1 -SkipBuild
```

### Combined Options
```powershell
.\scripts\auto-deploy-all.ps1 -Environment staging -Target admin -SkipTests
```

## Application-Specific Deployment

### Admin Portal Deployment

#### Option 1: AWS S3 + CloudFront
```powershell
# Build
cd admin-portal
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-admin-portal-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 2: Netlify
```powershell
cd admin-portal
npm run build
netlify deploy --prod --dir=dist
```

#### Option 3: Vercel
```powershell
cd admin-portal
vercel --prod
```

### Mobile App Deployment

#### Development Build
```powershell
cd mobile-app
eas build --platform android --profile development
eas build --platform ios --profile development
```

#### Staging Build (Internal Testing)
```powershell
cd mobile-app
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

#### Production Build (App Stores)
```powershell
cd mobile-app

# Build
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Backend Deployment

#### AWS CDK Deployment
```powershell
cd backend

# Staging
cdk deploy --all --profile staging

# Production
cdk deploy --all --profile production --require-approval never
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy All Applications

on:
  push:
    branches:
      - main
      - staging
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Determine Environment
        id: env
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
          fi
      
      - name: Deploy
        run: |
          chmod +x scripts/auto-deploy-all.sh
          ./scripts/auto-deploy-all.sh ${{ steps.env.outputs.environment }}
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Separate Workflows for Each App

#### Admin Portal Workflow
`.github/workflows/deploy-admin.yml`:

```yaml
name: Deploy Admin Portal

on:
  push:
    branches: [main, staging]
    paths:
      - 'admin-portal/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: admin-portal
        run: npm ci
      
      - name: Run tests
        working-directory: admin-portal
        run: npm test
      
      - name: Build
        working-directory: admin-portal
        run: npm run build
      
      - name: Deploy to S3
        working-directory: admin-portal
        run: |
          aws s3 sync dist/ s3://${{ secrets.ADMIN_PORTAL_BUCKET }} --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

#### Mobile App Workflow
`.github/workflows/deploy-mobile.yml`:

```yaml
name: Deploy Mobile App

on:
  push:
    branches: [main]
    paths:
      - 'mobile-app/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        working-directory: mobile-app
        run: npm ci
      
      - name: Build Android
        working-directory: mobile-app
        run: eas build --platform android --profile production --non-interactive
      
      - name: Build iOS
        working-directory: mobile-app
        run: eas build --platform ios --profile production --non-interactive
```

#### Backend Workflow
`.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main, staging]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install AWS CDK
        run: npm install -g aws-cdk
      
      - name: Deploy to AWS
        working-directory: backend
        run: cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Environment Variables

### Admin Portal
Create `.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_ENV=production
```

### Mobile App
Create `.env.production`:
```env
API_URL=https://api.yourdomain.com
ENV=production
```

### Backend
Create `.env.production`:
```env
STAGE=production
AWS_REGION=us-east-1
```

## Deployment Checklist

### Before Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations ready (if any)
- [ ] Backup current production (if applicable)
- [ ] Notify team of deployment

### Admin Portal

- [ ] Build successful (`npm run build`)
- [ ] No console errors in production build
- [ ] All routes accessible
- [ ] API endpoints configured correctly
- [ ] Assets loading properly

### Mobile App

- [ ] EAS build successful
- [ ] App tested on physical devices
- [ ] Push notifications working
- [ ] Deep links configured
- [ ] App store metadata updated

### Backend

- [ ] CDK synth successful
- [ ] Lambda functions tested
- [ ] API Gateway routes working
- [ ] Database connections verified
- [ ] CloudWatch logs configured

### After Deployment

- [ ] Smoke tests passed
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify user access
- [ ] Update documentation

## Rollback Procedures

### Admin Portal Rollback
```powershell
# Revert to previous S3 version
aws s3 sync s3://your-backup-bucket/ s3://your-admin-portal-bucket/

# Or redeploy previous version
git checkout <previous-commit>
cd admin-portal
npm run build
aws s3 sync dist/ s3://your-admin-portal-bucket --delete
```

### Mobile App Rollback
```powershell
# Resubmit previous build
eas submit --platform android --id <previous-build-id>
eas submit --platform ios --id <previous-build-id>
```

### Backend Rollback
```powershell
# Rollback CDK stack
cd backend
cdk deploy --all --rollback
```

## Monitoring and Logs

### View Deployment Logs
```powershell
# Logs are saved in deployment-logs/
Get-Content deployment-logs/deploy-production-*.json | ConvertFrom-Json
```

### Monitor Applications

#### Admin Portal
- CloudWatch Logs (if on AWS)
- Browser console errors
- Google Analytics / monitoring tools

#### Mobile App
- Expo Application Services (EAS)
- Crashlytics / Sentry
- App store reviews

#### Backend
- CloudWatch Logs
- X-Ray tracing
- API Gateway metrics

## Troubleshooting

### Build Failures

**Issue**: npm install fails
```powershell
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Build fails with memory error
```powershell
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Deployment Failures

**Issue**: AWS credentials not found
```powershell
# Configure AWS CLI
aws configure
```

**Issue**: EAS build fails
```powershell
# Check EAS credentials
eas whoami
eas login
```

## Best Practices

1. **Always test before deploying to production**
2. **Use staging environment for validation**
3. **Deploy during low-traffic periods**
4. **Have rollback plan ready**
5. **Monitor deployments closely**
6. **Keep deployment logs**
7. **Automate as much as possible**
8. **Use feature flags for risky changes**

## Cost Optimization

### Admin Portal
- Use CloudFront caching
- Compress assets
- Enable gzip compression

### Mobile App
- Use EAS build credits efficiently
- Cache dependencies
- Optimize bundle size

### Backend
- Use Lambda reserved concurrency
- Enable API Gateway caching
- Optimize DynamoDB capacity

## Summary

The auto-deployment system provides:
- ✅ One-command deployment for all apps
- ✅ Environment-specific configurations
- ✅ Automated testing and building
- ✅ Dry run mode for safety
- ✅ Detailed deployment logs
- ✅ CI/CD integration ready
- ✅ Rollback procedures

Use it to streamline your deployment workflow and reduce manual errors!
