# Project Structure Quick Reference

## Directory Overview

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `/admin-portal` | React admin web app | `package.json`, `vite.config.ts` |
| `/mobile-app` | React Native mobile app | `package.json`, `app.json`, `eas.json` |
| `/backend` | AWS Lambda backend API | `package.json`, `template.yaml`, `cdk.json` |
| `/shared` | Shared code across apps | Types, utils, constants |
| `/scripts` | Build & deployment scripts | PowerShell and bash scripts |
| `/docs` | Documentation | Markdown files |
| `/tests` | Integration tests | Test files |
| `/.github` | CI/CD workflows | GitHub Actions YAML |

## Application Directories

### Admin Portal (`/admin-portal`)
```
admin-portal/
├── src/
│   ├── api/              # API client
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   └── App.tsx
├── public/               # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Tech Stack:** React, TypeScript, Vite, TailwindCSS, React Router

**Commands:**
```bash
cd admin-portal
npm install
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm test             # Run tests
```

### Mobile App (`/mobile-app`)
```
mobile-app/
├── src/
│   ├── components/       # React Native components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation setup
│   ├── api/              # API client
│   └── constants/        # Constants
├── assets/               # Images, fonts
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json
```

**Tech Stack:** React Native, Expo, TypeScript, React Navigation

**Commands:**
```bash
cd mobile-app
npm install
npx expo start       # Start Expo dev server
npm test             # Run tests
eas build            # Build for app stores
```

### Backend (`/backend`)
```
backend/
├── src/
│   ├── auth/             # Authentication lambdas
│   ├── lambdas/          # Lambda functions
│   ├── layers/           # Lambda layers
│   ├── local-server/     # Local dev server
│   ├── models/           # Data models
│   ├── repositories/     # Data access
│   ├── services/         # Business logic
│   ├── state-management/ # State visibility
│   ├── temple-pricing/   # Pricing feature
│   └── utils/            # Utilities
├── infrastructure/       # CDK infrastructure
├── template.yaml         # SAM template
├── cdk.json             # CDK config
├── package.json
└── tsconfig.json
```

**Tech Stack:** AWS Lambda, TypeScript, DynamoDB, API Gateway

**Commands:**
```bash
cd backend
npm install
npm run build        # Build TypeScript
npm run start:local  # Start local server
npm test             # Run tests
npm run deploy       # Deploy to AWS
```

### Shared (`/shared`)
```
shared/
├── types/            # TypeScript interfaces
│   └── index.ts
├── utils/            # Utility functions
│   └── index.ts
└── constants/        # Shared constants
    └── index.ts
```

**Purpose:** Code shared across backend, admin-portal, and mobile-app

**Usage:**
```typescript
// In any app
import { TempleType } from '../shared/types';
import { formatDate } from '../shared/utils';
import { API_ENDPOINTS } from '../shared/constants';
```

## Root-Level Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration |
| `tsconfig.json` | Root TypeScript configuration |
| `docker-compose.yml` | LocalStack setup for local dev |
| `.gitignore` | Git ignore patterns |
| `.eslintrc.json` | ESLint configuration |
| `README.md` | Main project documentation |
| `CONTRIBUTING.md` | Contribution guidelines |
| `REORGANIZATION_GUIDE.md` | Structure migration guide |

## Common Commands

### Root Level (Workspace)
```bash
# Install all dependencies
npm install

# Build all apps
npm run build:all

# Test all apps
npm run test:all

# Start specific app
npm run dev:backend
npm run dev:admin
npm run dev:mobile
```

### Local Development
```bash
# 1. Start LocalStack
docker-compose up -d

# 2. Initialize database
.\scripts\init-local-db.ps1

# 3. Start backend
.\scripts\start-local-backend.ps1

# 4. Start admin portal
cd admin-portal && npm run dev

# 5. Start mobile app (optional)
cd mobile-app && npx expo start
```

## Import Path Patterns

### Backend to Backend
```typescript
// Within backend
import { TempleService } from './services/TempleService';
import { validateEnv } from './utils/env-validation';
```

### Backend to Shared
```typescript
// Backend using shared code
import { TempleType } from '../shared/types';
```

### Admin Portal to Shared
```typescript
// Admin portal using shared code
import { TempleType } from '../shared/types';
import { API_ENDPOINTS } from '../shared/constants';
```

### Mobile App to Shared
```typescript
// Mobile app using shared code
import { TempleType } from '../shared/types';
import { formatTempleData } from '../shared/utils';
```

## Environment Files

### Backend
- `/backend/.env.development` - Local development
- `/backend/.env.example` - Template

### Admin Portal
- `/admin-portal/.env.development` - Local development
- `/admin-portal/.env.production` - Production

### Mobile App
- `/mobile-app/.env.development` - Local development

### Root
- `.env.development` - Shared environment variables
- `.env.example` - Template

## Key Scripts

### Deployment
- `scripts/start-local-backend.ps1` - Start local backend server
- `scripts/init-local-db.ps1` - Initialize LocalStack database
- `scripts/start-local-integration.ps1` - Start full local stack

### Testing
- `scripts/run-all-tests.ps1` - Run all tests
- `scripts/test-backend.ps1` - Test backend only
- `scripts/test-admin-portal.ps1` - Test admin portal only
- `scripts/test-mobile-app.ps1` - Test mobile app only

### Utilities
- `scripts/cleanup-temp-files.ps1` - Clean temporary files
- `scripts/fix-temples-table.ps1` - Fix DynamoDB table

## Documentation Structure

```
docs/
├── getting-started/
│   ├── quick-start.md
│   ├── local-development.md
│   └── environment-setup.md
├── deployment/
│   ├── aws-deployment.md
│   └── aws-cost-breakdown.md
├── testing/
│   └── test-guide.md
├── features/
│   ├── temple-management.md
│   ├── pricing-calculator.md
│   └── state-management.md
└── api/
    └── backend-api.md
```

## Quick Navigation

- **Start developing?** → See [Quick Start](docs/getting-started/quick-start.md)
- **Deploy to AWS?** → See [AWS Deployment](docs/deployment/aws-deployment.md)
- **Run tests?** → See [Test Guide](docs/testing/test-guide.md)
- **Understand structure?** → See [REORGANIZATION_GUIDE.md](REORGANIZATION_GUIDE.md)
- **Contribute?** → See [CONTRIBUTING.md](CONTRIBUTING.md)

## Architecture at a Glance

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │    Admin    │     │   Shared    │
│     App     │────▶│   Portal    │◀────│    Code     │
└──────┬──────┘     └──────┬──────┘     └──────▲──────┘
       │                   │                    │
       └───────────┬───────┘                    │
                   │                            │
                   ▼                            │
           ┌───────────────┐                    │
           │  API Gateway  │                    │
           └───────┬───────┘                    │
                   │                            │
                   ▼                            │
           ┌───────────────┐                    │
           │    Backend    │────────────────────┘
           │   (Lambda)    │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │   DynamoDB    │
           └───────────────┘
```

## Monorepo Benefits

1. **Single Source of Truth** - All code in one place
2. **Shared Code** - Reuse types, utils, constants
3. **Atomic Commits** - Change multiple apps in one commit
4. **Consistent Tooling** - Same ESLint, Prettier, TypeScript config
5. **Easier Refactoring** - See all usages across apps
6. **Simplified CI/CD** - One pipeline for all apps

## Next Steps

1. Read [REORGANIZATION_GUIDE.md](REORGANIZATION_GUIDE.md) for migration details
2. Update import paths if needed
3. Update scripts to use new paths
4. Update CI/CD workflows
5. Test all applications
