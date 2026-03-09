# Deploy to Cloudflare Pages NOW! 🚀

**Date**: March 9, 2026  
**Status**: Ready to Deploy  
**Time Required**: 10 minutes  
**Cost**: FREE

---

## ✅ What's Ready

All files are prepared and waiting in `landing-page/` folder:
- ✅ Landing page (index.html, styles.css, script.js)
- ✅ iOS verification file (.well-known/apple-app-site-association)
- ✅ Android verification file (.well-known/assetlinks.json)
- ✅ Headers configuration (_headers)
- ✅ Domain purchased (charithra.org)

---

## 🎯 Quick Deploy (Choose One Method)

### Method 1: Direct Upload (FASTEST - 5 minutes) ⭐ RECOMMENDED

1. **Open Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Create Pages Project**
   - Click "Workers & Pages" (left sidebar)
   - Click "Create application"
   - Click "Pages" tab
   - Click "Upload assets"

3. **Upload Files**
   - Click "Select from computer"
   - Navigate to: `Sanaathana-Aalaya-Charithra/landing-page`
   - Select ALL files:
     - index.html
     - styles.css
     - script.js
     - _headers
     - wrangler.toml
     - .well-known/ (entire folder with both files inside)
   - Click "Open"

4. **Configure & Deploy**
   - Project name: `charithra-landing`
   - Click "Deploy site"
   - Wait 30-60 seconds

5. **You'll Get a URL Like**
   ```
   https://charithra-landing.pages.dev
   ```

---

### Method 2: Wrangler CLI (For Developers)

```powershell
# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd Sanaathana-Aalaya-Charithra/landing-page
wrangler pages deploy . --project-name=charithra-landing
```

---

## 🌐 Connect Custom Domain (5 minutes)

After deployment:

1. **In Cloudflare Dashboard**
   - Go to Workers & Pages
   - Click on `charithra-landing`
   - Click "Custom domains" tab

2. **Add Domain**
   - Click "Set up a custom domain"
   - Enter: `charithra.org`
   - Click "Continue"

3. **Auto-Configuration** ✨
   - DNS records are automatically added (you're already on Cloudflare!)
   - SSL certificate is automatically provisioned
   - Click "Activate domain"

4. **Add www (Optional)**
   - Click "Set up a custom domain" again
   - Enter: `www.charithra.org`
   - Click "Continue" and "Activate"

5. **Wait 1-5 Minutes**
   - Domain activates
   - SSL certificate provisions
   - You're live!

---

## ✅ Test Your Deployment

```powershell
# Test landing page
curl https://charithra.org

# Test iOS verification
curl https://charithra.org/.well-known/apple-app-site-association

# Test Android verification
curl https://charithra.org/.well-known/assetlinks.json

# Check headers
curl -I https://charithra.org/.well-known/apple-app-site-association
# Should show: Content-Type: application/json
```

---

## 📝 After Deployment: Update Verification Files

### For iOS Universal Links

1. **Get Your Apple Team ID**
   - Go to: https://developer.apple.com/account
   - Click "Membership"
   - Copy your Team ID (e.g., `ABC123XYZ`)

2. **Update the File**
   - Edit: `landing-page/.well-known/apple-app-site-association`
   - Replace `TEAM_ID` with your actual Team ID
   - Example: `"appID": "ABC123XYZ.com.charithra.app"`

3. **Redeploy**
   - Upload updated file via Cloudflare dashboard
   - Or run: `wrangler pages deploy . --project-name=charithra-landing`

### For Android App Links

1. **Get SHA256 Fingerprint**
   ```powershell
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore (when you have it)
   keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
   ```

2. **Copy SHA256**
   - Look for "SHA256:" in output
   - Copy the fingerprint (format: `AA:BB:CC:DD:...`)
   - Remove colons: `AABBCCDDEE...`

3. **Update the File**
   - Edit: `landing-page/.well-known/assetlinks.json`
   - Replace `YOUR_SHA256_FINGERPRINT_HERE` with your fingerprint
   - Example: `"sha256_cert_fingerprints": ["AABBCCDDEE..."]`

4. **Redeploy**

---

## 🔍 Validate Universal Links

### iOS Validator
```
https://branch.io/resources/aasa-validator/
Enter: https://charithra.org/.well-known/apple-app-site-association
```

### Android Validator
```
https://developers.google.com/digital-asset-links/tools/generator
Enter your domain and package name
```

---

## 💰 Cost Breakdown

| Item | Cost |
|------|------|
| Cloudflare Pages Hosting | FREE |
| Bandwidth (Unlimited) | FREE |
| SSL Certificate | FREE |
| Deployments (Unlimited) | FREE |
| Domain (charithra.org) | $9.77/year |
| **TOTAL** | **$9.77/year** |

---

## 🎉 What You Get

- ✅ Landing page live at https://charithra.org
- ✅ iOS Universal Links support
- ✅ Android App Links support
- ✅ Automatic SSL/HTTPS
- ✅ Global CDN (fast worldwide)
- ✅ Unlimited bandwidth
- ✅ Automatic deployments (if using Git)
- ✅ Free forever!

---

## 📚 Full Documentation

For detailed instructions, see:
- `CLOUDFLARE_PAGES_DEPLOYMENT.md` - Complete deployment guide
- `CHARITHRA_ORG_SETUP_GUIDE.md` - Domain setup details
- `UNIVERSAL_LINKS_IMPLEMENTATION_GUIDE.md` - Deep linking setup

---

## 🆘 Need Help?

**Common Issues:**

1. **Files not uploading?**
   - Make sure to select the `.well-known` folder
   - Include the `_headers` file

2. **Domain not activating?**
   - Wait 5 minutes for DNS propagation
   - Check Cloudflare DNS settings

3. **Wrong Content-Type?**
   - Ensure `_headers` file is included
   - Redeploy if needed

**Support:**
- Cloudflare Dashboard: https://dash.cloudflare.com
- Cloudflare Docs: https://developers.cloudflare.com/pages

---

## 🚀 Ready? Let's Deploy!

**Estimated Time**: 10 minutes  
**Difficulty**: Easy  
**Result**: Your landing page live at charithra.org

**Start here**: https://dash.cloudflare.com

---

**Updated**: March 9, 2026  
**Status**: Ready to Deploy! 🎯
