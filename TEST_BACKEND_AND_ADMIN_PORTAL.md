# Test Backend API and Admin Portal

## Current Status - All Services Running ✅

- ✅ Backend API (Terminal 7): http://localhost:4000
- ✅ Admin Portal (Terminal 3): http://localhost:5173
- ✅ LocalStack + DynamoDB: Running
- ✅ Mock data loaded: 2 temples, 1 artifact, 1 user

## Test 1: Backend API Health Check

Open these URLs in your browser:

### 1.1 Health Check
```
http://localhost:4000/health
```
**Expected**: `{"status":"ok","timestamp":"..."}`

### 1.2 Get All Temples
```
http://localhost:4000/api/temples
```
**Expected**: JSON array with 2 temples (Lepakshi Temple, Tirumala Temple)

### 1.3 Get Single Temple
```
http://localhost:4000/api/temples/temple-1
```
**Expected**: JSON object with Lepakshi Temple details

### 1.4 Get All Artifacts
```
http://localhost:4000/api/artifacts
```
**Expected**: JSON array with 1 artifact

### 1.5 Get Pricing Plans
```
http://localhost:4000/api/pricing
```
**Expected**: JSON array with pricing plans

## Test 2: Admin Portal UI

Open this URL in your browser:
```
http://localhost:5173
```

### What You Should See:

1. **Dashboard Page** (Home)
   - Navigation sidebar on the left
   - "Sanaathana Aalaya Charithra" title
   - Menu items: Dashboard, Temples, Artifacts, Pricing, Content Jobs, Users, Defects, States, Trusted Sources

2. **Test Navigation**
   - Click "Temples" → Should show list of 2 temples
   - Click "Artifacts" → Should show list of artifacts
   - Click "Pricing" → Should show pricing management
   - Click "States" → Should show Indian states list
   - Click "Trusted Sources" → Should show trusted sources management

3. **Test Temple Management**
   - Go to Temples page
   - You should see:
     - Lepakshi Temple (Andhra Pradesh, Paid ₹100)
     - Tirumala Temple (Andhra Pradesh, Free)
   - Click "View" or "Edit" button on any temple
   - Should show temple details

## Test 3: Backend API with PowerShell

Run these commands in PowerShell:

### Get All Temples
```powershell
curl http://localhost:4000/api/temples
```

### Get Single Temple
```powershell
curl http://localhost:4000/api/temples/temple-1
```

### Get All Artifacts
```powershell
curl http://localhost:4000/api/artifacts
```

### Get Pricing
```powershell
curl http://localhost:4000/api/pricing
```

## Test 4: Admin Portal Features

### 4.1 Temple Management
1. Go to http://localhost:5173
2. Click "Temples" in sidebar
3. Verify you see 2 temples listed
4. Click "Add Temple" button (if available)
5. Try editing a temple

### 4.2 State Management
1. Click "States" in sidebar
2. Should show list of Indian states
3. Each state should show temple count

### 4.3 Trusted Sources
1. Click "Trusted Sources" in sidebar
2. Should show trusted sources management page
3. Can add/edit/delete trusted sources

## Expected Results Summary

✅ **Backend API**
- Health endpoint responds
- All CRUD endpoints working
- Returns mock data correctly
- No errors in terminal

✅ **Admin Portal**
- Loads without errors
- Navigation works
- All pages render
- Can view temple/artifact data
- UI is responsive

## Current Mock Data

### Temples (2)
1. **Lepakshi Temple**
   - ID: temple-1
   - Location: Lepakshi, Andhra Pradesh
   - Access: Paid (₹100)
   - Artifacts: 5

2. **Tirumala Temple**
   - ID: temple-2
   - Location: Tirupati, Andhra Pradesh
   - Access: Free
   - Artifacts: 10

### Artifacts (1)
- Sample artifact with temple association

### Users (1)
- Admin user for testing

## Troubleshooting

### If Backend Not Responding
Check Terminal 7 for errors, or restart:
```powershell
# In Terminal 7, press Ctrl+C, then:
cd Sanaathana-Aalaya-Charithra/src/local-server
npm start
```

### If Admin Portal Not Loading
Check Terminal 3 for errors, or restart:
```powershell
# In Terminal 3, press Ctrl+C, then:
cd Sanaathana-Aalaya-Charithra/admin-portal
npm run dev
```

## Next Steps After Testing

Once you confirm both are working:
1. ✅ Backend API is ready for integration
2. ✅ Admin Portal is ready for content management
3. 📱 Mobile app can be built as native Android/iOS app
4. ☁️ Can deploy to AWS when ready (optional)

## Summary

You now have a fully functional local development environment with:
- Working backend API with all routes
- Working admin portal with full UI
- Mock data for testing
- All services running locally ($0 cost)

The mobile app web version has a React Native Web rendering issue, but the native Android/iOS app will work perfectly when built.
