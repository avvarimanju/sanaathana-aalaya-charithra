# Local Integration Test Checklist

**Date**: March 2, 2026  
**Purpose**: Verify end-to-end integration between Backend, Admin Portal, and Mobile App

---

## Pre-Test Setup

- [ ] Docker Desktop is running
- [ ] LocalStack container is running (`docker ps | Select-String "temple-localstack"`)
- [ ] DynamoDB tables are created (`aws dynamodb list-tables --endpoint-url http://localhost:4566`)
- [ ] Backend server is running on port 4000
- [ ] Admin Portal is running on port 5173
- [ ] Mobile App is running on port 8081

---

## Test Suite 1: Backend Health & Connectivity

### Test 1.1: Backend Health Check
- [ ] Open: http://localhost:4000/health
- [ ] Expected: `{"status":"ok","environment":"local"}`
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 1.2: LocalStack Connectivity
- [ ] Run: `aws dynamodb list-tables --endpoint-url http://localhost:4566`
- [ ] Expected: List of 10 tables (Temples, TempleGroups, etc.)
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 1.3: Backend API Endpoints
- [ ] Run: `curl http://localhost:4000/api/temples`
- [ ] Expected: `{"items":[],"total":0}` (empty list initially)
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 2: Temple Management (CRUD)

### Test 2.1: Create Temple (Admin Portal)
- [ ] Open Admin Portal: http://localhost:5173
- [ ] Navigate to "Temples" → "Create Temple"
- [ ] Fill in details:
  - Name: "Integration Test Temple"
  - Location: "Test City, Test State"
  - Access Mode: "Free"
  - Status: "Active"
- [ ] Click "Create"
- [ ] Expected: Success message, temple appears in list
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.2: Verify Temple in Backend
- [ ] Run: `curl http://localhost:4000/api/temples`
- [ ] Expected: Response contains "Integration Test Temple"
- [ ] Note temple ID: `_________________`
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.3: View Temple in Mobile App
- [ ] Open Mobile App: http://localhost:8081 (or press `w` in Expo terminal)
- [ ] Navigate to "Explore" or "Temples"
- [ ] Expected: "Integration Test Temple" appears in list
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.4: Update Temple (Admin Portal)
- [ ] In Admin Portal, click on "Integration Test Temple"
- [ ] Click "Edit"
- [ ] Change location to: "Updated City, Updated State"
- [ ] Click "Save"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.5: Verify Update in Mobile App
- [ ] Refresh Mobile App (pull to refresh or reload)
- [ ] Open "Integration Test Temple"
- [ ] Expected: Location shows "Updated City, Updated State"
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.6: Delete Temple (Admin Portal)
- [ ] In Admin Portal, click on "Integration Test Temple"
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Expected: Temple removed from list
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 2.7: Verify Deletion in Mobile App
- [ ] Refresh Mobile App
- [ ] Expected: "Integration Test Temple" no longer appears
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 3: Pricing Management

### Test 3.1: Create Temple with Pricing
- [ ] In Admin Portal, create new temple:
  - Name: "Paid Temple Test"
  - Access Mode: "Paid"
- [ ] Navigate to "Pricing" → "Configure Price"
- [ ] Select "Paid Temple Test"
- [ ] Set price: ₹100
- [ ] Click "Save"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 3.2: Verify Price in Backend
- [ ] Run: `curl "http://localhost:4000/api/pricing/{templeId}?entityType=TEMPLE"`
- [ ] Replace `{templeId}` with actual temple ID
- [ ] Expected: Response shows `"priceAmount":100`
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 3.3: View Price in Mobile App
- [ ] Open Mobile App
- [ ] Navigate to "Paid Temple Test"
- [ ] Expected: Price shows "₹100"
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 3.4: Update Price
- [ ] In Admin Portal, update price to ₹150
- [ ] Refresh Mobile App
- [ ] Expected: Price shows "₹150"
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 4: Artifact Management

### Test 4.1: Create Artifact
- [ ] In Admin Portal, navigate to "Artifacts" → "Create Artifact"
- [ ] Select temple: "Paid Temple Test"
- [ ] Fill in details:
  - Name: "Test Artifact"
  - Type: "Sculpture"
  - Status: "Active"
- [ ] Click "Create"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 4.2: Verify Artifact in Backend
- [ ] Run: `curl "http://localhost:4000/api/artifacts?templeId={templeId}"`
- [ ] Expected: Response contains "Test Artifact"
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 4.3: View Artifact in Mobile App
- [ ] Open Mobile App
- [ ] Navigate to "Paid Temple Test" → "Artifacts"
- [ ] Expected: "Test Artifact" appears in list
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 5: Temple Groups

### Test 5.1: Create Temple Group
- [ ] In Admin Portal, navigate to "Temple Groups" → "Create Group"
- [ ] Fill in details:
  - Name: "Test Group"
  - Description: "Integration test group"
- [ ] Add temples to group
- [ ] Click "Create"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 5.2: Verify Group in Backend
- [ ] Run: `curl http://localhost:4000/api/temple-groups`
- [ ] Expected: Response contains "Test Group"
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 6: Content Generation

### Test 6.1: Generate Content
- [ ] In Admin Portal, navigate to "Content" → "Generate"
- [ ] Select artifact: "Test Artifact"
- [ ] Select content type: "Description"
- [ ] Select language: "English"
- [ ] Click "Generate"
- [ ] Expected: Job created with status "pending"
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 6.2: View Content Jobs
- [ ] Run: `curl http://localhost:4000/api/content/jobs`
- [ ] Expected: Response contains the job
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 7: User Management

### Test 7.1: Create Admin User
- [ ] In Admin Portal, navigate to "Users" → "Create User"
- [ ] Fill in details:
  - Name: "Test Admin"
  - Email: "test@example.com"
  - Role: "Admin"
- [ ] Click "Create"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 7.2: Verify User in Backend
- [ ] Run: `curl http://localhost:4000/api/admin/users`
- [ ] Expected: Response contains "Test Admin"
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 8: Defect Tracking

### Test 8.1: Submit Defect (Mobile App)
- [ ] In Mobile App, navigate to "Report Issue"
- [ ] Fill in details:
  - Title: "Test Defect"
  - Description: "Integration test defect"
  - Type: "Content Error"
  - Priority: "Medium"
- [ ] Click "Submit"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 8.2: View Defect in Admin Portal
- [ ] In Admin Portal, navigate to "Defects"
- [ ] Expected: "Test Defect" appears in list
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 8.3: Update Defect Status
- [ ] In Admin Portal, click on "Test Defect"
- [ ] Change status to "In Progress"
- [ ] Add comment: "Working on it"
- [ ] Click "Save"
- [ ] Expected: Success message
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 9: Data Persistence

### Test 9.1: Restart Backend
- [ ] Stop backend server (Ctrl+C)
- [ ] Start backend server again
- [ ] Run: `curl http://localhost:4000/api/temples`
- [ ] Expected: All previously created temples still exist
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 9.2: Restart LocalStack
- [ ] Run: `docker-compose down`
- [ ] Run: `docker-compose up -d`
- [ ] Wait 5 seconds
- [ ] Run: `.\scripts\init-db-simple.ps1` (recreate tables)
- [ ] Expected: Tables recreated (data will be lost - this is expected)
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 10: Error Handling

### Test 10.1: Invalid Temple Creation
- [ ] In Admin Portal, try to create temple with empty name
- [ ] Expected: Validation error message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 10.2: Backend Offline
- [ ] Stop backend server
- [ ] In Admin Portal, try to create temple
- [ ] Expected: Network error message
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 10.3: LocalStack Offline
- [ ] Stop LocalStack: `docker-compose down`
- [ ] In Admin Portal, try to create temple
- [ ] Expected: Error message (backend can't connect to database)
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 11: Performance

### Test 11.1: List Performance
- [ ] Create 20 temples in Admin Portal
- [ ] Measure time to load temple list
- [ ] Expected: < 2 seconds
- [ ] Actual time: _______ seconds
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 11.2: Search Performance
- [ ] Search for temple by name
- [ ] Expected: < 1 second
- [ ] Actual time: _______ seconds
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Test Suite 12: Cross-App Synchronization

### Test 12.1: Real-Time Sync Test
- [ ] Open Admin Portal in one browser window
- [ ] Open Mobile App in another browser window
- [ ] In Admin Portal, create a new temple
- [ ] In Mobile App, refresh the list
- [ ] Expected: New temple appears immediately
- [ ] Status: ⬜ Pass | ⬜ Fail

### Test 12.2: Multiple Admin Users
- [ ] Open Admin Portal in two different browsers
- [ ] In Browser 1, create a temple
- [ ] In Browser 2, refresh the list
- [ ] Expected: Temple appears in both browsers
- [ ] Status: ⬜ Pass | ⬜ Fail

---

## Summary

### Test Results

| Test Suite | Total Tests | Passed | Failed | Pass Rate |
|------------|-------------|--------|--------|-----------|
| 1. Backend Health | 3 | ___ | ___ | ___% |
| 2. Temple CRUD | 7 | ___ | ___ | ___% |
| 3. Pricing | 4 | ___ | ___ | ___% |
| 4. Artifacts | 3 | ___ | ___ | ___% |
| 5. Temple Groups | 2 | ___ | ___ | ___% |
| 6. Content | 2 | ___ | ___ | ___% |
| 7. Users | 2 | ___ | ___ | ___% |
| 8. Defects | 3 | ___ | ___ | ___% |
| 9. Persistence | 2 | ___ | ___ | ___% |
| 10. Error Handling | 3 | ___ | ___ | ___% |
| 11. Performance | 2 | ___ | ___ | ___% |
| 12. Sync | 2 | ___ | ___ | ___% |
| **TOTAL** | **35** | **___** | **___** | **___%** |

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Sign-Off

- [ ] All critical tests passed
- [ ] Integration is ready for AWS deployment
- [ ] Documentation is complete

**Tested By**: _________________  
**Date**: _________________  
**Signature**: _________________

---

**Next Steps**:
1. Fix any critical issues found
2. Re-run failed tests
3. Proceed with AWS deployment (see `docs/deployment/aws-deployment.md`)

---

**Document Version**: 1.0  
**Last Updated**: March 2, 2026  
**Status**: Ready for Testing
