# CI/CD Deployment Options

## 🎯 Two Deployment Approaches

You have two ways to deploy to AWS:

### **Option 1: Direct Deployment from Your Computer** (Simpler, Faster to Start)
### **Option 2: Automated CI/CD via GitHub Actions** (Professional, Safer)

---

## 📊 Comparison

| Aspect | Direct Deployment | GitHub Actions CI/CD |
|--------|------------------|---------------------|
| **Setup Time** | 5 minutes | 30 minutes |
| **Complexity** | Simple | Moderate |
| **Safety** | Manual checks | Automated checks |
| **Speed** | Immediate | 5-10 min delay |
| **Cost** | Free | Free (GitHub Actions) |
| **Team Collaboration** | Difficult | Easy |
| **Rollback** | Manual | Automated |
| **Best For** | Solo dev, MVP | Team, Production |

---

## 🚀 Option 1: Direct Deployment (Recommended for MVP)

### How It Works

```
Your Computer
    ↓
  git commit
    ↓
  git push → GitHub (code backup)
    ↓
npm run deploy:staging  ← You run this manually
    ↓
  AWS (Staging)
    ↓
  Test & Verify
    ↓
npm run deploy:prod  ← You run this manually
    ↓
  AWS (Production)
```

### Setup (5 Minutes)

1. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter region: ap-south-1  # Mumbai - recommended for Indian users
   ```

2. **Deploy to Staging**
   ```bash
   # From your computer
   npm run deploy:staging
   ```

3. **Deploy to Production**
   ```bash
   # From your computer
   npm run deploy:prod
   ```

### Workflow

```bash
# 1. Develop locally
npm run dev:local

# 2. Commit changes
git add .
git commit -m "Add new feature"
git push origin main

# 3. Deploy to staging (from your computer)
npm run deploy:staging

# 4. Test staging
npm run test:e2e:staging

# 5. Deploy to production (from your computer)
npm run deploy:prod
```

### Pros ✅
- **Simple**: No CI/CD setup needed
- **Fast**: Deploy immediately
- **Direct control**: You see everything
- **No secrets management**: AWS credentials on your computer
- **Good for MVP**: Quick iterations

### Cons ❌
- **Manual**: You must remember to deploy
- **No automation**: No automatic tests before deploy
- **Single point of failure**: Only you can deploy
- **No audit trail**: Hard to track who deployed what
- **Risky for production**: Easy to deploy wrong code

### When to Use
- ✅ Solo developer
- ✅ MVP/early stage
- ✅ Quick iterations
- ✅ Learning AWS/CDK
- ❌ Team of developers
- ❌ Production with real users

---

## 🤖 Option 2: GitHub Actions CI/CD (Recommended for Production)

### How It Works

```
Your Computer
    ↓
  git commit
    ↓
  git push → GitHub
    ↓
GitHub Actions (Automatic)
    ├─ Run Tests
    ├─ Build Code
    ├─ Deploy to Staging (automatic)
    └─ Deploy to Prod (manual approval)
    ↓
  AWS (Staging/Production)
```

### Setup (30 Minutes)

#### Step 1: Store AWS Credentials in GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (use `ap-south-1` for Mumbai - recommended for Indian users)

#### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main          # Auto-deploy to staging
      - production    # Deploy to production (with approval)
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '18'
  AWS_REGION: ${{ secrets.AWS_REGION }}

jobs:
  # Job 1: Run Tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test

      - name: Build TypeScript
        run: npm run build

  # Job 2: Deploy to Staging (Automatic on main branch)
  deploy-staging:
    name: Deploy to Staging
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://api-staging.charithra.org
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to Staging
        run: npm run deploy:staging

      - name: Run E2E tests
        run: npm run test:e2e:staging

      - name: Notify on success
        if: success()
        run: echo "✅ Staging deployment successful!"

      - name: Notify on failure
        if: failure()
        run: echo "❌ Staging deployment failed!"

  # Job 3: Deploy to Production (Manual approval required)
  deploy-production:
    name: Deploy to Production
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/production' && github.event_name == 'push'
    environment:
      name: production
      url: https://api.charithra.org
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to Production
        run: npm run deploy:prod

      - name: Run smoke tests
        run: npm run test:smoke:prod

      - name: Notify on success
        if: success()
        run: echo "✅ Production deployment successful!"

      - name: Notify on failure
        if: failure()
        run: echo "❌ Production deployment failed!"
```

#### Step 3: Configure Branch Protection

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

3. Add rule for `production` branch:
   - ✅ Require pull request reviews (2 reviewers)
   - ✅ Require status checks to pass
   - ✅ Require manual approval for deployment

#### Step 4: Set Up Environments

1. Go to Settings → Environments
2. Create `staging` environment:
   - No protection rules (auto-deploy)
3. Create `production` environment:
   - ✅ Required reviewers (add yourself)
   - ✅ Wait timer: 5 minutes

### Workflow

```bash
# 1. Develop locally
npm run dev:local

# 2. Create feature branch
git checkout -b feature/new-temple-ui

# 3. Make changes and commit
git add .
git commit -m "Add new temple UI"

# 4. Push to GitHub
git push origin feature/new-temple-ui

# 5. Create Pull Request on GitHub
# → GitHub Actions runs tests automatically

# 6. Merge PR to main
# → GitHub Actions automatically deploys to staging

# 7. Test staging
# → Visit staging URL and verify

# 8. Promote to production
git checkout production
git merge main
git push origin production
# → GitHub Actions asks for approval
# → You approve
# → Deploys to production
```

### Pros ✅
- **Automated**: No manual deployment
- **Safe**: Tests run before every deploy
- **Audit trail**: See who deployed what and when
- **Team-friendly**: Anyone can deploy
- **Rollback**: Easy to revert to previous version
- **Professional**: Industry standard

### Cons ❌
- **Setup time**: 30 minutes initial setup
- **Complexity**: More moving parts
- **Delay**: 5-10 minutes for deployment
- **Secrets management**: Need to configure GitHub secrets
- **Learning curve**: Need to understand GitHub Actions

### When to Use
- ✅ Team of developers
- ✅ Production with real users
- ✅ Need audit trail
- ✅ Want automated testing
- ✅ Professional deployment
- ❌ Solo dev learning
- ❌ Very early MVP

---

## 🎯 Recommended Approach

### Phase 1: MVP (Months 1-2)
**Use Option 1: Direct Deployment**

```bash
# Quick and simple
npm run deploy:staging
npm run deploy:prod
```

**Why:**
- Faster to start
- Simpler workflow
- Good for learning
- Fewer moving parts

### Phase 2: Growth (Month 3+)
**Switch to Option 2: GitHub Actions**

```bash
# Set up CI/CD
# Then just push to GitHub
git push origin main  # Auto-deploys to staging
```

**Why:**
- More users = need safety
- Team growth = need collaboration
- Production stability = need automation

---

## 🔄 Migration Path

### Moving from Option 1 to Option 2

1. **Keep using direct deployment** while setting up CI/CD
2. **Set up GitHub Actions** (30 minutes)
3. **Test CI/CD** with a small change
4. **Switch to CI/CD** for all deployments
5. **Remove AWS credentials** from your computer (optional)

**No downtime, smooth transition!**

---

## 📋 Quick Reference

### Option 1: Direct Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Rollback (redeploy previous version)
git checkout <previous-commit>
npm run deploy:prod
```

### Option 2: GitHub Actions

```bash
# Deploy to staging (automatic)
git push origin main

# Deploy to production (with approval)
git checkout production
git merge main
git push origin production
# → Go to GitHub Actions
# → Approve deployment
```

---

## 🆘 Troubleshooting

### Direct Deployment Issues

**Error: AWS credentials not configured**
```bash
aws configure
# Enter your credentials
```

**Error: CDK not bootstrapped**
```bash
cdk bootstrap
```

### GitHub Actions Issues

**Error: AWS credentials invalid**
- Check GitHub Secrets are correct
- Verify IAM permissions

**Error: Deployment failed**
- Check GitHub Actions logs
- Look for specific error message

**Deployment stuck on approval**
- Go to GitHub → Actions
- Click on workflow run
- Click "Review deployments"
- Approve

---

## 💡 Best Practices

### For Direct Deployment
1. Always test locally first
2. Deploy to staging before production
3. Keep a deployment log
4. Tag releases in Git
5. Have a rollback plan

### For GitHub Actions
1. Use branch protection
2. Require code reviews
3. Run tests before deploy
4. Use manual approval for production
5. Monitor deployment logs

---

## 🎓 Learning Resources

### Direct Deployment
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CLI Guide](https://docs.aws.amazon.com/cli/)

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Actions](https://github.com/aws-actions)
- [CI/CD Best Practices](https://docs.github.com/en/actions/deployment/about-deployments)

---

## ✅ Decision Matrix

Choose **Direct Deployment** if:
- [ ] Solo developer
- [ ] MVP/early stage
- [ ] Learning AWS
- [ ] Need quick iterations
- [ ] < 100 users

Choose **GitHub Actions** if:
- [ ] Team of 2+ developers
- [ ] Production with real users
- [ ] Need audit trail
- [ ] Want automated testing
- [ ] > 100 users

---

## 📊 Summary

| | Direct Deployment | GitHub Actions |
|---|---|---|
| **Setup** | 5 min | 30 min |
| **Deploy Speed** | Immediate | 5-10 min |
| **Safety** | Manual | Automated |
| **Cost** | Free | Free |
| **Best For** | MVP | Production |
| **Recommendation** | Start here | Migrate here |

**My Recommendation**: Start with **Direct Deployment** for MVP, then migrate to **GitHub Actions** when you have real users.

---

**Last Updated**: 2026-02-26
**Version**: 1.0.0
