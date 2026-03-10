# charithra.org Domain Setup Guide

**Domain**: charithra.org  
**Registrar**: Cloudflare  
**Status**: Successfully Registered ✅  
**Auto-Renew**: Until March 9, 2027

---

## Current Status

✅ Domain purchased and registered  
✅ Cloudflare DNS management active  
⏳ Need to deploy landing page  
⏳ Need to configure DNS records

---

## Quick Deployment Options

### Option 1: Deploy to Vercel (Fastest - 10 minutes)

This is the easiest way to get your site live:

```powershell
# Install Vercel CLI
npm install -g vercel

# Navigate to landing page
cd Sanaathana-Aalaya-Charithra/landing-page

# Login and deploy
vercel login
vercel --prod
```

You'll get a URL like: `https://temple-heritage.vercel.app`

Then connect your custom domain:

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click your project
3. Go to Settings → Domains
4. Add domain: `charithra.org`
5. Vercel will show you DNS records to add

### Option 2: Deploy to Cloudflare Pages (Integrated)

Since you're already using Cloudflare:

1. Go to Cloudflare dashboard: https://dash.cloudflare.com
2. Click "Pages" in left menu
3. Click "Create a project"
4. Connect to Git or upload files directly
5. Upload the `landing-page` folder
6. Set custom domain to `charithra.org`

**Advantages**:
- Everything in one place
- Automatic SSL
- Fast global CDN
- FREE forever

---

## DNS Configuration

Once you deploy, you'll need to add DNS records in Cloudflare:

### For Vercel:

1. Login to Cloudflare: https://dash.cloudflare.com
2. Click on `charithra.org`
3. Go to DNS → Records
4. Add these records:

**A Record**:
- Type: A
- Name: @
- IPv4 address: 76.76.21.21
- Proxy status: DNS only (gray cloud)
- TTL: Auto

**CNAME Record**:
- Type: CNAME
- Name: www
- Target: cname.vercel-dns.com
- Proxy status: DNS only (gray cloud)
- TTL: Auto

### For Cloudflare Pages:

DNS is configured automatically when you set the custom domain!

---

## Update Your Application

Once the domain is live, update these files:

### 1. Mobile App Deep Linking

```typescript
// mobile-app/src/utils/deepLinking.ts
const DOMAIN = 'charithra.org';
```

### 2. QR Code Generation

```typescript
// backend/src/services/qrCodeService.ts
const BASE_URL = 'https://charithra.org';
```

### 3. Landing Page API

```javascript
// landing-page/script.js
const API_BASE_URL = 'https://api.charithra.org'; // or your API URL
```

---

## Universal Links Setup

For iOS and Android deep linking, you'll need these files:

### iOS - Apple App Site Association

Create: `landing-page/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.templeheritage.app",
        "paths": ["/artifact/*", "/temple/*"]
      }
    ]
  }
}
```

### Android - Asset Links

Create: `landing-page/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.templeheritage.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

---

## Testing Checklist

After deployment:

- [ ] Visit https://charithra.org (should load landing page)
- [ ] Visit https://www.charithra.org (should redirect to main domain)
- [ ] Check HTTPS works (padlock icon)
- [ ] Test on mobile device
- [ ] Verify https://charithra.org/.well-known/apple-app-site-association
- [ ] Verify https://charithra.org/.well-known/assetlinks.json
- [ ] Test QR code scanning

---

## Cost Summary

| Item | Cost |
|------|------|
| Domain (charithra.org) | $9.77/year |
| Cloudflare DNS | FREE |
| Cloudflare Pages hosting | FREE |
| SSL Certificate | FREE |
| Bandwidth (unlimited) | FREE |
| **TOTAL** | **$9.77/year** ($0.81/month) |

---

## What About sac.org?

The `sac.org` domain showing "Invalid nameservers" error is a separate issue. You have two options:

1. **Fix sac.org**: Update its nameservers to point to Cloudflare
2. **Use charithra.org only**: This is simpler and cleaner

I recommend using `charithra.org` as your primary domain since it's already properly configured with Cloudflare.

---

## Next Steps

1. **Deploy landing page** (choose Vercel or Cloudflare Pages)
2. **Configure DNS** (if using Vercel)
3. **Test the site** (visit charithra.org)
4. **Update mobile app** (use charithra.org for deep links)
5. **Create verification files** (for Universal Links)
6. **Test QR codes** (end-to-end flow)

---

## Quick Commands

### Deploy to Vercel:
```powershell
cd Sanaathana-Aalaya-Charithra/landing-page
vercel --prod
```

### Test locally first:
```powershell
cd Sanaathana-Aalaya-Charithra/landing-page
npx serve .
# Visit http://localhost:3000
```

---

## Support

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Domain expires**: March 9, 2027 (auto-renew enabled)

---

**Status**: Domain Ready - Deploy Now! 🚀  
**Updated**: March 9, 2026
