# Universal Links Quick Start Checklist
## Fast Track Implementation Guide

**Goal**: Get Universal Links working in 1-2 days  
**Cost**: $18/year  
**Difficulty**: Medium

---

## Pre-Flight Checklist

Before you start, make sure you have:

- [ ] AWS Account (with billing enabled)
- [ ] Google Account (for Google Domains)
- [ ] Credit/Debit card for domain purchase
- [ ] AWS CLI installed
- [ ] Node.js installed
- [ ] Mobile app source code access
- [ ] Apple Developer Account (for iOS)
- [ ] Google Play Console access (for Android)

---

## Day 1: Infrastructure Setup (4-5 hours)

### Morning Session (2-3 hours)

**9:00 AM - Buy Domain (15 min)**
- [ ] Go to domains.google.com
- [ ] Search: charithra.org
- [ ] Purchase for $12/year
- [ ] Verify email confirmation

**9:15 AM - Create S3 Bucket (15 min)**
- [ ] Open AWS S3 Console
- [ ] Create bucket: charithra-landing
- [ ] Region: ap-south-1
- [ ] Disable "Block all public access"
- [ ] Enable static website hosting
- [ ] Add bucket policy (see guide)

**9:30 AM - Request SSL Certificate (15 min)**
- [ ] Open AWS Certificate Manager (us-east-1 region!)
- [ ] Request public certificate
- [ ] Add domains: charithra.org, *.charithra.org
- [ ] Choose DNS validation
- [ ] Copy CNAME records

**9:45 AM - Configure DNS Validation (15 min)**
- [ ] Open Google Domains
- [ ] Go to DNS settings
- [ ] Add CNAME records from ACM
- [ ] Save changes
- [ ] Wait for validation (check every 5 min)

**10:00 AM - Coffee Break ☕ (15 min)**

**10:15 AM - Create CloudFront Distribution (30 min)**
- [ ] Open CloudFront Console
- [ ] Create distribution
- [ ] Origin: S3 bucket
- [ ] Add CNAMEs: charithra.org, www.charithra.org
- [ ] Select SSL certificate
- [ ] Default root object: index.html
- [ ] Wait for deployment (15 min)

**10:45 AM - Set Up Route 53 (30 min)**
- [ ] Create hosted zone
- [ ] Note 4 name servers
- [ ] Create A record (alias to CloudFront)
- [ ] Create www A record (alias to CloudFront)

**11:15 AM - Update Google Domains Name Servers (15 min)**
- [ ] Go to Google Domains DNS settings
- [ ] Switch to custom name servers
- [ ] Add all 4 AWS name servers
- [ ] Save and wait for propagation

**11:30 AM - Lunch Break 🍽️**

---

### Afternoon Session (2 hours)

**1:00 PM - Deploy Landing Page (30 min)**
- [ ] Navigate to landing-page directory
- [ ] Update API endpoint in script.js
- [ ] Test locally (open index.html)
- [ ] Upload to S3 via console or CLI
- [ ] Test CloudFront URL

**1:30 PM - Create Verification Files (1 hour)**
- [ ] Create .well-known directory
- [ ] Create apple-app-site-association file
  - [ ] Get Apple Team ID
  - [ ] Add bundle identifier
  - [ ] Add paths: /artifact/*, /temple/*
- [ ] Create assetlinks.json file
  - [ ] Get SHA256 fingerprint
  - [ ] Add package name
  - [ ] Add fingerprint
- [ ] Upload both files to S3
- [ ] Verify files are accessible

**2:30 PM - Test Infrastructure (30 min)**
- [ ] Test: https://charithra.org
- [ ] Test: https://www.charithra.org
- [ ] Test: https://charithra.org/.well-known/apple-app-site-association
- [ ] Test: https://charithra.org/.well-known/assetlinks.json
- [ ] Validate AASA file: branch.io/resources/aasa-validator/
- [ ] Validate asset links: developers.google.com/digital-asset-links/tools/generator

**3:00 PM - Day 1 Complete! ✅**

---

## Day 2: Mobile App Configuration (6-7 hours)

### Morning Session (3-4 hours)

**9:00 AM - Configure iOS App (2-3 hours)**
- [ ] Open Xcode project
- [ ] Add Associated Domains capability
- [ ] Add domains:
  - [ ] applinks:charithra.org
  - [ ] applinks:www.charithra.org
- [ ] Update app.json (if using Expo)
- [ ] Create deepLinking.ts utility
- [ ] Add useDeepLinking hook to App.tsx
- [ ] Build and install on iPhone
- [ ] Test Universal Links

**11:00 AM - Coffee Break ☕ (15 min)**

**11:15 AM - Configure Android App (1-2 hours)**
- [ ] Update AndroidManifest.xml
- [ ] Add intent filters with autoVerify="true"
- [ ] Add paths: /artifact, /temple
- [ ] Update app.json (if using Expo)
- [ ] Build and install on Android phone
- [ ] Test App Links

**12:15 PM - Lunch Break 🍽️**

---

### Afternoon Session (3 hours)

**1:00 PM - Update QR Code Generation (30 min)**
- [ ] Find QR code generation code
- [ ] Update to use URLs instead of plain text
- [ ] Test QR code generation
- [ ] Generate sample QR codes

**1:30 PM - Testing (2 hours)**

**iOS Testing (1 hour)**
- [ ] Install app on iPhone
- [ ] Test link in Notes app
- [ ] Test link in Messages app
- [ ] Test link in Safari
- [ ] Test QR code with Camera app
- [ ] Test without app installed
- [ ] Test with app installed

**Android Testing (1 hour)**
- [ ] Install app on Android phone
- [ ] Test link in Chrome browser
- [ ] Test link in Messages app
- [ ] Test QR code with Camera app
- [ ] Test without app installed
- [ ] Test with app installed

**3:30 PM - Documentation (30 min)**
- [ ] Document any issues encountered
- [ ] Update team on implementation
- [ ] Create user guide for QR codes
- [ ] Schedule follow-up testing

**4:00 PM - Day 2 Complete! ✅**

---

## Quick Commands Reference

### AWS CLI Commands

```powershell
# Configure AWS CLI
aws configure

# Upload landing page
cd landing-page
aws s3 sync . s3://charithra-landing/ `
  --exclude ".git/*" --exclude "*.md"

# Upload verification files
aws s3 cp .well-known/apple-app-site-association `
  s3://charithra-landing/.well-known/apple-app-site-association `
  --content-type "application/json"

aws s3 cp .well-known/assetlinks.json `
  s3://charithra-landing/.well-known/assetlinks.json `
  --content-type "application/json"

# Invalidate CloudFront cache
aws cloudfront create-invalidation `
  --distribution-id YOUR_DIST_ID `
  --paths "/*"
```

### Testing Commands

```powershell
# Test DNS
nslookup charithra.org

# Test HTTPS
curl -I https://charithra.org

# Test AASA file
curl https://charithra.org/.well-known/apple-app-site-association

# Test asset links
curl https://charithra.org/.well-known/assetlinks.json

# Get Android SHA256 fingerprint
keytool -list -v -keystore ~/.android/debug.keystore `
  -alias androiddebugkey -storepass android -keypass android
```

---

## Troubleshooting Quick Fixes

### Issue: AASA file returns 404
```powershell
# Re-upload with correct content-type
aws s3 cp .well-known/apple-app-site-association `
  s3://charithra-landing/.well-known/apple-app-site-association `
  --content-type "application/json" --cache-control "max-age=3600"
```

### Issue: CloudFront shows old content
```powershell
# Invalidate cache
aws cloudfront create-invalidation `
  --distribution-id YOUR_DIST_ID `
  --paths "/*"
```

### Issue: DNS not resolving
```powershell
# Check propagation
nslookup charithra.org

# Wait 24-48 hours for full propagation
# Use CloudFront URL in meantime
```

### Issue: Android App Links not working
```powershell
# Clear app data
adb shell pm clear com.yourcompany.templeheritage

# Reinstall app
adb install -r app-release.apk

# Verify intent filter
adb shell dumpsys package d
```

---

## Success Criteria

### Infrastructure ✅
- [ ] Domain resolves to CloudFront
- [ ] HTTPS works (no certificate errors)
- [ ] Landing page loads correctly
- [ ] AASA file accessible
- [ ] Asset links file accessible

### iOS ✅
- [ ] Universal Links work in Notes app
- [ ] Universal Links work in Messages app
- [ ] QR codes open app (if installed)
- [ ] QR codes open landing page (if not installed)
- [ ] App navigates to correct screen

### Android ✅
- [ ] App Links work in Chrome
- [ ] App Links work in Messages app
- [ ] QR codes open app (if installed)
- [ ] QR codes open landing page (if not installed)
- [ ] App navigates to correct screen

### User Experience ✅
- [ ] Seamless app opening (no extra taps)
- [ ] Fallback to landing page works
- [ ] Landing page shows correct content
- [ ] Download button works
- [ ] Analytics tracking works (if implemented)

---

## Cost Tracking

### Initial Costs
- Domain registration: $12.00 ✅
- AWS setup: $0.00 (free tier)
- Development time: 10-12 hours

### Monthly Costs
- Route 53: $0.50/month
- S3: $0.01/month
- CloudFront: $0.00 (free tier)
- **Total: $0.51/month**

### Annual Costs
- Domain renewal: $12.00/year
- AWS services: $6.12/year
- **Total: $18.12/year**

---

## Next Steps After Implementation

### Week 1
- [ ] Monitor CloudWatch metrics
- [ ] Check error logs
- [ ] Gather user feedback
- [ ] Fix any issues

### Week 2
- [ ] Analyze QR code scan data
- [ ] Optimize landing page
- [ ] A/B test different content
- [ ] Update documentation

### Month 1
- [ ] Review costs
- [ ] Optimize performance
- [ ] Add analytics
- [ ] Plan improvements

---

## Resources

### Documentation
- Full Implementation Guide: `UNIVERSAL_LINKS_IMPLEMENTATION_GUIDE.md`
- Deep Linking Comparison: `DEEP_LINKING_OPTIONS_COMPARISON.md`
- Domain & Hosting Decision: `DOMAIN_AND_HOSTING_DECISION.md`

### External Links
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [AWS CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)
- [Google Domains](https://domains.google.com)

### Testing Tools
- [AASA Validator](https://branch.io/resources/aasa-validator/)
- [Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)
- [DNS Checker](https://dnschecker.org/)

---

**Ready to start?** Begin with Day 1, Morning Session!

**Questions?** Check the full implementation guide or troubleshooting section.

**Stuck?** Review the quick commands reference above.

Good luck! 🚀
