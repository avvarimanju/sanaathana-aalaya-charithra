# Domain & Hosting Decision Guide
## Complete Comparison & Recommendation

**Date**: March 8, 2026  
**Decision**: Choose domain and hosting platform

---

## Quick Recommendation

### For MVP (Recommended):
- **Domain**: `charithra.org` ($9.77/year - PURCHASED!)
- **Hosting**: Vercel (FREE)
- **Total Cost**: $9.77/year
- **Setup Time**: 15 minutes

### For Production (Later):
- **Domain**: Same (keep it)
- **Hosting**: AWS S3 + CloudFront ($18/year)
- **Total Cost**: $28-33/year
- **Migration Time**: 30 minutes

---

## Domain Comparison

### Option 1: charithra.org ⭐ PURCHASED!

**Cost**: $9.77/year

**Pros**:
- ✅ Perfect for cultural/heritage project
- ✅ .org = Non-profit credibility
- ✅ Cheaper than .app
- ✅ Better for Indian audience
- ✅ Shows seriousness and authenticity

**Cons**:
- ⚠️ Long (29 characters)
- ⚠️ Hard to type
- ⚠️ Easy to misspell

**Where to buy**:
- Namecheap: $10.98/year
- Google Domains: $12/year
- GoDaddy: $14.99/year

### Option 2: charithra.org

**Cost**: $9.77/year (already purchased!)

**Pros**:
- ✅ Short and memorable
- ✅ Modern (.app extension)
- ✅ Easy to type
- ✅ HTTPS required by default

**Cons**:
- ⚠️ Less cultural feel
- ⚠️ More expensive
- ⚠️ Generic name

### Option 3: Shorter alternatives

Consider these if main domain is too long:

- `charithra.org` - Sanaathana Aalaya Charithra (PURCHASED ✅)
- `sacheritage.org` - Alternative option
- `aalayacharithra.org` - Shorter Sanskrit
- `hindutemples.org` - Descriptive

**Cost**: $10-15/year each

---

## Hosting Comparison

### Option 1: Vercel (FREE) ⭐ RECOMMENDED FOR MVP

**Architecture**:
```
User → Vercel Global CDN → Your Website
```

**Cost**: $0/month

**Pros**:
- ✅ Completely FREE
- ✅ 5-minute setup
- ✅ Automatic HTTPS
- ✅ Global CDN (fast worldwide)
- ✅ Automatic deployments
- ✅ One-click rollbacks
- ✅ Built-in analytics
- ✅ 100GB bandwidth free
- ✅ No credit card needed

**Cons**:
- ⚠️ Separate from AWS
- ⚠️ Need CORS for API calls
- ⚠️ Less control

**Best for**:
- MVP testing
- First 3-6 months
- Budget-conscious startups
- Quick iterations

**Setup**:
```powershell
npm install -g vercel
cd landing-page
vercel --prod
```

---

### Option 2: AWS S3 + CloudFront ⭐ RECOMMENDED FOR PRODUCTION

**Architecture**:
```
User → CloudFront (CDN) → S3 Bucket → Website Files
```

**Cost**: $1.52/month ($18/year)

**Breakdown**:
- Route 53: $0.50/month
- S3 Storage: $0.01/month
- S3 Requests: $0.01/month
- CloudFront: $1.00/month
- SSL (ACM): FREE

**Pros**:
- ✅ Everything in AWS
- ✅ Same account as backend
- ✅ Professional setup
- ✅ Better integration
- ✅ More control
- ✅ 99.99% uptime SLA
- ✅ Scales automatically

**Cons**:
- ⚠️ Costs money (though minimal)
- ⚠️ 30-45 minute setup
- ⚠️ More complex
- ⚠️ Need AWS knowledge

**Best for**:
- Production deployment
- After MVP validated
- Professional projects
- When backend is on AWS

**Setup**: See `AWS_LANDING_PAGE_DEPLOYMENT.md`

---

### Option 3: Netlify (FREE)

**Cost**: $0/month

**Pros**:
- ✅ FREE
- ✅ Easy setup
- ✅ Similar to Vercel
- ✅ Good documentation

**Cons**:
- ⚠️ Slightly slower than Vercel
- ⚠️ Less popular

**Best for**: Alternative to Vercel

---

## AWS vs Non-AWS: Detailed Comparison

### Integration with Backend

**AWS (Everything Together)**:
```
Landing Page (S3)
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
DynamoDB

All in same AWS account
Same region (ap-south-1)
Easy CORS setup
Unified billing
Single dashboard
```

**Vercel (Separate Platforms)**:
```
Landing Page (Vercel)
    ↓ (HTTPS request)
API Gateway (AWS)
    ↓
Lambda Functions
    ↓
DynamoDB

Two platforms
Need CORS headers
Separate billing
Two dashboards
```

### CORS Configuration

**AWS (No CORS needed)**:
- Same origin
- No cross-domain issues
- Simpler configuration

**Vercel (CORS required)**:
```javascript
// API Gateway needs CORS headers
{
  "Access-Control-Allow-Origin": "https://charithra.org",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

### Deployment Process

**AWS**:
```powershell
# Build
npm run build

# Upload to S3
aws s3 sync ./dist s3://your-bucket

# Invalidate cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

**Vercel**:
```powershell
# Deploy
vercel --prod

# Done!
```

### Cost at Scale

**10,000 users/month**:
- AWS: $1.52/month
- Vercel: $0/month

**100,000 users/month**:
- AWS: $5-10/month
- Vercel: $0/month (still under 100GB)

**1,000,000 users/month**:
- AWS: $50-100/month
- Vercel: $20/month (Pro plan needed)

---

## Recommended Implementation Plan

### Phase 1: MVP (Months 1-3)

**Goal**: Test with real users, validate concept

**Setup**:
1. Buy domain: `charithra.org` (PURCHASED! $9.77)
2. Deploy to Vercel (FREE)
3. Connect domain
4. Test with 100-1000 users

**Cost**: $10-15 one-time
**Time**: 15 minutes
**Risk**: Low

### Phase 2: Growth (Months 4-6)

**Goal**: Scale to 10K users

**Keep**:
- Same domain
- Same Vercel hosting (still FREE)

**Add**:
- Google Analytics
- Monitoring
- A/B testing

**Cost**: Still $0/month
**Time**: 2 hours for analytics setup

### Phase 3: Production (Months 7-12)

**Goal**: Professional deployment, 50K+ users

**Migrate**:
1. Keep domain
2. Move to AWS S3 + CloudFront
3. Integrate with backend
4. Set up monitoring

**Cost**: $18/year additional
**Time**: 30-45 minutes migration
**Benefit**: Better integration, more control

---

## Decision Matrix

### Choose Vercel if:
- ✅ Budget is tight (FREE)
- ✅ Want quick setup (5 minutes)
- ✅ Testing MVP
- ✅ Don't need AWS integration yet
- ✅ Want easy deployments

### Choose AWS if:
- ✅ Backend already on AWS
- ✅ Want everything in one place
- ✅ Need professional setup
- ✅ Have AWS knowledge
- ✅ Budget allows ($18/year)

---

## My Final Recommendation

### Start with Vercel, migrate to AWS later

**Reasoning**:
1. **Save money**: $18/year saved in first year
2. **Faster launch**: 5 minutes vs 45 minutes
3. **Easier iteration**: Deploy with one command
4. **Low risk**: Can migrate anytime
5. **Same features**: Both have CDN, HTTPS, etc.

**Timeline**:
- **Now**: Deploy to Vercel (FREE)
- **Month 3**: Evaluate if migration needed
- **Month 6**: Migrate to AWS if scaling

**Total Savings**: $18 in first year

---

## Action Items

### Immediate (This Week):

1. ✅ Buy domain: `charithra.org` (PURCHASED!)
   - Registered with Cloudflare
   - Cost: $9.77/year
   - Buy for $10.98/year

2. ✅ Deploy to Vercel
   ```powershell
   npm install -g vercel
   cd landing-page
   vercel --prod
   ```

3. ✅ Connect domain to Vercel
   - Vercel dashboard → Domains
   - Add domain
   - Update DNS records

4. ✅ Test QR code flow
   - Generate QR with new URL
   - Scan with phone
   - Verify landing page loads

### Next Month:

1. ⚠️ Monitor traffic (Vercel Analytics)
2. ⚠️ Collect user feedback
3. ⚠️ Optimize content
4. ⚠️ Decide on AWS migration

---

## Cost Summary

### Year 1 (MVP with Vercel)

| Item | Cost |
|------|------|
| Domain (.org) | $10-15 |
| Vercel Hosting | $0 |
| SSL Certificate | $0 |
| **TOTAL** | **$10-15/year** |

### Year 1 (Production with AWS)

| Item | Cost |
|------|------|
| Domain (.org) | $10-15 |
| AWS Hosting | $18 |
| SSL Certificate | $0 |
| **TOTAL** | **$28-33/year** |

### Savings with Vercel: $18/year

---

## Questions & Answers

### Q: Can I use both domains?

**A**: Yes! You can:
1. Buy both domains
2. Point both to same website
3. Use short one for marketing
4. Use long one for official

**Cost**: $20-30/year for both

### Q: Can I migrate from Vercel to AWS later?

**A**: Yes! Very easy:
1. Deploy to AWS (30 minutes)
2. Update DNS records (5 minutes)
3. Test (10 minutes)
4. Delete Vercel deployment

**No downtime needed**

### Q: What if Vercel shuts down?

**A**: Unlikely, but:
- You own the domain
- You have the code
- Can migrate to AWS in 1 hour
- Zero data loss

### Q: Is Vercel reliable?

**A**: Yes!
- 99.99% uptime
- Used by Netflix, Uber, Nike
- 10+ years in business
- Backed by major investors

---

## Conclusion

**Start with Vercel** for MVP, migrate to AWS when needed.

**Benefits**:
- Save $18 in first year
- Launch in 15 minutes instead of 45
- Easy deployments
- Can migrate anytime

**Next Steps**:
1. Buy `charithra.org` domain (PURCHASED!)
2. Deploy to Vercel
3. Test with users
4. Decide on AWS migration in 3-6 months

---

**Status**: Decision Guide Complete  
**Recommendation**: Vercel + .org domain for MVP  
**Cost**: $10-15/year  
**Setup Time**: 15 minutes
