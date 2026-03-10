# Landing Page Deployment Guide
## Complete Step-by-Step Instructions

**Created**: March 8, 2026  
**Purpose**: Deploy landing page for QR code scans  
**Cost**: FREE (or $1/month with custom domain)

---

## Quick Summary

**What you're creating**: A website that opens when users scan QR codes without the app installed

**URL options**:
- FREE: `charithra.vercel.app`
- PAID: `charithra.org` ($9.77/year - already purchased!)

**Time to deploy**: 10 minutes

---

## Option 1: Vercel (Recommended - FREE)

### Step 1: Create Vercel Account

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended) or email
4. Verify your email

**Cost**: FREE forever

### Step 2: Install Vercel CLI

Open PowerShell and run:

```powershell
npm install -g vercel
```

### Step 3: Deploy

```powershell
# Navigate to landing page folder
cd Sanaathana-Aalaya-Charithra/landing-page

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Follow the prompts**:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **temple-heritage-landing**
- Directory? **.** (current directory)
- Override settings? **N**

**Result**: You'll get a URL like:
```
https://temple-heritage-landing.vercel.app
```

### Step 4: Test Your Website

Open the URL in your browser. You should see the landing page!

Test with artifact ID:
```
https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005
```

---

## Option 2: Add Custom Domain (Optional - Already Purchased!)

You already have `charithra.org` registered with Cloudflare!

### Step 1: Domain Already Purchased ✅

You've already bought `charithra.org` through Cloudflare for $9.77/year.

### Step 2: Connect Domain to Vercel

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click your project: "temple-heritage-landing"
3. Go to "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `charithra.org`
6. Click "Add"

### Step 3: Update DNS Records

Vercel will show you DNS records to add. Go to Cloudflare:

**For Cloudflare**:
1. Go to: https://dash.cloudflare.com
2. Click `charithra.org`
3. Click "DNS" in left menu
4. Add the records Vercel showed you:
   - Type: A
   - Name: @
   - Value: 76.76.21.21
   
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

**Wait 5-60 minutes** for DNS to propagate.

### Step 4: Test Custom Domain

Open: https://charithra.org

You should see your landing page!

---

## Option 3: Netlify (Alternative FREE option)

### Step 1: Create Netlify Account

1. Go to: https://www.netlify.com
2. Click "Sign Up"
3. Sign up with GitHub or email

### Step 2: Deploy via Drag & Drop

1. Go to: https://app.netlify.com/drop
2. Drag the `landing-page` folder onto the page
3. Wait for upload to complete

**Result**: You'll get a URL like:
```
https://random-name-123.netlify.app
```

### Step 3: Rename Site (Optional)

1. Go to Site Settings
2. Click "Change site name"
3. Enter: `temple-heritage`
4. Save

**New URL**:
```
https://temple-heritage.netlify.app
```

---

## Option 4: AWS S3 + CloudFront (If you want everything on AWS)

### Cost: $2-4/month

### Step 1: Create S3 Bucket

```powershell
aws s3 mb s3://charithra.org
```

### Step 2: Upload Files

```powershell
cd landing-page
aws s3 sync . s3://charithra.org --acl public-read
```

### Step 3: Enable Static Website Hosting

```powershell
aws s3 website s3://charithra.org --index-document index.html
```

### Step 4: Create CloudFront Distribution

1. Go to AWS Console → CloudFront
2. Create Distribution
3. Origin: Your S3 bucket
4. Default Root Object: index.html
5. Create

**Wait 15-20 minutes** for deployment.

---

## Update QR Codes

Once your website is live, update QR code generation:

### Update Backend Code

```typescript
// backend/src/services/qrCodeService.ts

export function generateQRCodeData(templeId: string, artifactId: string): string {
  // Replace with your actual domain
  return `https://charithra.org/artifact/${artifactId}?temple=${templeId}`;
}
```

### Update Admin Portal

```typescript
// admin-portal/src/components/QRCodeGenerator.tsx

const qrData = `https://charithra.org/artifact/${artifactId}?temple=${templeId}`;
```

---

## Connect to Backend API

Update API endpoint in `script.js`:

```javascript
// landing-page/script.js

const API_BASE_URL = 'https://api.charithra.org'; // Your actual API URL
```

Or if using AWS API Gateway:

```javascript
const API_BASE_URL = 'https://abc123.execute-api.ap-south-1.amazonaws.com/prod';
```

---

## Testing Checklist

- [ ] Landing page loads: `https://charithra.org`
- [ ] Artifact page loads: `https://charithra.org/artifact/TEMPLE_001_ARTIFACT_005`
- [ ] Download buttons work
- [ ] Mobile responsive (test on phone)
- [ ] HTTPS enabled (padlock icon)
- [ ] Fast loading (< 2 seconds)

---

## Cost Summary

### FREE Option (Recommended for MVP)

| Item | Cost |
|------|------|
| Vercel hosting | FREE |
| SSL certificate | FREE |
| Bandwidth (100GB/month) | FREE |
| **TOTAL** | **$0/month** |

### Paid Option (Production)

| Item | Cost |
|------|------|
| Domain (charithra.org) | $9.77/year = $0.81/month |
| Vercel hosting | FREE |
| SSL certificate | FREE |
| **TOTAL** | **$0.81/month** |

### AWS Option

| Item | Cost |
|------|------|
| Domain (Route 53) | $12/year = $1/month |
| S3 storage | $0.50/month |
| CloudFront | $1-2/month |
| SSL certificate | FREE |
| **TOTAL** | **$2.50-3.50/month** |

---

## Maintenance

### Update Content

1. Edit files in `landing-page/` folder
2. Redeploy:

**Vercel**:
```powershell
cd landing-page
vercel --prod
```

**Netlify**:
```powershell
cd landing-page
netlify deploy --prod
```

**AWS S3**:
```powershell
cd landing-page
aws s3 sync . s3://charithra.org --acl public-read
```

### Monitor Traffic

**Vercel Analytics** (FREE):
1. Go to Vercel dashboard
2. Click your project
3. Go to "Analytics" tab
4. See visitor stats

**Google Analytics** (FREE):
1. Create account: https://analytics.google.com
2. Get tracking ID
3. Add to `index.html` (see README.md)

---

## Troubleshooting

### Issue: "Domain not found"

**Solution**: Wait 5-60 minutes for DNS propagation

### Issue: "SSL certificate error"

**Solution**: Vercel/Netlify auto-provisions SSL. Wait 5 minutes and refresh.

### Issue: "404 Not Found"

**Solution**: Check `vercel.json` routing configuration

### Issue: "API not loading"

**Solution**: Update `API_BASE_URL` in `script.js` with your actual API endpoint

---

## Next Steps

1. ✅ Deploy landing page (10 minutes)
2. ⚠️ Update QR code generation to use URLs
3. ⚠️ Configure deep linking in mobile app
4. ⚠️ Test QR code scan flow
5. ⚠️ Add Google Analytics (optional)
6. ⚠️ Monitor traffic and optimize

---

## Support

**Questions?** Contact: avvarimanju@gmail.com

**Documentation**: See `landing-page/README.md`

---

**Status**: Ready to Deploy  
**Estimated Time**: 10 minutes  
**Difficulty**: Easy  
**Cost**: FREE (or $1/month with custom domain)
