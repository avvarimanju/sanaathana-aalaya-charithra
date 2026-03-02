# Local Integration Guide

**Date**: March 2, 2026  
**Status**: ✅ READY FOR LOCAL TESTING

---

## Overview

This guide walks you through setting up and testing the **full local integration** between:
- Backend API (Express server on port 4000)
- Admin Portal (React/Vite on port 5173)
- Mobile App (Expo on port 8081)
- LocalStack DynamoDB (on port 4566)

All components will run on your local machine, allowing you to test end-to-end integration **without AWS costs**.

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Mobile App     │         │  Admin Portal   │
│  :8081          │         │  :5173          │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ HTTP/REST                 │ HTTP/REST
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Backend Server       │
         │  :4000                │
         │  (Express + Lambda    │
         │   functions)          │
         └───────────┬───────────┘
                     │
                     │ AWS SDK
                     │
                     ▼
         ┌───────────────────────┐
         │  LocalStack           │
         │  :4566                │
         │  (DynamoDB Local)     │
         └───────────────────────┘
```

---

## Prerequisites

### Required Software

1. **Docker Desktop** (for LocalStack)
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version`

2. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

4. **AWS CLI** (for DynamoDB table creation)
   - Download: https://aws.amazon.com/cli/
   - Verify: `aws --version`

### Optional Software

- **Postman** or **Insomnia** (for API testing)
- **DynamoDB Admin** (for viewing local DynamoDB data)
  ```bash
  npm install -g dynamodb-admin
  dynamodb-admin --port 8001
  ```

---

## Quick Start (Automated)

### Option 1: One-Command Startup

```powershell
# From project root
cd Sanaathana-Aalaya-Charithra
.\scripts\start-local-integration.ps1
```

This script will:
1. ✅ Check prerequisites (Docker, Node.js, npm)
2. ✅ Start LocalStack container
3. ✅ Initialize DynamoDB tables
4. ✅ Install all dependencies
5. ✅ Start backend server (new window)
6. ✅ Start admin portal (new window)
7. ✅ Start mobile app (new window)

**Total time**: ~2-3 minutes (first run), ~30 seconds (subsequent runs)

---

## Manual Setup (Step-by-Step)

### Step 1: Start LocalStack

```powershell
# From project root
cd Sanaathana-Aalaya-Charithra
docker-compose up -d
```

Verify LocalStack is running:
```powershell
docker ps | Select-String "temple-localstack"
```

### Step 2: Initialize DynamoDB Tables

```powershell
.\scripts\init-db-simple.ps1
```

This creates 10 tables:
- Temples
- TempleGroups
- Artifacts
- PriceConfigurations
- PriceHistory
- PricingFormulas
- FormulaHistory
- AccessGrants
- PriceOverrides
- AuditLog

Verify tables were created:
```powershell
aws dynamodb list-tables --endpoint-url http://localhost:4566
```

### Step 3: Start Backend Server

```powershell
# Terminal 1
cd src/local-server
npm install  # First time only
npm start
```

Expected output:
```
🚀 Local Backend Server Started Successfully!
Server URL:        http://localhost:4000
LocalStack:        http://localhost:4566
```

Verify backend is running:
```powershell
curl http://localhost:4000/health
```

### Step 4: Start Admin Portal

```powershell
# Terminal 2
cd admin-portal
npm install  # First time only
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 1234 ms
➜  Local:   http://localhost:5173/
```

Open browser: http://localhost:5173

### Step 5: Start Mobile App

```powershell
# Terminal 3
cd mobile-app
npm install  # First time only
npm start
```

Expected output:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

Options to view mobile app:
- **Web browser**: Press `w` in terminal → Opens http://localhost:8081
- **Android emulator**: Press `a` in terminal
- **iOS simulator**: Press `i` in terminal (Mac only)
- **Physical device**: Scan QR code with Expo Go app

---

## Testing Integration

### Test 1: Backend Health Check

```powershell
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "local",
  "localstack": "http://localhost:4566",
  "timestamp": "2026-03-02T10:30:00.000Z"
}
```

### Test 2: Create Temple in Admin Portal

1. Open Admin Portal: http://localhost:5173
2. Navigate to "Temples" → "Create Temple"
3. Fill in temple details:
   - Name: "Test Temple"
   - Location: "Test City"
   - Access Mode: "Free"
4. Click "Create"
5. Verify temple appears in the list

### Test 3: Verify Temple in Backend

```powershell
curl http://localhost:4000/api/temples
```

Expected response:
```json
{
  "items": [
    {
      "templeId": "temple-xxx",
      "name": "Test Temple",
      "location": "Test City",
      "accessMode": "FREE",
      "status": "active"
    }
  ],
  "total": 1
}
```

### Test 4: View Temple in Mobile App

1. Open Mobile App (web: http://localhost:8081)
2. Navigate to "Explore" or "Temples"
3. Verify "Test Temple" appears in the list
4. Click on the temple to view details

### Test 5: Update Temple Price

1. In Admin Portal, go to "Pricing" → "Configure Price"
2. Select "Test Temple"
3. Set price: ₹100
4. Click "Save"
5. In Mobile App, verify the price is updated

### Test 6: End-to-End CRUD Operations

| Operation | Admin Portal | Backend API | Mobile App |
|-----------|-------------|-------------|------------|
| **Create** | Create temple | POST /api/temples | View in list |
| **Read** | View temple list | GET /api/temples | View details |
| **Update** | Edit temple | PUT /api/temples/:id | See changes |
| **Delete** | Delete temple | DELETE /api/temples/:id | Temple removed |

---

## Environment Configuration

### Backend (.env.local)

Located at: `src/local-server/.env.local`

```env
# AWS Configuration
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Server Configuration
PORT=4000
NODE_ENV=development

# DynamoDB Tables
TEMPLES_TABLE=Temples
TEMPLE_GROUPS_TABLE=TempleGroups
ARTIFACTS_TABLE=Artifacts
PRICE_CONFIGURATIONS_TABLE=PriceConfigurations
PRICE_HISTORY_TABLE=PriceHistory
PRICING_FORMULAS_TABLE=PricingFormulas
FORMULA_HISTORY_TABLE=FormulaHistory
ACCESS_GRANTS_TABLE=AccessGrants
PRICE_OVERRIDES_TABLE=PriceOverrides
AUDIT_LOG_TABLE=AuditLog
```

### Admin Portal (.env.development)

Located at: `admin-portal/.env.development`

```env
# Environment
VITE_ENV=development

# API Configuration - Local Backend
VITE_API_BASE_URL=http://localhost:4000

# API Timeout (milliseconds)
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_LOGS=true

# Admin User (for development only)
VITE_DEFAULT_ADMIN_ID=local-admin
```

### Mobile App (.env.development)

Located at: `mobile-app/.env.development`

```env
# API Configuration - Local Backend
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_ENVIRONMENT=development

# Demo Mode - Set to false to use real backend
EXPO_PUBLIC_DEMO_MODE=false

# Feature Flags
EXPO_PUBLIC_ENABLE_DEBUG_LOGS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=false
```

---

## API Endpoints

### Temple Management

```
POST   /api/temples              Create temple
GET    /api/temples              List temples
GET    /api/temples/:id          Get temple details
PUT    /api/temples/:id          Update temple
DELETE /api/temples/:id          Delete temple
```

### Temple Groups

```
POST   /api/temple-groups        Create temple group
GET    /api/temple-groups        List temple groups
GET    /api/temple-groups/:id    Get temple group
```

### Artifacts

```
POST   /api/artifacts            Create artifact
GET    /api/artifacts            List artifacts (requires templeId)
GET    /api/artifacts/:id        Get artifact details
```

### Pricing

```
POST   /api/pricing/configure    Set price configuration
GET    /api/pricing/:entityId    Get price configuration
GET    /api/pricing/:entityId/history  Get price history
```

### Price Calculator

```
POST   /api/calculator/formula   Set pricing formula
POST   /api/calculator/suggest   Calculate suggested price
POST   /api/calculator/simulate  Simulate formula change
```

### Content Generation

```
GET    /api/content/jobs         List content jobs
GET    /api/content/jobs/:id     Get job details
POST   /api/content/generate     Generate content
PUT    /api/content/jobs/:id     Update job
DELETE /api/content/jobs/:id     Delete job
```

### User Management

```
GET    /api/admin/users          List admin users
POST   /api/admin/users          Create admin user
PUT    /api/admin/users/:id      Update admin user
DELETE /api/admin/users/:id      Delete admin user
GET    /api/mobile/users         List mobile users
```

### Defect Tracking

```
GET    /api/defects              List defects
POST   /api/defects              Create defect
PUT    /api/defects/:id          Update defect
DELETE /api/defects/:id          Delete defect
POST   /api/defects/:id/comments Add comment
```

---

## Troubleshooting

### Issue: LocalStack not starting

**Symptoms**: `docker-compose up -d` fails

**Solutions**:
1. Check if Docker Desktop is running
2. Check if port 4566 is already in use:
   ```powershell
   netstat -ano | findstr :4566
   ```
3. Restart Docker Desktop
4. Try: `docker-compose down` then `docker-compose up -d`

### Issue: Backend server fails to start

**Symptoms**: "Cannot find module" or "ECONNREFUSED"

**Solutions**:
1. Install dependencies:
   ```powershell
   cd src/local-server
   npm install
   ```
2. Check if LocalStack is running:
   ```powershell
   docker ps | Select-String "temple-localstack"
   ```
3. Verify environment variables in `.env.local`

### Issue: Admin Portal shows "Network Error"

**Symptoms**: API calls fail with network error

**Solutions**:
1. Check if backend is running: `curl http://localhost:4000/health`
2. Verify `.env.development` has correct API URL
3. Check browser console for CORS errors
4. Restart admin portal: `npm run dev`

### Issue: Mobile App shows mock data

**Symptoms**: Changes in admin portal not reflected in mobile app

**Solutions**:
1. Verify `EXPO_PUBLIC_DEMO_MODE=false` in `.env.development`
2. Restart Expo: Press `r` in terminal or `npm start`
3. Clear Expo cache: `npx expo start -c`
4. Check if backend is accessible from mobile device

### Issue: DynamoDB tables not created

**Symptoms**: Backend returns "ResourceNotFoundException"

**Solutions**:
1. Run table initialization script:
   ```powershell
   .\scripts\init-db-simple.ps1
   ```
2. Verify tables exist:
   ```powershell
   aws dynamodb list-tables --endpoint-url http://localhost:4566
   ```
3. Check LocalStack logs:
   ```powershell
   docker logs temple-localstack
   ```

### Issue: Port already in use

**Symptoms**: "EADDRINUSE" error

**Solutions**:
1. Find process using the port:
   ```powershell
   # Backend (4000)
   netstat -ano | findstr :4000
   
   # Admin Portal (5173)
   netstat -ano | findstr :5173
   
   # Mobile App (8081)
   netstat -ano | findstr :8081
   ```
2. Kill the process:
   ```powershell
   taskkill /PID <PID> /F
   ```
3. Or use different ports in environment files

---

## Viewing Local Data

### Option 1: AWS CLI

```powershell
# List all temples
aws dynamodb scan --table-name Temples --endpoint-url http://localhost:4566

# Get specific temple
aws dynamodb get-item --table-name Temples --key '{"PK":{"S":"TEMPLE#temple-xxx"},"SK":{"S":"METADATA"}}' --endpoint-url http://localhost:4566

# Query by status
aws dynamodb query --table-name Temples --index-name GSI1 --key-condition-expression "GSI1PK = :status" --expression-attribute-values '{":status":{"S":"STATUS#active"}}' --endpoint-url http://localhost:4566
```

### Option 2: DynamoDB Admin UI

```powershell
# Install globally
npm install -g dynamodb-admin

# Start admin UI
DYNAMO_ENDPOINT=http://localhost:4566 dynamodb-admin --port 8001
```

Open browser: http://localhost:8001

### Option 3: Backend API

```powershell
# List temples
curl http://localhost:4000/api/temples

# Get temple
curl http://localhost:4000/api/temples/temple-xxx

# Create temple
curl -X POST http://localhost:4000/api/temples -H "Content-Type: application/json" -d '{"name":"Test Temple","location":"Test City","accessMode":"FREE"}'
```

---

## Stopping Services

### Stop All Services

```powershell
# Stop backend, admin portal, mobile app
# Press Ctrl+C in each terminal window

# Stop LocalStack
docker-compose down
```

### Clean Restart

```powershell
# Stop everything
docker-compose down

# Remove LocalStack data
Remove-Item -Recurse -Force localstack-data

# Start fresh
.\scripts\start-local-integration.ps1
```

---

## Next Steps

### After Local Testing

Once you've verified everything works locally:

1. **Deploy to AWS Staging**
   - Follow `docs/deployment/aws-deployment.md`
   - Estimated cost: $55/month (staging)

2. **Update Environment Files**
   - Admin Portal: `.env.staging`
   - Mobile App: `.env.staging`
   - Point to AWS API Gateway URL

3. **Run Integration Tests**
   - Test with real AWS services
   - Verify authentication works
   - Test payment flow

4. **Deploy to Production**
   - Follow production deployment guide
   - Estimated cost: $350/month (production)

### Performance Optimization

- Add Redis caching (ElastiCache)
- Enable CloudFront CDN
- Optimize DynamoDB indexes
- Add API Gateway caching

### Security Hardening

- Enable Cognito authentication
- Add API key validation
- Implement rate limiting
- Enable CloudWatch monitoring

---

## Cost Comparison

| Environment | Monthly Cost | Notes |
|-------------|-------------|-------|
| **Local** | $0 | Free, runs on your machine |
| **Staging** | $55 | AWS services, low traffic |
| **Production** | $350 | AWS services, high traffic |

**Recommendation**: Test thoroughly in local environment before deploying to AWS to minimize costs.

---

## Support

### Documentation

- Architecture: `INTEGRATION_STATUS.md`
- Deployment: `docs/deployment/aws-deployment.md`
- Testing: `docs/testing/test-guide.md`
- API Reference: Backend server logs

### Common Commands

```powershell
# Start everything
.\scripts\start-local-integration.ps1

# Start backend only
.\scripts\start-local-backend.ps1

# Initialize database
.\scripts\init-db-simple.ps1

# Run tests
npm test  # Backend tests
cd admin-portal && npm test  # Admin portal tests
cd mobile-app && npm test  # Mobile app tests

# View logs
docker logs temple-localstack  # LocalStack logs
```

---

**Document Version**: 1.0  
**Last Updated**: March 2, 2026  
**Status**: Ready for Local Testing  
**Next Review**: After first successful integration test
