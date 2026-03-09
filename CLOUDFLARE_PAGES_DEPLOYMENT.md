# Cloudflare Pages Deployment Guide

**Date**: March 9, 2026  
**Domain**: charithra.org  
**Platform**: Cloudflare Pages  
**Status**: Ready to Deploy

---

## What's Been Prepared

✅ Landing page files (index.html, styles.css, script.js)  
✅ iOS verification file (.well-known/apple-app-site-association)  
✅ Android verification file (.well-known/assetlinks.json)  
✅ Headers configuration (_headers)  
✅ Wrangler configuration (wrangler.toml)

---

## Deployment Options

### Option 1: Direct Upload (Fastest - 5 minutes) ⭐

This is the quickest way to get your site live.

#### Steps:

1. **Go to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Navigate to Pages**
   - Click "Workers & Pages" in left sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Upload assets"

3. **Upload Your Files**
   - Click "Select from computer"
   - Navigate to: `Sanaathana-Aalaya-Charithra/landing-page`
   - Select ALL files and folders:
     - index.html
     - styles.css
     - script.js
     - _headers
     - wrangler.toml
     - .well-known/ (entire folder)
   - Click "Open"

4. **Configure Project**
   - Project name: `charithra-landing`
   - Production branch: `main` (or leave default)
   - Click "Deploy site"

5. **Wait for Deployment** (30-60 seconds)
   - Cloudflare will process and deploy your files
   - You'll get a URL like: `https://charithra-landing.pages.dev`

6. **Test the Deployment**
   ```powershell
   # Test landing page
   curl https://charithra-landing.pages.dev
   
   # Test iOS verification
   curl https://charithra-landing.pages.dev/.well-known/apple-app-site-association
   
   # Test Android verification
   curl https://charithra-landing.pages.dev/.well-known/assetlinks.json
   ```

---

### Option 2: Git Integration (Recommended for Updates)

This allows automatic deployments when you push to GitHub.

#### Steps:

1. **Push to GitHub** (if not already done)
   ```powershell
   cd Sanaathana-Aalaya-Charithra
   git add landing-page/
   git commit -m "Add landing page for Cloudflare Pages"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to: https://dash.cloudflare.com
   - Click "Workers & Pages"
   - Click "Create application"
   - Click "Pages" tab
   - Click "Connect to Git"

3. **Select Repository**
   - Choose your GitHub account
   - Select repository: `Sanaathana-Aalaya-Charithra`
   - Click "Begin setup"

4. **Configure Build Settings**
   - Project name: `charithra-landing`
   - Production branch: `main`
   - Build command: (leave empty)
   - Build output directory: `landing-page`
   - Root directory: `/` (or leave empty)
   - Click "Save and Deploy"

5. **Wait for Deployment** (1-2 minutes)
   - First build takes longer
   - Subsequent builds are faster

---

### Option 3: Wrangler CLI (For Developers)

Use Cloudflare's CLI tool for command-line deployments.

#### Steps:

1. **Install Wrangler**
   ```powershell
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```powershell
   wrangler login
   ```
   - This opens a browser for authentication
   - Authorize Wrangler

3. **Deploy**
   ```powershell
   cd Sanaathana-Aalaya-Charithra/landing-page
   wrangler pages deploy . --project-name=charithra-landing
   ```

4. **Follow Prompts**
   - Confirm project name
   - Wait for upload and deployment

---

## Add Custom Domain (charithra.org)

After deploying, connect your custom domain:

### Steps:

1. **Go to Your Project**
   - Dashboard → Workers & Pages
   - Click on `charithra-landing`

2. **Add Custom Domain**
   - Click "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter: `charithra.org`
   - Click "Continue"

3. **DNS Configuration (Automatic!)**
   - Since you're already using Cloudflare DNS, records are auto-configured
   - Cloudflare will show you what was added:
     - Type: CNAME
     - Name: charithra.org
     - Target: charithra-landing.pages.dev
   - Click "Activate domain"

4. **Add www Subdomain** (Optional)
   - Click "Set up a custom domain" again
   - Enter: `www.charithra.org`
   - Click "Continue"
   - Auto-configured again!

5. **Wait for Activation** (1-5 minutes)
   - SSL certificate is automatically provisioned
   - DNS propagates quickly (you're on Cloudflare!)

---

## Verification & Testing

### 1. Test Landing Page

```powershell
# Test main domain
curl https://charithra.org

# Test www subdomain
curl https://www.charithra.org

# Should return your HTML content
```

### 2. Test iOS Verification File

```powershell
# Test AASA file
curl https://charithra.org/.well-known/apple-app-site-association

# Check headers
curl -I https://charithra.org/.well-known/apple-app-site-association

# Should show:
# Content-Type: application/json
# HTTP/2 200
```

### 3. Test Android Verification File

```powershell
# Test asset links
curl https://charithra.org/.well-known/assetlinks.json

# Check headers
curl -I https://charithra.org/.well-known/assetlinks.json

# Should show:
# Content-Type: application/json
# HTTP/2 200
```

### 4. Validate with Online Tools

**iOS Universal Links:**
```
https://branch.io/resources/aasa-validator/
Enter: https://charithra.org/.well-known/apple-app-site-association
```

**Android App Links:**
```
https://developers.google.com/digital-asset-links/tools/generator
Enter your domain and package name
```

---

## Update Verification Files

### For iOS (apple-app-site-association)

You need to update the `TEAM_ID` with your actual Apple Team ID:

1. **Find Your Team ID**
   - Go to: https://developer.apple.com/account
   - Click "Membership"
   - Copy your Team ID (e.g., `ABC123XYZ`)

2. **Update the File**
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "ABC123XYZ.com.charithra.app",
           "paths": ["/artifact/*", "/temple/*"]
         }
       ]
     }
   }
   ```

3. **Redeploy**
   - Upload updated file via Cloudflare dashboard
   - Or push to Git (if using Git integration)

### For Android (assetlinks.json)

You need to add your app's SHA256 fingerprint:

1. **Get SHA256 Fingerprint**
   ```powershell
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore
   keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
   ```

2. **Copy the SHA256 Fingerprint**
   - Look for "SHA256:" in the output
   - Copy the fingerprint (format: `AA:BB:CC:...`)
   - Remove colons: `AABBCC...`

3. **Update the File**
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.charithra.app",
       "sha256_cert_fingerprints": [
         "AABBCCDDEE..."
       ]
     }
   }]
   ```

4. **Redeploy**

---

## Troubleshooting

### Issue: "Content-Type is text/plain"

**Solution**: Make sure `_headers` file is in the root of your deployment.

```powershell
# Check if _headers file exists
ls landing-page/_headers

# If missing, create it (already done for you!)
```

### Issue: "404 Not Found for .well-known files"

**Solution**: Ensure `.well-known` folder is included in deployment.

```powershell
# Check folder exists
ls landing-page/.well-known/

# Should show:
# apple-app-site-association
# assetlinks.json
```

### Issue: "Domain not activating"

**Solution**: Wait 5-10 minutes for DNS propagation, then check:

```powershell
# Check DNS
nslookup charithra.org

# Should point to Cloudflare
```

### Issue: "SSL Certificate Error"

**Solution**: Cloudflare auto-provisions SSL. Wait 5 minutes and try again.

---

## Updating Your Site

### Method 1: Direct Upload

1. Go to Cloudflare Dashboard
2. Workers & Pages → charithra-landing
3. Click "Create deployment"
4. Upload updated files
5. Click "Deploy"

### Method 2: Git Push (if using Git integration)

```powershell
cd Sanaathana-Aalaya-Charithra
# Make changes to landing-page files
git add landing-page/
git commit -m "Update landing page"
git push origin main
# Automatic deployment triggers!
```

### Method 3: Wrangler CLI

```powershell
cd Sanaathana-Aalaya-Charithra/landing-page
wrangler pages deploy . --project-name=charithra-landing
```

---

## Monitoring & Analytics

### View Deployment Logs

1. Go to Cloudflare Dashboard
2. Workers & Pages → charithra-landing
3. Click "View details" on any deployment
4. See build logs and deployment status

### Enable Web Analytics (FREE)

1. In your project settings
2. Click "Web Analytics" tab
3. Click "Enable Web Analytics"
4. Add the provided script to your HTML (optional)

### Monitor Traffic

- Dashboard shows:
  - Requests per day
  - Bandwidth usage
  - Error rates
  - Geographic distribution

---

## Cost

**Everything is FREE!**

- Hosting: FREE (unlimited bandwidth)
- SSL Certificate: FREE (automatic)
- Custom Domain: $9.77/year (already purchased!)
- Deployments: FREE (unlimited)
- **Total**: $9.77/year ($0.81/month)

---

## Next Steps

1. ✅ Deploy to Cloudflare Pages (5-10 minutes)
2. ✅ Add custom domain charithra.org (5 minutes)
3. ⏳ Update verification files with real IDs (10 minutes)
4. ⏳ Test Universal Links on real devices (30 minutes)
5. ⏳ Configure mobile app to use charithra.org (30 minutes)

---

## Quick Start Commands

```powershell
# Option 1: Direct upload via dashboard
# Go to: https://dash.cloudflare.com
# Upload files from: Sanaathana-Aalaya-Charithra/landing-page

# Option 2: Wrangler CLI
npm install -g wrangler
wrangler login
cd Sanaathana-Aalaya-Charithra/landing-page
wrangler pages deploy . --project-name=charithra-landing

# Test deployment
curl https://charithra.org
curl https://charithra.org/.well-known/apple-app-site-association
curl https://charithra.org/.well-known/assetlinks.json
```

---

## Support

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler

---

**Status**: Ready to Deploy! 🚀  
**Estimated Time**: 10-15 minutes  
**Difficulty**: Easy  
**Cost**: FREE (+ $9.77/year domain)

**Updated**: March 9, 2026
