# Environment Configuration

## Overview

The Admin Portal supports three environments with different configurations:

- **Development**: Local development with full testing features
- **Staging**: Pre-production testing environment
- **Production**: Live production environment with restricted features

## Environment Files

### `.env.development`
```env
VITE_ENV=development
VITE_API_BASE_URL=http://localhost:3000
```
- Used during local development
- All testing features enabled
- Can create mobile test users

### `.env.staging`
```env
VITE_ENV=staging
VITE_API_BASE_URL=https://staging-api.sanaathana-aalaya-charithra.com
```
- Used for staging/beta testing
- All testing features enabled
- Can create mobile test users for beta testers

### `.env.production`
```env
VITE_ENV=production
VITE_API_BASE_URL=https://api.sanaathana-aalaya-charithra.com
```
- Used for production deployment
- Testing features disabled
- Cannot manually create mobile users (they self-register)

## Feature Flags by Environment

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| Add Dashboard User | ✅ | ✅ | ✅ |
| Add Mobile User (Testing) | ✅ | ✅ | ❌ |
| View Mobile Users | ✅ | ✅ | ✅ |
| Suspend/Activate Users | ✅ | ✅ | ✅ |

## How It Works

### User Management Page

The "Add Mobile User (Testing)" button visibility is controlled by:

```typescript
const isProduction = import.meta.env.VITE_ENV === 'production' || import.meta.env.PROD;

{activeTab === 'mobile' && !isProduction && (
  <button onClick={() => setShowAddMobileModal(true)}>
    ➕ Add Mobile User (Testing)
  </button>
)}
```

### Why Hide in Production?

1. **Security**: Prevents unauthorized manual user creation
2. **Data Integrity**: Ensures all mobile users go through proper registration flow
3. **Audit Trail**: Self-registration provides better tracking
4. **Scalability**: Manual creation doesn't scale for thousands of users

## Running Different Environments

### Development
```bash
npm run dev
# Uses .env.development
```

### Staging Build
```bash
npm run build -- --mode staging
# Uses .env.staging
```

### Production Build
```bash
npm run build -- --mode production
# Uses .env.production
```

## Testing Workflow

### Development/Staging
1. Admin logs into dashboard
2. Goes to User Management → Mobile Users tab
3. Clicks "Add Mobile User (Testing)"
4. Creates test user with credentials
5. Test user logs into mobile app
6. Performs testing

### Production
1. User downloads mobile app
2. User self-registers through app
3. Admin can view/manage user in dashboard
4. Admin cannot manually create users

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ENV` | Environment name | `development`, `staging`, `production` |
| `VITE_API_BASE_URL` | Backend API URL | `https://api.charithra.org` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` |

## Deployment Checklist

### Staging Deployment
- [ ] Use `.env.staging` file
- [ ] Verify "Add Mobile User (Testing)" button is visible
- [ ] Test mobile user creation
- [ ] Verify staging API endpoint

### Production Deployment
- [ ] Use `.env.production` file
- [ ] Verify "Add Mobile User (Testing)" button is hidden
- [ ] Verify mobile users can self-register through app
- [ ] Verify production API endpoint
- [ ] Test admin user management still works

## Troubleshooting

### Button still showing in production?
Check that:
1. `.env.production` has `VITE_ENV=production`
2. Build was done with `--mode production`
3. Environment variable is being read correctly

### Button not showing in staging?
Check that:
1. `.env.staging` has `VITE_ENV=staging` (not `production`)
2. Build was done with `--mode staging`
3. Clear browser cache and rebuild

## Security Notes

- Never commit actual `.env` files with real credentials
- Use `.env.example` as template
- Store production secrets in secure vault (AWS Secrets Manager, etc.)
- Rotate credentials regularly
- Use different credentials for each environment
