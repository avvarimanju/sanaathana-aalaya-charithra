# 🚀 Quick Start Guide

Get the Sanaathana Aalaya Charithra development environment running in 5 minutes!

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js 18 or higher**
   - Download: https://nodejs.org/
   - Verify installation: `node --version`
   - Should show v18.0.0 or higher

2. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - **IMPORTANT:** Docker Desktop must be running before starting the development environment
   - Required for LocalStack (local AWS services including DynamoDB)

3. **Git**
   - Download: https://git-scm.com/
   - Verify installation: `git --version`

### Optional Software

- **AWS CLI** - For manual DynamoDB operations (optional)
- **Postman** - For API testing (optional)

## Quick Start (Recommended)

### Single Command Startup

The easiest way to get started is using the automated startup script:

```powershell
.\scripts\start-dev-environment.ps1
```

This script will automatically:
1. ✅ Check Docker Desktop is running
2. ✅ Start LocalStack container (local AWS services)
3. ✅ Initialize DynamoDB tables
4. ✅ Start backend API server on port 4000
5. ✅ Start admin portal on port 5173
6. ✅ Verify all services are healthy

**Expected Output:**
```
================================================================
   Development Environment Ready!
================================================================

Service URLs:
  Backend API:    http://localhost:4000
  Admin Portal:   http://localhost:5173
  LocalStack:     http://localhost:4566

Next Steps:
  1. Open your browser to http://localhost:5173
  2. The admin portal should load without connection errors
  3. You should see the temples list load successfully
```

### Access Your Application

Once the startup script completes:

- **Admin Portal**: http://localhost:5173
  - Temple management interface
  - Artifact management
  - Pricing configuration
  - User management

- **Backend API**: http://localhost:4000
  - REST API endpoints
  - Health check: http://localhost:4000/health

- **LocalStack**: http://localhost:4566
  - Local AWS services (DynamoDB, S3, etc.)

## Manual Setup (Alternative)

If you prefer to start services manually or need more control:

### Step 1: Start Docker Desktop

1. Open Docker Desktop application
2. Wait for Docker to fully initialize (whale icon in system tray should be steady)
3. Verify Docker is running:
   ```powershell
   docker info
   ```

### Step 2: Start LocalStack

```powershell
docker-compose up -d
```

Wait for LocalStack to be ready (about 10-15 seconds).

### Step 3: Initialize Database

```powershell
.\scripts\init-db-simple.ps1
```

This creates the required DynamoDB tables.

### Step 4: Start Backend Server

**IMPORTANT:** The backend server MUST be started before the admin portal!

```powershell
cd backend/src/local-server
npm install
npm start
```

Wait for the message: "Server running on http://localhost:4000"

Verify backend is running:
```powershell
curl http://localhost:4000/health
```

### Step 5: Start Admin Portal

In a new terminal window:

```powershell
cd admin-portal
npm install
npm run dev
```

The admin portal will open at http://localhost:5173

### Step 6: Verify Everything Works

1. Open http://localhost:5173 in your browser
2. You should see the admin portal dashboard
3. Navigate to "Temples" - the list should load without errors
4. Check browser console - no ERR_CONNECTION_REFUSED errors

## Common Issues & Solutions

### ❌ "Error Loading Temples - Failed to load temples"

**Problem:** Backend API server is not running or not accessible.

**Solution:**
1. Check if backend is running: http://localhost:4000/health
2. If not running, start backend first: `cd backend/src/local-server && npm start`
3. Then refresh the admin portal
4. Or use the automated startup script: `.\scripts\start-dev-environment.ps1`

**Browser Console Shows:** `ERR_CONNECTION_REFUSED` for `http://localhost:4000/api/*`

This confirms the backend server is not accessible. Always start the backend before the admin portal.

### ❌ "Docker Desktop is not running"

**Problem:** Docker is not started or not accessible.

**Solution:**
1. Open Docker Desktop application
2. Wait for Docker to fully initialize
3. Verify: `docker info`
4. Run the startup script again

### ❌ "Port 4000 is already in use"

**Problem:** Another application is using port 4000.

**Solution:**
1. Find the process using port 4000:
   ```powershell
   netstat -ano | findstr :4000
   ```
2. Kill the process (replace PID with actual process ID):
   ```powershell
   taskkill /PID <PID> /F
   ```
3. Or stop the other application using port 4000
4. Restart the backend server

### ❌ "Port 5173 is already in use"

**Problem:** Another Vite dev server is running.

**Solution:**
1. Find and stop the other Vite server
2. Or Vite will automatically use the next available port (5174, 5175, etc.)
3. Check the terminal output for the actual port being used

### ❌ LocalStack connection errors

**Problem:** Backend can't connect to LocalStack DynamoDB.

**Solution:**
1. Verify LocalStack is running:
   ```powershell
   docker ps
   ```
   You should see a container named "temple-localstack"

2. Restart LocalStack:
   ```powershell
   docker-compose restart
   ```

3. Re-initialize database:
   ```powershell
   .\scripts\init-db-simple.ps1
   ```

4. Restart backend server

### ❌ Admin portal loads but shows no data

**Problem:** Backend is running but database is not initialized.

**Solution:**
1. Check backend health: http://localhost:4000/health
2. Initialize database: `.\scripts\init-db-simple.ps1`
3. Refresh admin portal

### ❌ "npm: command not found"

**Problem:** Node.js is not installed or not in PATH.

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Verify: `node --version` and `npm --version`

## Stopping Services

### Stop All Services

1. Press `Ctrl+C` in each PowerShell window (backend and admin portal)
2. Stop LocalStack:
   ```powershell
   docker-compose down
   ```

### Stop Individual Services

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Admin Portal:** Press `Ctrl+C` in the admin portal terminal
- **LocalStack:** `docker-compose stop`

## Next Steps

Now that your development environment is running:

1. **Explore the Admin Portal**
   - Navigate to http://localhost:5173
   - Browse temples, artifacts, and other features
   - Try creating a new temple or artifact

2. **Test the API**
   - Visit http://localhost:4000/health
   - Try API endpoints using Postman or curl
   - See [Backend API Reference](docs/api/backend-api.md)

3. **Start the Mobile App** (Optional)
   ```powershell
   cd Sanaathana-Aalaya-Charithra/mobile-app
   npm install
   npx expo start
   ```
   Scan the QR code with Expo Go app on your phone

4. **Read the Documentation**
   - [Local Development Guide](docs/getting-started/local-development.md)
   - [Architecture Overview](docs/architecture/system-overview.md)
   - [API Documentation](docs/api/backend-api.md)

5. **Make Your First Change**
   - Edit a file in `admin-portal/src/`
   - See hot reload in action
   - Changes appear instantly in the browser

## Development Workflow

### Typical Development Session

1. Start services: `.\scripts\start-dev-environment.ps1`
2. Make code changes
3. Test in browser (hot reload is automatic)
4. Run tests: `npm test`
5. Commit changes: `git commit -m "feat: your change"`
6. Stop services when done

### Running Tests

```powershell
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run admin portal tests
cd admin-portal && npm test

# Run mobile app tests
cd mobile-app && npm test
```

### Building for Production

```powershell
# Build all projects
npm run build

# Build specific project
cd admin-portal && npm run build
cd backend && npm run build
```

## Important Notes

### ⚠️ Startup Sequence Matters

The backend server MUST be running before the admin portal can load data. This is why the automated startup script exists - it ensures services start in the correct order:

1. Docker Desktop
2. LocalStack (DynamoDB)
3. Backend API Server (port 4000)
4. Admin Portal (port 5173)

If you start services manually, always follow this order!

### ⚠️ Docker Desktop Must Be Running

LocalStack requires Docker Desktop to be running. If you see Docker-related errors, check that Docker Desktop is open and fully initialized.

### ⚠️ Port Conflicts

If you have other applications using ports 4000, 5173, or 4566, you'll need to either:
- Stop those applications
- Or modify the port configuration in the project

## Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting section in README.md](README.md#troubleshooting)
2. Review the [Local Development Guide](docs/getting-started/local-development.md)
3. Check the backend logs in the PowerShell window
4. Check browser console for errors
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, Docker version)

## Summary

You should now have:
- ✅ Backend API running on http://localhost:4000
- ✅ Admin Portal running on http://localhost:5173
- ✅ LocalStack running on http://localhost:4566
- ✅ DynamoDB tables initialized
- ✅ No connection errors in the admin portal

**Happy coding! 🎉**

---

*For more detailed information, see the [main README.md](README.md) and [documentation](docs/).*
