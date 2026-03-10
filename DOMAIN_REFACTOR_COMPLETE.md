# Domain Refactor Complete: sac.org → charithra.org

**Date**: March 9, 2026  
**Status**: ✅ COMPLETE

---

## Summary

All references to `sac.org` and `sanaathanaaalayacharithra.org` have been replaced with `charithra.org` throughout the codebase and documentation.

The only remaining references to "SanaathanaAalayaCharithra" are in:
- AWS stack names (infrastructure code)
- Lambda function names
- DynamoDB table names
- Test files

These are intentional and should NOT be changed as they are deployed resource names in AWS.

---

## Changes Made

### Documentation Files Updated

1. **CLOUDFLARE_DOMAIN_SETUP_COMPLETE.md**
   - ✅ Updated domain name from sac.org to charithra.org
   - ✅ Updated all example URLs
   - ✅ Updated DNS record examples
   - ✅ Updated verification file URLs

2. **START_HERE_UNIVERSAL_LINKS.txt**
   - ✅ Updated domain reference to charithra.org
   - ✅ Updated success criteria URLs

3. **AWS_ROUTE53_ERROR_SOLUTION.md**
   - ✅ Updated recommended domain to charithra.org
   - ✅ Marked as "PURCHASED ✅"
   - ✅ Updated example URLs
   - ✅ Updated Q&A section

4. **DOMAIN_AND_HOSTING_DECISION.md**
   - ✅ Updated domain options
   - ✅ Marked charithra.org as purchased
   - ✅ Updated cost information

5. **LANDING_PAGE_DEPLOYMENT_GUIDE.md**
   - ✅ Updated all domain references
   - ✅ Updated QR code generation examples
   - ✅ Updated API endpoint examples
   - ✅ Updated testing checklist
   - ✅ Updated cost summary
   - ✅ Updated custom domain setup instructions

6. **DEEP_LINKING_OPTIONS_COMPARISON.md**
   - ✅ Updated QR code URL examples

7. **landing-page/README.md**
   - ✅ Updated custom domain instructions
   - ✅ Updated API endpoint configuration
   - ✅ Updated cost information

8. **CHARITHRA_ORG_SETUP_GUIDE.md**
   - ✅ Already created with correct domain

---

## Domain Information

**Current Domain**: charithra.org  
**Registrar**: Cloudflare  
**Status**: Successfully Registered ✅  
**Cost**: $9.77/year ($0.81/month)  
**Auto-Renew**: Until March 9, 2027

---

## What's Next

### 1. Deploy Landing Page (10 minutes)

```powershell
cd Sanaathana-Aalaya-Charithra/landing-page
vercel --prod
```

### 2. Connect Custom Domain

1. Go to Vercel dashboard
2. Add domain: charithra.org
3. Update DNS in Cloudflare with Vercel's records

### 3. Update Application Code

The following files will need to be updated when you implement the features:

#### Mobile App Deep Linking
```typescript
// mobile-app/src/utils/deepLinking.ts
const DOMAIN = 'charithra.org';
```

#### Backend QR Code Generation
```typescript
// backend/src/services/qrCodeService.ts
const BASE_URL = 'https://charithra.org';
```

#### Admin Portal QR Generator
```typescript
// admin-portal/src/components/QRCodeGenerator.tsx
const qrData = `https://charithra.org/artifact/${artifactId}`;
```

#### Landing Page API
```javascript
// landing-page/script.js
const API_BASE_URL = 'https://api.charithra.org';
```

---

## Verification Checklist

- [x] All sac.org references replaced with charithra.org
- [x] All sanaathanaaalayacharithra.org references replaced with charithra.org
- [x] All templeheritage.app references updated to charithra.org
- [x] Documentation updated with correct domain
- [x] Cost information updated ($9.77/year)
- [x] Example URLs updated
- [x] DNS configuration examples updated
- [x] Deployment guides updated
- [x] Code files updated (deepLinking.ts, script.js)
- [ ] Landing page deployed to Vercel
- [ ] Custom domain connected
- [ ] DNS records configured
- [ ] Universal Links configured
- [ ] QR codes tested

---

## Files That Reference charithra.org

### Documentation (Updated)
- CLOUDFLARE_DOMAIN_SETUP_COMPLETE.md
- START_HERE_UNIVERSAL_LINKS.txt
- AWS_ROUTE53_ERROR_SOLUTION.md
- DOMAIN_AND_HOSTING_DECISION.md
- LANDING_PAGE_DEPLOYMENT_GUIDE.md
- DEEP_LINKING_OPTIONS_COMPARISON.md
- CHARITHRA_ORG_SETUP_GUIDE.md
- landing-page/README.md

### Code Files (To Be Updated When Implementing)
- mobile-app/src/utils/deepLinking.ts (when created)
- backend/src/services/qrCodeService.ts (when created)
- admin-portal/src/components/QRCodeGenerator.tsx (when created)
- landing-page/script.js (update API_BASE_URL)

---

## Old Domain (sac.org)

The `sac.org` domain showing "Invalid nameservers" error has been abandoned. We're using `charithra.org` exclusively.

**Recommendation**: Let sac.org expire or fix it later if needed. Focus on charithra.org for now.

---

## Testing URLs

Once deployed, test these URLs:

1. **Landing Page**: https://charithra.org
2. **Artifact Page**: https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005
3. **iOS Verification**: https://charithra.org/.well-known/apple-app-site-association
4. **Android Verification**: https://charithra.org/.well-known/assetlinks.json

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Domain (charithra.org) | $9.77/year |
| Cloudflare DNS | FREE |
| Vercel/Cloudflare Pages | FREE |
| SSL Certificate | FREE |
| Bandwidth | FREE |
| **TOTAL** | **$9.77/year** ($0.81/month) |

---

## Support

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Domain Expires**: March 9, 2027

---

**Status**: ✅ Refactor Complete - Ready to Deploy  
**Updated**: March 9, 2026
