# Documentation Index
## Sanaathana Aalaya Charithra

This directory contains all planning, business, and technical documentation for the project.

---

## 📁 Documentation Structure

```
docs/
├── INDEX.md (this file)
├── planning/          # Feature planning and enhancements
├── business/          # Business decisions and analysis
├── technical/         # Technical implementation guides
├── architecture/      # System architecture diagrams
├── demo/             # Demo and presentation materials
└── setup/            # Setup and deployment guides
```

---

## 📋 Planning Documents

Documents related to feature planning and product enhancements.

### [Virtual Exploration Enhancement](./planning/VIRTUAL_EXPLORATION_ENHANCEMENT.md)
**Purpose:** Complete specification for virtual exploration feature  
**Topics:** Browse temples from home, unlock content, offline downloads  
**Created:** During Q&A about virtual exploration  
**Use When:** Planning virtual exploration implementation

### [Enhancement Summary](./planning/ENHANCEMENT_SUMMARY.md)
**Purpose:** Quick summary of virtual exploration feature  
**Topics:** What's been created, implementation status, next steps  
**Created:** Summary of enhancement work  
**Use When:** Quick reference for enhancement status

---

## 💼 Business Documents

Documents related to business decisions, costs, and monetization.

### [AWS Cost Analysis](./business/AWS_COST_ANALYSIS.md)
**Purpose:** Complete breakdown of AWS service costs  
**Topics:** Cost per scan, pricing models, revenue projections, break-even analysis  
**Created:** During Q&A about costs and pricing  
**Use When:** 
- Budgeting and financial planning
- Deciding pricing strategy
- Calculating profit margins
- Presenting to investors

**Key Insights:**
- Cost per scan: ₹4.15 (with caching: ₹1.00)
- Recommended pricing: ₹99 per temple
- Profit margin: 79%
- Break-even: 36 temple purchases/month
- Admin/Dashboard features add $5-16/month (without ElastiCache)

### [Cost Optimization Decisions](./business/COST_OPTIMIZATION_DECISIONS.md)
**Purpose:** Track cost optimization decisions made during development  
**Topics:** ElastiCache deferral, rationale, migration path, cost impact  
**Created:** February 2026 - Admin/Dashboard feature planning  
**Use When:**
- Understanding why certain services were excluded
- Planning infrastructure scaling
- Deciding when to add deferred services
- Reviewing cost-saving strategies

**Key Insights:**
- ElastiCache deferred to save $12/month initially
- Dashboard works identically without cache (only performance differs)
- Can add ElastiCache later with zero code changes
- Current infrastructure cost: $5-16/month

### [App Store Publishing Costs](./business/APP_STORE_PUBLISHING_COSTS.md)
**Purpose:** Complete guide to Google Play and Apple App Store fees  
**Topics:** Registration fees, annual costs, payment gateway fees, break-even analysis  
**Created:** During Q&A about app store publishing costs  
**Use When:**
- Planning app launch budget
- Deciding which platform to launch first
- Calculating total costs
- Comparing Android vs iOS

**Key Insights:**
- Google Play: $25 (₹2,075) one-time fee
- Apple App Store: $99 (₹8,217) annual fee
- Recommended: Start with Android only
- Use Razorpay (2%) instead of store payments (15-30%)

### [Payment Methods Comparison](./business/PAYMENT_METHODS_COMPARISON.md)
**Purpose:** Comprehensive comparison of 10 payment gateways  
**Topics:** Razorpay, PhonePe, Stripe, Google Play, Apple IAP, and others  
**Created:** During Q&A about payment options  
**Use When:**
- Choosing payment gateway
- Comparing fees and features
- Integration planning
- International expansion

**Key Insights:**
- Recommended: Razorpay (2% fee, covers all Indian payment methods)
- Avoid: Google Play/Apple IAP (15-30% fee)
- Optional: PhonePe for free UPI
- International: Stripe (2.9% + ₹2)

### [Razorpay vs PhonePe](./business/RAZORPAY_VS_PHONEPE.md)
**Purpose:** Detailed analysis of why Razorpay is better than PhonePe-only  
**Topics:** Revenue impact, user scenarios, hybrid approach  
**Created:** During Q&A about free UPI  
**Use When:**
- Explaining payment gateway choice
- Justifying 2% fee vs free UPI
- Planning hybrid payment strategy

**Key Insights:**
- PhonePe-only loses 40% of customers (non-UPI users)
- Razorpay captures all payment methods
- Net gain: ₹37,620 per 1,000 transactions despite 2% fee
- Hybrid approach saves ₹1,188 per 1,000 transactions

---

## 🔧 Technical Documents

Documents related to technical implementation and content generation.

### [When to Add ElastiCache](./guides/WHEN_TO_ADD_ELASTICACHE.md)
**Purpose:** Decision guide for adding ElastiCache Redis to dashboard  
**Topics:** Performance indicators, usage metrics, migration steps, cost impact  
**Created:** February 2026 - Admin/Dashboard feature planning  
**Use When:**
- Dashboard performance becomes slow
- Deciding whether to add caching
- Planning infrastructure scaling
- Monitoring dashboard metrics

**Key Insights:**
- Add when dashboard load times exceed 1 second
- Add when 50+ concurrent admin users
- Migration takes ~10 minutes with zero code changes
- Cost increase: $12/month for 5-10x performance improvement

### [Content Generation Explained](./technical/CONTENT_GENERATION_EXPLAINED.md)
**Purpose:** Complete explanation of how AI generates content  
**Topics:** Two-step process, AI prompts, multi-language, caching  
**Created:** During Q&A about content generation  
**Use When:**
- Understanding content generation workflow
- Adding new artifacts
- Explaining to team members
- Troubleshooting content issues

**Key Insights:**
- You provide: 2-3 sentences per field (10-15 minutes)
- AI generates: 500-900 words per content type (automatic)
- Supports: 10 Indian languages
- Cost: ₹4.60 first time, ₹0.002 cached

### [Content Accuracy and Sources](./technical/CONTENT_ACCURACY_AND_SOURCES.md)
**Purpose:** Critical guide on content accuracy and verification  
**Topics:** AI limitations, trusted sources, verification process, hybrid approach  
**Created:** During Q&A about information sources  
**Use When:**
- Researching artifact information
- Verifying historical facts
- Building credibility
- Addressing accuracy concerns

**Key Insights:**
- AI can "hallucinate" - makes up plausible but incorrect facts
- Recommended sources: ASI, temple records, academic books
- Use hybrid approach: YOU provide verified facts, AI enhances presentation
- Always document sources and get expert review

**Critical Checklist:**
- [ ] Sources documented (at least 2 independent sources)
- [ ] Facts verified (dates, names, events)
- [ ] Expert review (temple authority, historian)
- [ ] Disclaimers added (uncertainties noted)
- [ ] User feedback mechanism (report error button)

### [Audio & Video Generation Capabilities](./technical/AUDIO_VIDEO_GENERATION_CAPABILITIES.md)
**Purpose:** What AWS can and cannot generate for multimedia content  
**Topics:** Audio generation (YES), Video generation (NO), DIY production guide  
**Created:** During Q&A about audio/video generation  
**Use When:**
- Planning content creation
- Budgeting for multimedia
- Understanding AWS limitations
- Creating filming checklists

**Key Insights:**
- Audio: ✅ AWS Polly generates natural voice (₹1.60 per file)
- Video: ❌ AWS cannot generate - you must film (free with smartphone)
- Photos: ❌ AWS cannot generate - you must take (free with smartphone)
- Recommended: AI for text/audio, DIY for video/photos

**Content Strategy:**
- Tier 1 (Essential): Text + Audio (AI) + Photos (DIY) = ₹19
- Tier 2 (Enhanced): + Video (DIY) = ₹19
- Tier 3 (Premium): + Professional video = ₹20,000-50,000

---

## 🎯 Quick Reference Guide

### When to Use Which Document

**Planning a new feature?**
→ Check `planning/` folder

**Making business decisions?**
→ Check `business/` folder for cost analysis and payment options

**Understanding cost optimization?**
→ Read `business/COST_OPTIMIZATION_DECISIONS.md`

**Deciding whether to add ElastiCache?**
→ Read `guides/WHEN_TO_ADD_ELASTICACHE.md`

**Implementing content generation?**
→ Read `technical/CONTENT_GENERATION_EXPLAINED.md`

**Concerned about accuracy?**
→ Read `technical/CONTENT_ACCURACY_AND_SOURCES.md`

**Need to create multimedia content?**
→ Read `technical/AUDIO_VIDEO_GENERATION_CAPABILITIES.md`

**Choosing payment gateway?**
→ Read `business/PAYMENT_METHODS_COMPARISON.md`

**Justifying Razorpay over free UPI?**
→ Read `business/RAZORPAY_VS_PHONEPE.md`

**Calculating costs and pricing?**
→ Read `business/AWS_COST_ANALYSIS.md`

---

## 📊 Document Status

| Document | Status | Last Updated | Reviewed By |
|----------|--------|--------------|-------------|
| Virtual Exploration Enhancement | ✅ Complete | 2024-02-23 | - |
| Enhancement Summary | ✅ Complete | 2024-02-23 | - |
| AWS Cost Analysis | ✅ Complete | 2026-02-25 | - |
| Cost Optimization Decisions | ✅ Complete | 2026-02-25 | - |
| When to Add ElastiCache | ✅ Complete | 2026-02-25 | - |
| Payment Methods Comparison | ✅ Complete | 2024-02-23 | - |
| Razorpay vs PhonePe | ✅ Complete | 2024-02-23 | - |
| Content Generation Explained | ✅ Complete | 2024-02-23 | - |
| Content Accuracy and Sources | ✅ Complete | 2024-02-23 | - |
| Audio Video Generation | ✅ Complete | 2024-02-23 | - |

---

## 🔄 Document Maintenance

### When to Update

- **Cost Analysis:** When AWS pricing changes or new services added
- **Payment Comparison:** When new payment gateways emerge or fees change
- **Content Generation:** When AI models or services change
- **Planning Docs:** When features are implemented or requirements change

### Review Schedule

- **Quarterly:** Review all business documents for accuracy
- **Bi-annually:** Review technical documents for updates
- **As needed:** Update planning documents when features change

---

## 📝 Contributing to Documentation

### Adding New Documents

1. Determine category: planning, business, or technical
2. Create document in appropriate folder
3. Update this INDEX.md with entry
4. Follow naming convention: `DESCRIPTIVE_NAME.md`
5. Include purpose, topics, and key insights

### Document Template

```markdown
# Document Title
## Subtitle

---

## 🎯 Purpose

Brief description of what this document covers.

---

## 📋 Topics Covered

- Topic 1
- Topic 2
- Topic 3

---

## [Content sections...]

---

## ✅ Key Takeaways

- Takeaway 1
- Takeaway 2
- Takeaway 3
```

---

## 🔗 Related Resources

### Main Documentation
- [README.md](../README.md) - Project overview and quick start
- [DOCUMENTATION.md](../DOCUMENTATION.md) - Complete technical documentation

### External Resources
- [AWS Documentation](https://docs.aws.amazon.com/)
- [React Native Documentation](https://reactnative.dev/)
- [Razorpay Documentation](https://razorpay.com/docs/)
- [ASI Website](https://asi.gov.in/)

---

## 💡 Tips for Using This Documentation

1. **Start with INDEX.md** (this file) to find what you need
2. **Use search** (Ctrl+F) to find specific topics
3. **Read summaries first** before diving into full documents
4. **Bookmark frequently used** documents
5. **Update as you learn** - add notes and insights
6. **Share with team** - these are reference materials

---

**Last Updated:** February 23, 2024  
**Maintained By:** Project Team  
**Questions?** Open an issue or contact the team
