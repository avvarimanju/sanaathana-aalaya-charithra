# Universal Links Setup Status

**Date**: March 9, 2026  
**Domain**: https://charithra.org ✅

---

## Android App Links - COMPLETE ✅

### Status: LIVE and Ready to Test

**Verification File**: https://charithra.org/.well-known/assetlinks.json  
**Package Name**: `com.charithra.app`  
**SHA256 Fingerprint**: `78:4B:87:27:0B:77:7D:10:D8:5F:21:DD:16:81:88:FE:09:9C:C0:29:50:09:7E:BE:82:4A:A9:30:3C:BA:48:CC`

### What's Working
✅ Domain purchased and active  
✅ Cloudflare Pages deployed  
✅ Android keystore generated  
✅ SHA256 fingerprint extracted  
✅ assetlinks.json updated and deployed  
✅ File accessible at https://charithra.org/.well-known/assetlinks.json

### Next Steps for Android
1. **Validate with Google's Tool**:
   - Go to: https://developers.google.com/digital-asset-links/tools/generator
   - Enter domain: `charithra.org`
   - Enter package: `com.charithra.app`
   - Enter SHA256: `78:4B:87:27:0B:77:7D:10:D8:5F:21:DD:16:81:88:FE:09:9C:C0:29:50:09:7E:BE:82:4A:A9:30:3C:BA:48:CC`
   - Click "Test Statement"
   - Should show: ✅ "Statement list matches"

2. **Configure Mobile App**:
   Update `mobile-app/app.json` to handle Android App Links:
   ```json
   {
     "expo": {
       "android": {
         "package": "com.charithra.app",
         "intentFilters": [
           {
             "action": "VIEW",
             "autoVerify": true,
             "data": [
               {
                 "scheme": "https",
                 "host": "charithra.org",
                 "pathPrefix": "/artifact"
               },
               {
                 "scheme": "https",
                 "host": "charithra.org",
                 "pathPrefix": "/temple"
               }
             ],
             "category": ["BROWSABLE", "DEFAULT"]
           }
         ]
       }
     }
   }
   ```

3. **Build and Test**:
   - Build your Android app with the keystore
   - Install on device
   - Test deep links by clicking: https://charithra.org/temple/123
   - Should open directly in your app!

---

## iOS Universal Links - PENDING ⏳

### Status: Waiting for Apple Developer Approval

**Verification File**: https://charithra.org/.well-known/apple-app-site-association  
**Current Status**: Contains placeholder `TEAM_ID`  
**Waiting For**: Apple Developer Program approval (24-48 hours)

### What's Done
✅ Verification file created with placeholder  
✅ File deployed to Cloudflare Pages  
✅ Apple Developer enrollment submitted

### What's Needed
⏳ Apple Developer Program approval  
⏳ Get Team ID from Apple Developer account  
⏳ Update apple-app-site-association with real Team ID  
⏳ Deploy updated file

### Next Steps for iOS (After Approval)
1. **Get Team ID**:
   - Go to: https://developer.apple.com/account/#/membership
   - Sign in with your Apple Developer account
   - Copy your Team ID (10 characters, like `ABC123XYZ`)

2. **Update Verification File**:
   Replace `TEAM_ID` in `landing-page/.well-known/apple-app-site-association`:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "YOUR_TEAM_ID.com.charithra.app",
           "paths": ["/artifact/*", "/temple/*"]
         }
       ]
     }
   }
   ```

3. **Deploy**:
   ```powershell
   git add landing-page/.well-known/apple-app-site-association
   git commit -m "Add Apple Team ID for Universal Links"
   git push origin main
   ```

4. **Validate**:
   - Go to: https://branch.io/resources/aasa-validator/
   - Enter: https://charithra.org/.well-known/apple-app-site-association
   - Should show: ✅ Valid

---

## Important Files

### Keystore (BACKUP THIS!)
```
charithra-release.keystore
```
**Location**: Project root  
**Purpose**: Sign Android app for Play Store  
**Action**: Backup to secure location NOW!

### Keystore Info
```
keystore-info.txt
```
Contains SHA256 fingerprint and keystore details.

### Verification Files
```
landing-page/.well-known/assetlinks.json          (Android - LIVE ✅)
landing-page/.well-known/apple-app-site-association (iOS - Pending ⏳)
```

---

## Testing URLs

### Android App Links (Ready Now!)
- https://charithra.org/temple/tirupati-balaji
- https://charithra.org/artifact/ancient-sculpture-123
- https://charithra.org/.well-known/assetlinks.json (verification)

### iOS Universal Links (After Apple Approval)
- https://charithra.org/temple/tirupati-balaji
- https://charithra.org/artifact/ancient-sculpture-123
- https://charithra.org/.well-known/apple-app-site-association (verification)

---

## Summary

**Android**: Complete and ready to test! ✅  
**iOS**: Waiting for Apple approval (24-48 hours) ⏳  
**Domain**: Live at https://charithra.org ✅  
**Hosting**: Cloudflare Pages with auto-deployment ✅

**What You Can Do Now**:
1. Validate Android App Links with Google's tool
2. Configure your mobile app for Android deep linking
3. Build and test Android app
4. Wait for Apple Developer approval
5. Backup your keystore file!

**Estimated Time to Full Completion**: 24-48 hours (waiting for Apple)

