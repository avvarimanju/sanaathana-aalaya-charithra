# Temple Heritage Landing Page

Landing page for QR code scans when users don't have the mobile app installed.

## Features

- ✅ Responsive design (mobile-first)
- ✅ Dynamic content loading from API
- ✅ App download prompts
- ✅ Deep linking support
- ✅ SEO optimized
- ✅ Fast loading (< 1s)

## Deployment Options

### Cloudflare Pages (Recommended - FREE) ⭐

**See full guide**: `DEPLOY_NOW_CLOUDFLARE.md`

#### Quick Deploy:

1. **Direct Upload** (Fastest - 5 minutes):
   - Go to: https://dash.cloudflare.com
   - Click "Workers & Pages" → "Create application" → "Pages" → "Upload assets"
   - Upload all files from this folder (including .well-known folder)
   - Project name: `charithra-landing`
   - Click "Deploy site"

2. **Wrangler CLI**:
```bash
npm install -g wrangler
wrangler login
cd landing-page
wrangler pages deploy . --project-name=charithra-landing
```

3. **Add Custom Domain**:
   - In Cloudflare dashboard, go to your project
   - Click "Custom domains" → "Set up a custom domain"
   - Enter: `charithra.org`
   - DNS auto-configured (you're already on Cloudflare!)

**Why Cloudflare Pages?**
- FREE forever (unlimited bandwidth)
- You already use Cloudflare for DNS (seamless integration)
- Automatic SSL certificate
- Global CDN
- No configuration needed

## Local Development

```bash
cd landing-page
npx serve .
```

Open: http://localhost:3000

## Testing

Test with different URLs:

1. Default landing page:
   - http://localhost:3000

2. Artifact page:
   - http://localhost:3000/artifact/TEMPLE_001_ARTIFACT_005
   - http://localhost:3000/?artifact=TEMPLE_001_ARTIFACT_005

## Configuration

Update API endpoint in `script.js`:

```javascript
const API_BASE_URL = 'https://api.charithra.org';
```

Update app store links in `index.html`:

```html
<a href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE_ID">
```

## Cost

- **Cloudflare Pages**: FREE
- **Bandwidth**: FREE (unlimited)
- **SSL Certificate**: FREE (automatic)
- **Custom domain (charithra.org)**: $9.77/year (already purchased!)
- **Total**: $9.77/year ($0.81/month)

## Performance

- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: 95+

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- HTTPS enforced
- Content Security Policy headers
- XSS protection
- No external dependencies (except images)

## Analytics (Optional)

Add Google Analytics:

```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Maintenance

- Update app store links when app is published
- Update API endpoint when backend is deployed
- Monitor analytics for QR scan traffic
- Update content as needed

## Support

For issues or questions, contact: avvarimanju@gmail.com
