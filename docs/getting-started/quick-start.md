# Quick Start Guide

Get the Sanaathana Aalaya Charithra project running locally in 5 minutes.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- Git installed
- PowerShell or Git Bash

## Step 1: Start LocalStack (30 seconds)

LocalStack provides local AWS services for development.

```powershell
cd Sanaathana-Aalaya-Charithra
docker-compose up -d
```

**Verify:**
```powershell
docker ps
# Should show: temple-localstack container running
```

## Step 2: Initialize Database (30 seconds)

Create DynamoDB tables in LocalStack:

```powershell
.\scripts\init-local-db.ps1
```

This creates 10 tables:
- Temples, TempleGroups, Artifacts
- PriceConfigurations, PriceHistory, PricingFormulas, FormulaHistory
- AccessGrants, PriceOverrides, AuditLog

**Verify:**
```powershell
aws dynamodb list-tables --endpoint-url http://localhost:4566
# Should show: 10 tables
```

## Step 3: Start Backend Server (30 seconds)

Start the local Express.js backend:

```powershell
.\scripts\start-local-backend.ps1
```

**Verify:**
```powershell
curl http://localhost:4000/health
# Should return: {"status":"ok",...}
```

## Step 4: Start Admin Portal (30 seconds)

```powershell
cd admin-portal
npm install  # First time only
npm run dev
```

**Open:** http://localhost:5173

## Step 5: Start Mobile App (Optional)

```powershell
cd mobile-app
npm install  # First time only
npx expo start
```

Scan the QR code with Expo Go app on your phone.

## Success Checklist

- [ ] LocalStack running (port 4566)
- [ ] 10 DynamoDB tables created
- [ ] Backend server running (port 4000)
- [ ] Admin Portal running (port 5173)
- [ ] Health check passes
- [ ] Can create and list temples

## Quick Test

Open http://localhost:5173, press F12, and run in console:

```javascript
// Test health check
const health = await fetch('http://localhost:4000/health').then(r => r.json());
console.log('✅ Backend is running:', health);

// Test create temple
const temple = await fetch('http://localhost:4000/api/temples', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Temple',
    description: 'My first temple',
    location: {
      state: 'Karnataka',
      city: 'Bangalore',
      address: '123 Test Street'
    },
    accessMode: 'HYBRID'
  })
}).then(r => r.json());
console.log('✅ Created temple:', temple);
```

## Troubleshooting

### Backend not responding?
```powershell
curl http://localhost:4000/health
# If fails, restart: .\scripts\start-local-backend.ps1
```

### LocalStack not running?
```powershell
docker ps
# If not running: docker-compose up -d
```

### No data showing?
```powershell
# Re-initialize database
.\scripts\init-local-db.ps1
```

### Port already in use?
```powershell
# Check what's using the port
netstat -ano | findstr "4000"
# Kill the process or use a different port
```

## Architecture

```
Browser (localhost:5173)
    ↓
Admin Portal (React + Vite)
    ↓
API Clients (TypeScript)
    ↓ HTTP
Backend Server (localhost:4000)
    ↓
Lambda Functions (as modules)
    ↓ AWS SDK
LocalStack (localhost:4566)
    ↓
DynamoDB Tables
```

## What's Next?

- [Local Development Guide](./local-development.md) - Detailed development workflow
- [Environment Setup](./environment-setup.md) - Configure different environments
- [API Reference](../api/backend-api.md) - Backend API documentation
- [Testing Guide](../testing/test-guide.md) - Run tests

## Quick Commands

```powershell
# Start everything
docker-compose up -d
.\scripts\start-local-backend.ps1
cd admin-portal && npm run dev

# Stop everything
docker-compose down
# Ctrl+C in backend terminal
# Ctrl+C in admin portal terminal

# Check status
curl http://localhost:4000/health
docker ps
netstat -ano | findstr "4000 4566 5173"

# Re-initialize database
.\scripts\init-local-db.ps1
```

## Cost

Development environment: **$0/month** (all local)

See [Deployment Guide](../deployment/aws-deployment.md) for staging and production costs.
