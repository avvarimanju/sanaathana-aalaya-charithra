# API Client Error Handling - Manual Test Guide

## Purpose
This document provides manual testing steps to verify the improved error handling for backend connection issues.

## Test Scenarios

### Scenario 1: Backend Server Not Running
**Steps:**
1. Ensure the backend server is NOT running (no process on port 4000)
2. Start the admin portal: `npm run dev` in the admin-portal directory
3. Open browser to http://localhost:5173
4. Navigate to the Temples page

**Expected Results:**
- ✅ Error icon shows 🔌 (plug icon) instead of ⚠️
- ✅ Error title shows "Backend Server Not Running"
- ✅ Error message shows: "Backend server is not running. Please start the backend server on port 4000."
- ✅ Helpful tip shows: "💡 Tip: Run `.\scripts\start-dev-environment.ps1` to start all services"
- ✅ "🔄 Retry" button is displayed
- ✅ Browser console shows clear error message (not generic "Failed to fetch")

### Scenario 2: Backend Server Starts After Error
**Steps:**
1. Start with backend server NOT running (see Scenario 1)
2. Observe the error message
3. Start the backend server: `cd backend && npm start`
4. Wait for backend to be ready (shows "Server running on port 4000")
5. Click the "🔄 Retry" button in the admin portal

**Expected Results:**
- ✅ Health check runs before attempting to load temples
- ✅ Error message disappears
- ✅ Temples list loads successfully
- ✅ No errors in browser console

### Scenario 3: Backend Server Running from Start
**Steps:**
1. Start the backend server first: `cd backend && npm start`
2. Start the admin portal: `npm run dev` in admin-portal directory
3. Open browser to http://localhost:5173
4. Navigate to the Temples page

**Expected Results:**
- ✅ Health check passes
- ✅ Temples list loads immediately without errors
- ✅ No error messages displayed
- ✅ Normal operation (existing functionality preserved)

### Scenario 4: Backend Server Crashes Mid-Session
**Steps:**
1. Start both backend and admin portal (normal operation)
2. Verify temples list loads successfully
3. Stop the backend server (Ctrl+C in backend terminal)
4. In admin portal, navigate away and back to Temples page, or click refresh

**Expected Results:**
- ✅ Connection error is detected
- ✅ User-friendly error message is displayed
- ✅ Error indicates backend server is not running
- ✅ Retry button allows recovery when backend is restarted

### Scenario 5: Other API Errors (Non-Connection)
**Steps:**
1. Start both backend and admin portal
2. Modify backend to return a 500 error for temples endpoint
3. Refresh the Temples page

**Expected Results:**
- ✅ Generic error message is shown (not connection-specific)
- ✅ Error icon shows ⚠️ (warning icon)
- ✅ Error title shows "Error Loading Temples"
- ✅ No tip about starting the backend server
- ✅ Retry button is still available

## Implementation Details

### Files Modified
1. **admin-portal/src/api/client.ts**
   - Added `isConnectionRefused` flag to `ApiError` interface
   - Added `handleFetchError()` method to detect connection refused errors
   - Wrapped all HTTP methods (GET, POST, PUT, DELETE) with try-catch
   - Added `isBackendAvailable()` method for health checks
   - Improved error messages for connection failures

2. **admin-portal/src/pages/TempleListPage.tsx**
   - Added `isConnectionError` state to track connection errors
   - Updated `loadTemples()` to check backend health before loading data
   - Enhanced error detection to identify connection-specific errors
   - Improved error UI with connection-specific icon and messages
   - Added helpful tip with startup script command
   - Updated retry button with icon

3. **admin-portal/src/pages/TempleListPage.css**
   - Added `.error-hint` styles for the helpful tip box
   - Added styles for `code` elements in error messages

### Key Features
- **Connection Detection**: Detects `ERR_CONNECTION_REFUSED` and `Failed to fetch` errors
- **Health Check**: Calls `/health` endpoint before attempting data loads
- **User-Friendly Messages**: Clear, actionable error messages
- **Visual Indicators**: Different icons for connection vs. other errors
- **Helpful Tips**: Provides the exact command to start services
- **Retry Functionality**: Retry button re-checks health before retrying

## Validation Checklist
- [x] API client detects connection refused errors
- [x] API client provides user-friendly error messages
- [x] Health check method added to API client
- [x] Temple list page checks backend health before loading
- [x] Connection errors show specific icon and message
- [x] Helpful tip with startup command is displayed
- [x] Retry button checks health before retrying
- [x] Existing functionality preserved when backend is running
- [x] TypeScript compilation passes with no errors
- [x] CSS styling added for error hint
