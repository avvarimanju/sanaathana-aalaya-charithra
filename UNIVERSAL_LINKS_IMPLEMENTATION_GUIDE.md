# Universal Links Implementation Guide
## Complete Setup: Google Domains + AWS Hosting + Universal Links

**Date**: March 8, 2026  
**Domain**: charithra.org  
**Hosting**: AWS (S3 + CloudFront + Route 53)  
**Deep Linking**: Universal Links (iOS) + App Links (Android)  
**Total Cost**: $18/year ($1.50/month)

---

## Overview

This guide will walk you through:
1. ✅ Buying domain from Google Domains ($12/year)
2. ✅ Setting up AWS hosting ($6/year)
3. ✅ Deploying landing page
4. ✅ Configuring Universal Links (iOS + Android)
5. ✅ Testing the complete flow

**Total Time**: 10-12 hours  
**Difficulty**: Medium-High  
**Result**: Seamless deep linking experience

---

## Phase 1: Buy Domain (15 minutes)

### Step 1.1: Purchase Domain from Google Domains

1. **Go to Google Domains**
   ```
   https://domains.google.com
   ```

2. **Search for Domain**
   - Type: `charithra.org`
   - Click "Search"

3. **Add to Cart**
   - Price: $12/year
   - Click "Add to cart"

4. **Complete Purchase**
   - Sign in with Google account
   - Enter payment details
   - Complete purchase

5. **Verify Ownership**
   - Check email for confirmation
   - Domain should be active in 5-10 minutes

**✅ Checkpoint**: Domain purchased and active

---

## Phase 2: Set Up AWS Infrastructure (45 minutes)

### Step 2.1: Create S3 Bucket (10 minutes)

1. **Open AWS Console**
   ```
   https://console.aws.amazon.com/s3
   ```

2. **Create Bucket**
   ```
   Click "Create bucket"
   
   Bucket name: charithra-landing
   Region: ap-south-1 (Mumbai)
   
   ✅ Block all public access: UNCHECK
   ⚠️ Warning: Acknowledge public access
   
   Click "Create bucket"
   ```

3. **Enable Static Website Hosting**
   ```
   Select bucket → Properties tab
   Scroll to "Static website hosting"
   Click "Edit"
   
   ✅ Enable
   Index document: index.html
   Error document: index.html
   
   Click "Save changes"
   ```

4. **Set Bucket Policy**
   ```
   Select bucket → Permissions tab
   Scroll to "Bucket policy"
   Click "Edit"
   
   Paste this policy:
   ```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::charithra-landing/*"
    }
  ]
}
```

   ```
   Click "Save changes"
   ```

**✅ Checkpoint**: S3 bucket created and configured

---

### Step 2.2: Request SSL Certificate (10 minutes)

1. **Open AWS Certificate Manager**
   ```
   https://console.aws.amazon.com/acm/home?region=us-east-1
   ```
   
   ⚠️ **IMPORTANT**: Must be in us-east-1 region for CloudFront!

2. **Request Certificate**
   ```
   Click "Request certificate"
   
   ✅ Request a public certificate
   Click "Next"
   
   Domain names:
   - charithra.org
   - *.charithra.org (wildcard)
   
   Validation method: DNS validation
   
   Click "Request"
   ```

3. **Get DNS Records**
   ```
   Click on certificate ID
   
   You'll see CNAME records like:
   Name: _abc123.charithra.org
   Value: _xyz789.acm-validations.aws.
   
   ⚠️ Keep this page open - you'll need these values!
   ```

**✅ Checkpoint**: SSL certificate requested (pending validation)

---

### Step 2.3: Configure DNS in Google Domains (10 minutes)

1. **Open Google Domains**
   ```
   https://domains.google.com/registrar
   ```

2. **Select Your Domain**
   ```
   Click on: charithra.org
   Click "DNS" in left menu
   ```

3. **Add ACM Validation Records**
   ```
   Scroll to "Custom records"
   Click "Manage custom records"
   
   Add CNAME record from ACM:
   Host name: _abc123 (remove domain part)
   Type: CNAME
   TTL: 3600
   Data: _xyz789.acm-validations.aws.
   
   Click "Save"
   ```

4. **Wait for Validation**
   ```
   Go back to ACM console
   Refresh page every 2-3 minutes
   
   Status should change to "Issued" (5-30 minutes)
   ```

**✅ Checkpoint**: SSL certificate validated and issued

---

### Step 2.4: Create CloudFront Distribution (15 minutes)

1. **Open CloudFront Console**
   ```
   https://console.aws.amazon.com/cloudfront
   ```

2. **Create Distribution**
   ```
   Click "Create distribution"
   
   Origin domain: charithra-landing.s3.ap-south-1.amazonaws.com
   Origin path: (leave empty)
   Name: landing-page-origin
   
   Origin access: Public
   
   Viewer protocol policy: Redirect HTTP to HTTPS
   Allowed HTTP methods: GET, HEAD
   
   Cache policy: CachingOptimized
   
   Alternate domain names (CNAMEs):
   - charithra.org
   - www.charithra.org
   
   Custom SSL certificate: Select your certificate
   
   Default root object: index.html
   
   Click "Create distribution"
   ```

3. **Note Distribution Domain**
   ```
   Copy the CloudFront domain name:
   Example: d1234abcd.cloudfront.net
   
   ⚠️ Save this - you'll need it for DNS!
   ```

4. **Wait for Deployment**
   ```
   Status will show "Deploying" (5-15 minutes)
   Wait until status shows "Enabled"
   ```

**✅ Checkpoint**: CloudFront distribution created

---

### Step 2.5: Configure Route 53 (10 minutes)

1. **Open Route 53 Console**
   ```
   https://console.aws.amazon.com/route53
   ```

2. **Create Hosted Zone**
   ```
   Click "Create hosted zone"
   
   Domain name: charithra.org
   Type: Public hosted zone
   
   Click "Create hosted zone"
   ```

3. **Note Name Servers**
   ```
   You'll see 4 NS records like:
   - ns-123.awsdns-12.com
   - ns-456.awsdns-34.net
   - ns-789.awsdns-56.org
   - ns-012.awsdns-78.co.uk
   
   ⚠️ Copy all 4 - you'll need them for Google Domains!
   ```

4. **Create A Record for Root Domain**
   ```
   Click "Create record"
   
   Record name: (leave empty for root)
   Record type: A
   Alias: YES
   Route traffic to: Alias to CloudFront distribution
   Choose distribution: Select your CloudFront distribution
   
   Click "Create records"
   ```

5. **Create A Record for www**
   ```
   Click "Create record"
   
   Record name: www
   Record type: A
   Alias: YES
   Route traffic to: Alias to CloudFront distribution
   Choose distribution: Select your CloudFront distribution
   
   Click "Create records"
   ```

**✅ Checkpoint**: Route 53 configured

---

### Step 2.6: Update Google Domains Name Servers (5 minutes)

1. **Open Google Domains**
   ```
   https://domains.google.com/registrar
   Click on: charithra.org
   ```

2. **Change Name Servers**
   ```
   Click "DNS" in left menu
   Scroll to "Name servers"
   Click "Use custom name servers"
   
   Add all 4 AWS name servers:
   - ns-123.awsdns-12.com
   - ns-456.awsdns-34.net
   - ns-789.awsdns-56.org
   - ns-012.awsdns-78.co.uk
   
   Click "Save"
   ```

3. **Wait for Propagation**
   ```
   DNS propagation takes 5 minutes to 48 hours
   Usually works in 15-30 minutes
   
   Test with:
   nslookup charithra.org
   ```

**✅ Checkpoint**: DNS configured and propagating

---

## Phase 3: Deploy Landing Page (30 minutes)

### Step 3.1: Prepare Landing Page Files

1. **Navigate to Landing Page Directory**
   ```powershell
   cd Sanaathana-Aalaya-Charithra/landing-page
   ```

2. **Update API Endpoint in script.js**
   
   Open `script.js` and update:
   ```javascript
   // Replace with your actual API endpoint
   const API_ENDPOINT = 'https://api.charithra.org';
   ```

3. **Test Locally**
   ```powershell
   # Open in browser
   start index.html
   ```

**✅ Checkpoint**: Landing page ready for deployment

---

### Step 3.2: Upload to S3

1. **Upload Files via AWS Console**
   ```
   Open S3 console
   Select bucket: charithra-landing
   Click "Upload"
   
   Add files:
   - index.html
   - styles.css
   - script.js
   
   Click "Upload"
   ```

2. **Or Upload via AWS CLI** (faster)
   ```powershell
   # Install AWS CLI if not installed
   # https://aws.amazon.com/cli/
   
   # Configure AWS CLI
   aws configure
   
   # Upload files
   aws s3 sync . s3://charithra-landing/ `
     --exclude ".git/*" `
     --exclude "*.md" `
     --cache-control "max-age=3600"
   ```

**✅ Checkpoint**: Landing page deployed to S3

---

### Step 3.3: Test Landing Page

1. **Test CloudFront URL**
   ```
   https://d1234abcd.cloudfront.net
   ```
   
   Should show your landing page ✅

2. **Test Custom Domain** (after DNS propagates)
   ```
   https://charithra.org
   https://www.charithra.org
   ```
   
   Both should show your landing page ✅

3. **Test HTTPS**
   ```
   http://charithra.org
   ```
   
   Should redirect to HTTPS ✅

**✅ Checkpoint**: Landing page accessible via custom domain

---

## Phase 4: Create Universal Links Files (1 hour)

### Step 4.1: Create Apple App Site Association (AASA) File

1. **Create File**: `landing-page/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.templeheritage",
        "paths": [
          "/artifact/*",
          "/temple/*"
        ]
      }
    ]
  }
}
```

2. **Replace TEAM_ID**
   ```
   Find your Apple Team ID:
   1. Go to https://developer.apple.com/account
   2. Click "Membership"
   3. Copy "Team ID" (10 characters)
   
   Example: ABC1234DEF
   ```

3. **Replace Bundle ID**
   ```
   Use your app's bundle identifier
   Example: com.yourcompany.templeheritage
   ```

**✅ Checkpoint**: AASA file created

---

### Step 4.2: Create Android Asset Links File

1. **Create File**: `landing-page/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.templeheritage",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

2. **Get SHA256 Fingerprint**
   ```powershell
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore `
     -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore
   keytool -list -v -keystore path/to/your/release.keystore `
     -alias your-key-alias
   
   # Copy the SHA256 fingerprint (with colons)
   # Example: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56
   ```

3. **Replace Values**
   ```
   package_name: Your Android package name
   sha256_cert_fingerprints: Your SHA256 fingerprint
   ```

**✅ Checkpoint**: Asset links file created

---

### Step 4.3: Upload Verification Files to S3

1. **Create .well-known Directory Structure**
   ```powershell
   cd landing-page
   mkdir -p .well-known
   ```

2. **Upload to S3**
   ```powershell
   # Upload AASA file (NO .json extension!)
   aws s3 cp .well-known/apple-app-site-association `
     s3://charithra-landing/.well-known/apple-app-site-association `
     --content-type "application/json" `
     --cache-control "max-age=3600"
   
   # Upload assetlinks.json
   aws s3 cp .well-known/assetlinks.json `
     s3://charithra-landing/.well-known/assetlinks.json `
     --content-type "application/json" `
     --cache-control "max-age=3600"
   ```

3. **Verify Files Are Accessible**
   ```
   https://charithra.org/.well-known/apple-app-site-association
   https://charithra.org/.well-known/assetlinks.json
   ```
   
   Both should return JSON (not 404) ✅

**✅ Checkpoint**: Verification files deployed and accessible

---

## Phase 5: Configure Mobile App (4-6 hours)

### Step 5.1: Configure iOS App (2-3 hours)

1. **Open Xcode Project**
   ```
   Open your React Native iOS project in Xcode
   ```

2. **Add Associated Domains Capability**
   ```
   1. Select your project in Xcode
   2. Select your target
   3. Click "Signing & Capabilities" tab
   4. Click "+ Capability"
   5. Add "Associated Domains"
   ```

3. **Add Domain**
   ```
   In Associated Domains, add:
   applinks:charithra.org
   applinks:www.charithra.org
   ```

4. **Update app.json** (React Native)
   ```json
   {
     "expo": {
       "ios": {
         "associatedDomains": [
           "applinks:charithra.org",
           "applinks:www.charithra.org"
         ]
       }
     }
   }
   ```

5. **Handle Deep Links in App**
   
   Create: `mobile-app/src/utils/deepLinking.ts`


```typescript
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export const useDeepLinking = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle initial URL (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    
    // Parse URL
    const { hostname, path, queryParams } = Linking.parse(url);
    
    // Handle different paths
    if (path?.startsWith('artifact/')) {
      const artifactId = path.replace('artifact/', '');
      navigation.navigate('ArtifactDetail', { artifactId });
    } else if (path?.startsWith('temple/')) {
      const templeId = path.replace('temple/', '');
      navigation.navigate('TempleDetail', { templeId });
    }
  };
};
```

6. **Use in App.tsx**
   ```typescript
   import { useDeepLinking } from './src/utils/deepLinking';
   
   function App() {
     useDeepLinking(); // Add this hook
     
     return (
       // Your app content
     );
   }
   ```

**✅ Checkpoint**: iOS Universal Links configured

---

### Step 5.2: Configure Android App (2-3 hours)

1. **Update AndroidManifest.xml**
   
   File: `mobile-app/android/app/src/main/AndroidManifest.xml`
   
   Add inside `<activity>` tag:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  
  <data
    android:scheme="https"
    android:host="charithra.org"
    android:pathPrefix="/artifact" />
  
  <data
    android:scheme="https"
    android:host="charithra.org"
    android:pathPrefix="/temple" />
</intent-filter>
```

2. **Update app.json** (React Native/Expo)
   ```json
   {
     "expo": {
       "android": {
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

3. **Deep Linking Handler** (same as iOS)
   
   The `useDeepLinking` hook works for both iOS and Android!

**✅ Checkpoint**: Android App Links configured

---

## Phase 6: Update QR Code Generation (30 minutes)

### Step 6.1: Update QR Code Generator

1. **Find QR Code Generation Code**
   
   Search for where QR codes are generated in your backend

2. **Update to Use URLs Instead of Plain Text**
   
   **Before**:
   ```typescript
   const qrData = `TEMPLE_001_ARTIFACT_005`;
   ```
   
   **After**:
   ```typescript
   const qrData = `https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005`;
   ```

3. **Example Function**:

```typescript
export function generateArtifactQRCode(templeId: string, artifactId: string): string {
  const baseUrl = 'https://charithra.org';
  const artifactUrl = `${baseUrl}/artifact/${templeId}_${artifactId}`;
  
  // Generate QR code with URL
  return artifactUrl;
}

// Usage
const qrData = generateArtifactQRCode('TEMPLE_001', 'ARTIFACT_005');
// Result: https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005
```

**✅ Checkpoint**: QR codes now generate URLs

---

## Phase 7: Testing (2 hours)

### Step 7.1: Test Apple Universal Links

1. **Validate AASA File**
   ```
   Go to: https://branch.io/resources/aasa-validator/
   
   Enter: https://charithra.org/apple-app-site-association
   
   Should show: ✅ Valid
   ```

2. **Test on iOS Device**
   ```
   1. Install app on iPhone
   2. Open Notes app
   3. Type: https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005
   4. Tap the link
   5. Should show banner: "Open in [Your App]"
   6. Tap "Open"
   7. App should open to artifact detail screen
   ```

3. **Test QR Code**
   ```
   1. Generate QR code with URL
   2. Print or display on screen
   3. Open Camera app on iPhone
   4. Scan QR code
   5. Tap notification
   6. Should open app directly (if installed)
   7. Or open landing page (if not installed)
   ```

**✅ Checkpoint**: iOS Universal Links working

---

### Step 7.2: Test Android App Links

1. **Validate Asset Links**
   ```
   Go to: https://developers.google.com/digital-asset-links/tools/generator
   
   Enter your domain and package name
   Should show: ✅ Valid
   ```

2. **Test on Android Device**
   ```
   1. Install app on Android phone
   2. Open Chrome browser
   3. Type: https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005
   4. Press Enter
   5. Should show dialog: "Open with [Your App]"
   6. Tap "Open"
   7. App should open to artifact detail screen
   ```

3. **Test QR Code**
   ```
   1. Generate QR code with URL
   2. Open Camera or QR scanner app
   3. Scan QR code
   4. Should open app directly (if installed)
   5. Or open landing page (if not installed)
   ```

**✅ Checkpoint**: Android App Links working

---

### Step 7.3: Test Complete User Flow

**Scenario A: User WITHOUT App**

```
1. User scans QR code
   ↓
2. Phone shows URL with "Open" button
   ↓
3. User taps "Open"
   ↓
4. Browser opens landing page
   ↓
5. Landing page shows:
   - Artifact preview
   - "Download App" button
   - "View in Browser" option
   ↓
6. User downloads app
   ↓
7. User opens app
   ↓
8. App shows artifact detail
```

**Scenario B: User WITH App**

```
1. User scans QR code
   ↓
2. Phone shows "Open in [App]" banner
   ↓
3. User taps "Open"
   ↓
4. App opens directly to artifact detail
   ↓
5. User sees content immediately (2-3 seconds)
```

**✅ Checkpoint**: Complete flow working for both scenarios

---

## Phase 8: Troubleshooting

### Common Issues

#### Issue 1: AASA File Not Found (404)

**Symptoms**: iOS doesn't recognize Universal Links

**Solutions**:
```powershell
# Check file exists
curl https://charithra.org/.well-known/apple-app-site-association

# Verify content-type
curl -I https://charithra.org/.well-known/apple-app-site-association

# Should show: Content-Type: application/json

# Re-upload with correct content-type
aws s3 cp .well-known/apple-app-site-association `
  s3://charithra-landing/.well-known/apple-app-site-association `
  --content-type "application/json"
```

---

#### Issue 2: Android App Links Not Working

**Symptoms**: Android opens browser instead of app

**Solutions**:
```powershell
# Verify assetlinks.json
curl https://charithra.org/.well-known/assetlinks.json

# Check SHA256 fingerprint matches
keytool -list -v -keystore your-release.keystore

# Verify intent filter in AndroidManifest.xml
# Must have android:autoVerify="true"

# Clear app data and reinstall
adb shell pm clear com.yourcompany.templeheritage
adb install -r app-release.apk
```

---

#### Issue 3: CloudFront Shows 403 Forbidden

**Symptoms**: Can't access landing page

**Solutions**:
```powershell
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket charithra-landing

# Verify files are public
aws s3 ls s3://charithra-landing/ --recursive

# Re-upload with public-read ACL
aws s3 sync . s3://charithra-landing/ --acl public-read
```

---

#### Issue 4: DNS Not Resolving

**Symptoms**: Domain doesn't load

**Solutions**:
```powershell
# Check DNS propagation
nslookup charithra.org

# Check name servers
dig NS charithra.org

# Verify Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID

# Wait 24-48 hours for full propagation
```

---

#### Issue 5: SSL Certificate Not Working

**Symptoms**: HTTPS shows certificate error

**Solutions**:
```
1. Verify certificate is in us-east-1 region
2. Check certificate status is "Issued"
3. Verify CloudFront is using correct certificate
4. Wait 15-30 minutes for CloudFront to update
5. Clear browser cache
```

---

## Phase 9: Monitoring & Maintenance

### Set Up CloudWatch Alarms

1. **Monitor CloudFront Errors**
   ```
   AWS Console → CloudWatch → Alarms
   Create alarm for:
   - 4xx errors > 10/minute
   - 5xx errors > 5/minute
   ```

2. **Monitor S3 Bucket**
   ```
   Create alarm for:
   - Bucket size > 1 GB
   - Request count > 100,000/day
   ```

### Regular Maintenance Tasks

**Weekly**:
- Check CloudWatch metrics
- Review access logs
- Monitor costs

**Monthly**:
- Update landing page content
- Review QR code analytics
- Check SSL certificate expiry (auto-renews)

**Yearly**:
- Renew domain ($12)
- Review AWS costs
- Update documentation

---

## Cost Summary

### One-Time Costs
```
Development time: 10-12 hours (your time)
Tools/Software: $0
TOTAL: $0
```

### Annual Costs
```
Domain (Google Domains):     $12.00/year
Route 53 Hosted Zone:        $ 6.00/year
S3 Storage:                  $ 0.12/year
S3 Requests:                 $ 0.12/year
CloudFront:                  $ 0.00 (free tier)
SSL Certificate:             $ 0.00 (free)
────────────────────────────────────
TOTAL:                       $18.24/year
                             $1.52/month
```

---

## Success Checklist

### Domain & Hosting
- ✅ Domain purchased from Google Domains
- ✅ SSL certificate issued and validated
- ✅ S3 bucket created and configured
- ✅ CloudFront distribution deployed
- ✅ Route 53 DNS configured
- ✅ Landing page accessible via HTTPS

### Universal Links
- ✅ AASA file created and deployed
- ✅ Asset links file created and deployed
- ✅ iOS Associated Domains configured
- ✅ Android Intent Filters configured
- ✅ Deep linking handler implemented

### Testing
- ✅ iOS Universal Links working
- ✅ Android App Links working
- ✅ QR codes generate URLs
- ✅ Landing page loads correctly
- ✅ App opens from links

### Documentation
- ✅ Implementation guide complete
- ✅ Troubleshooting documented
- ✅ Maintenance plan created

---

## Next Steps

1. **Buy Domain** (15 minutes)
   - Go to Google Domains
   - Purchase charithra.org

2. **Set Up AWS** (45 minutes)
   - Create S3 bucket
   - Request SSL certificate
   - Configure CloudFront
   - Set up Route 53

3. **Deploy Landing Page** (30 minutes)
   - Upload files to S3
   - Test accessibility

4. **Configure Universal Links** (4-6 hours)
   - Create verification files
   - Update mobile app
   - Test on devices

5. **Update QR Codes** (30 minutes)
   - Modify generation code
   - Test new QR codes

**Total Time**: 10-12 hours  
**Total Cost**: $18/year

---

## Support & Resources

### Documentation
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [Google Domains](https://support.google.com/domains/)

### Testing Tools
- [AASA Validator](https://branch.io/resources/aasa-validator/)
- [Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)
- [DNS Checker](https://dnschecker.org/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

### AWS CLI Commands
```powershell
# Upload to S3
aws s3 sync ./landing-page s3://charithra-landing/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID
```

---

**Status**: Implementation Guide Complete  
**Ready to Start**: Yes  
**Estimated Completion**: 1-2 days  
**Difficulty**: Medium-High  
**Result**: Professional Universal Links setup with AWS hosting

---

**Questions?** Refer to troubleshooting section or AWS documentation.

**Ready to begin?** Start with Phase 1: Buy Domain!
