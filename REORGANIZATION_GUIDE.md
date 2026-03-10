# Project Reorganization Guide

## Overview

The project has been reorganized into a clean monorepo structure following industry best practices.

## New Structure

```
Sanaathana-Aalaya-Charithra/
├── .github/                # CI/CD workflows
├── .kiro/                  # Kiro configuration
├── admin-portal/           # React admin application
├── mobile-app/             # React Native mobile app
├── backend/                # AWS Lambda backend API
│   ├── src/               # Backend source code
│   ├── infrastructure/    # CloudFormation/CDK
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # Shared code across apps
│   ├── types/
│   ├── utils/
│   └── constants/
├── scripts/                # Build and deployment scripts
├── docs/                   # Documentation
├── config/                 # Configuration files
├── data/                   # Data files
├── tests/                  # Integration tests
├── package.json            # Root workspace config
├── tsconfig.json           # Root TypeScript config
└── README.md
```

## What Changed

### Backend (NEW)
- **Old**: Code was in `/src`
- **New**: Code is now in `/backend/src`
- All backend-related files moved to `/backend/`:
  - Source code from `/src`
  - Infrastructure from `/infrastructure`
  - `template.yaml`, `cdk.json`
  - `package_backend.json` → `backend/package.json`
  - Backend-specific `.env` files

### Shared (NEW)
- **New directory**: `/shared`
- Purpose: Code shared across backend, admin-portal, and mobile-app
- Structure:
  - `/shared/types` - TypeScript interfaces and types
  - `/shared/utils` - Utility functions
  - `/shared/constants` - Shared constants

### Admin Portal (UNCHANGED)
- Location: `/admin-portal`
- No changes to internal structure

### Mobile App (UNCHANGED)
- Location: `/mobile-app`
- No changes to internal structure

## Migration Steps

### 1. Update Import Paths

#### Backend Code
If you have imports like:
```typescript
// OLD
import { something } from '../utils/helper';
```

They should still work since the internal structure is preserved.

#### Admin Portal
To use shared code:
```typescript
// NEW
import { TempleType } from '../shared/types';
```

#### Mobile App
To use shared code:
```typescript
// NEW
import { formatDate } from '../shared/utils';
```

### 2. Update Scripts

Scripts in `/scripts` may need path updates:

```powershell
# OLD
cd src
npm run build

# NEW
cd backend
npm run build
```

### 3. Update CI/CD Workflows

Update `.github/workflows/*.yml`:

```yaml
# OLD
- name: Build Backend
  run: |
    npm install
    npm run build

# NEW
- name: Build Backend
  working-directory: ./backend
  run: |
    npm install
    npm run build
```

### 4. Update Environment Variables

Backend environment files are now in `/backend/`:
- `/backend/.env.development`
- `/backend/.env.example`

### 5. Update Documentation References

Search and update any documentation that references:
- `/src` → `/backend/src`
- `/infrastructure` → `/backend/infrastructure`

## Benefits of New Structure

### 1. Clear Separation
- Each application has its own directory
- Backend, admin, and mobile are clearly separated
- Shared code is explicit and centralized

### 2. Better Build/Deploy
- Each app can be built independently
- Clearer CI/CD pipeline configuration
- Easier to set up workspace-based builds

### 3. Easier Onboarding
- New developers can quickly understand structure
- Clear boundaries between applications
- Obvious where to add new code

### 4. Scalability
- Easy to add new applications
- Shared code prevents duplication
- Monorepo benefits without the mess

## Next Steps

### Immediate Actions
1. ✅ Backend code moved to `/backend`
2. ✅ Shared directory created
3. ⏳ Update import paths (as needed)
4. ⏳ Update scripts in `/scripts`
5. ⏳ Update CI/CD workflows
6. ⏳ Test all applications

### Future Enhancements
1. Set up workspace configuration in root `package.json`
2. Move common types to `/shared/types`
3. Move common utilities to `/shared/utils`
4. Set up shared ESLint/Prettier configs
5. Create shared testing utilities

## Workspace Configuration (Optional)

To enable npm/yarn/pnpm workspaces, update root `package.json`:

```json
{
  "name": "sanaathana-aalaya-charithra",
  "private": true,
  "workspaces": [
    "admin-portal",
    "mobile-app",
    "backend"
  ],
  "scripts": {
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces",
    "clean": "npm run clean --workspaces"
  }
}
```

## Troubleshooting

### Import Errors
If you see import errors:
1. Check the path is correct relative to new structure
2. Ensure TypeScript paths are configured
3. Run `npm install` in the affected directory

### Build Failures
1. Verify all dependencies are installed
2. Check environment variables are in correct location
3. Update any hardcoded paths in build scripts

### CI/CD Issues
1. Update `working-directory` in workflow files
2. Verify paths in deployment scripts
3. Check environment variable references

## Questions?

Refer to:
- `/backend/README.md` - Backend-specific docs
- `/shared/README.md` - Shared code guidelines
- `/admin-portal/README.md` - Admin portal docs
- `/mobile-app/README.md` - Mobile app docs
