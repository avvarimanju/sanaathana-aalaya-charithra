# Add www.charithra.org Subdomain

**Date**: March 9, 2026  
**Current Status**: charithra.org is LIVE ✅  
**Task**: Add www.charithra.org subdomain

---

## Quick Steps (5 minutes)

### 1. Go to Cloudflare Pages Dashboard

```
https://dash.cloudflare.com
```

1. Click "Workers & Pages" in the left sidebar
2. Click on your project: `sac`

### 2. Add Custom Domain

1. Click the "Custom domains" tab
2. Click "Set up a custom domain" button
3. Enter: `www.charithra.org`
4. Click "Continue"

### 3. Automatic DNS Configuration

Cloudflare will automatically:
- Create a CNAME record for `www.charithra.org`
- Point it to your Pages deployment
- Configure SSL certificate

You'll see a message like:
```
✓ DNS records configured automatically
✓ SSL certificate will be provisioned
```

### 4. Activate Domain

1. Click "Activate domain"
2. Wait 1-5 minutes for:
   - DNS propagation
   - SSL certificate provisioning

### 5. Verify It's Working

```powershell
# Test www subdomain
curl https://www.charithra.org

# Should return your landing page HTML
```

---

## What Happens Behind the Scenes

Cloudflare automatically creates:

**DNS Record**:
- Type: `CNAME`
- Name: `www`
- Target: `sac-cj7.pages.dev` (your Pages deployment)
- Proxy: Enabled (orange cloud)

**SSL Certificate**:
- Automatically provisioned
- Covers both `charithra.org` and `www.charithra.org`
- Free and auto-renewing

---

## Result

After activation, both URLs will work:

✅ `https://charithra.org` → Your landing page  
✅ `https://www.charithra.org` → Your landing page (same content)

Both will:
- Use HTTPS (SSL)
- Serve the same content
- Work with Universal Links verification files

---

## Testing

```powershell
# Test main domain
curl https://charithra.org

# Test www subdomain
curl https://www.charithra.org

# Test iOS verification on both
curl https://charithra.org/.well-known/apple-app-site-association
curl https://www.charithra.org/.well-known/apple-app-site-association

# Test Android verification on both
curl https://charithra.org/.well-known/assetlinks.json
curl https://www.charithra.org/.well-known/assetlinks.json
```

All should return the same content!

---

## Troubleshooting

### "Domain is still pending"

**Wait**: SSL provisioning can take 1-5 minutes. Refresh the page.

### "DNS not resolving"

**Check**: 
```powershell
nslookup www.charithra.org
```

Should show Cloudflare IPs. If not, wait a few more minutes.

### "SSL certificate error"

**Wait**: Certificate provisioning is automatic but can take up to 5 minutes.

---

## No Code Changes Needed!

This is purely a Cloudflare dashboard configuration. No need to:
- Update any files
- Push to GitHub
- Redeploy anything

The existing deployment automatically serves content on all configured domains.

---

## Summary

**Time Required**: 5 minutes  
**Cost**: FREE (included with domain)  
**Difficulty**: Very Easy  
**Code Changes**: None

**Steps**:
1. Go to Cloudflare Pages dashboard
2. Click "Custom domains" tab
3. Add `www.charithra.org`
4. Wait for activation
5. Test both URLs

---

**Current Status**: Ready to add www subdomain! 🚀

