# Starting Development Environment - Quick Guide

**Date**: March 4, 2026  
**Status**: Ready to Start

## Current Situation

Your development environment is ready to start, but Docker Desktop needs to be running first.

## Step-by-Step Instructions

### Step 1: Start Docker Desktop (REQUIRED)

1. **Open Docker Desktop** from your Windows Start menu
2. **Wait** for Docker to fully start (you'll see "Docker Desktop is running" in the system tray)
3. **Verify** Docker is running by opening PowerShell and running:
   ```powershell
   docker ps
   ```
   You should see a table header (even if no containers are running)

### Step 2: Start Everything with One Command

Once Docker is running, execute:

```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra
.\scripts\start-local-integration.ps1
```

This will:
- ✅ Start LocalStack (DynamoDB)
- ✅ Initialize database tables
- ✅ Start Backend Server (port 4000)
- ✅ Start Admin Portal (port 5173)
- ✅ Start Mobile App (port 8081)

### Step 3: Access Your Applications

After 1-2 minutes, you'll have:

| Application | URL | Description |
|-------------|-----|-------------|
| **Backend API** | http://localhost:4000 | REST API server |
| **Admin Portal** | http://localhost:5173 | Web admin interface |
| **Mobile App** | http://localhost:8081 | Mobile app in browser |
| **LocalStack** | http://localhost:4566 | Local AWS services |

### Step 4: Test Integration

1. Open **Admin Portal**: http://localhost:5173
2. Create a new temple
3. Open **Mobile App**: http://localhost:8081
4. Verify the temple appears

## Alternative: Manual Start (If Script Fails)

If the automated script has issues, start each component manually:

### Terminal 1: LocalStack
```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra
docker-compose up
```

### Terminal 2: Initialize Database
```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra
.\scripts\init-db-simple.ps1
```

### Terminal 3: Backend Server
```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\backend\src\local-server
npm install
npm start
```

### Terminal 4: Admin Portal
```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\admin-portal
npm install
npm run dev
```

### Terminal 5: Mobile App
```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\mobile-app
npm install
npm start
```

## What I Can Do Once Docker is Running

Once you start Docker Desktop, I can:

1. **Immediately start all services** using the script
2. **Run all tests** (unit + integration + end-to-end)
3. **Verify everything works** and give you test URLs
4. **Fix any issues** that come up during startup

## Why Docker is Needed

Docker provides:
- **LocalStack**: Local AWS DynamoDB for data storage
- **Isolated environment**: No conflicts with other services
- **Easy cleanup**: `docker-compose down` stops everything

## Next Steps

**Please start Docker Desktop now**, then let me know and I'll:
1. Run the startup script
2. Verify all services are running
3. Run comprehensive tests
4. Give you the final URLs to test

---

**Waiting for**: Docker Desktop to start  
**Then**: I'll complete the setup in 2-3 minutes  
**Result**: Fully working development environment with test URLs
