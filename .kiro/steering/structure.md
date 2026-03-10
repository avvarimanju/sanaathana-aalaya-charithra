# Project Structure

## Monorepo Organization

Root workspace with three main applications plus shared infrastructure.

```
Sanaathana-Aalaya-Charithra/
├── admin-portal/          # React admin web app
├── mobile-app/            # React Native mobile app
├── backend/               # AWS Lambda backend
├── scripts/               # Build and deployment scripts
├── docs/                  # Documentation
└── package.json           # Root workspace config
```

## Backend Structure

```
backend/
├── src/
│   ├── local-server/      # Local development server
│   └── types/             # TypeScript type definitions
├── lambdas/               # Lambda function handlers
├── services/              # Business logic services
├── repositories/          # Data access layer
├── models/                # Data models and types
├── utils/                 # Utility functions
├── infrastructure/        # AWS CDK infrastructure code
├── tests/                 # Integration tests
├── admin/                 # Admin-specific handlers
├── auth/                  # Authentication services
├── dashboard/             # Dashboard backend
├── defect-tracking/       # Defect tracking system
├── state-management/      # State visibility service
├── temple-pricing/        # Pricing calculator service
├── pre-generation/        # Content pre-generation CLI
└── template.yaml          # SAM template
```

### Key Backend Patterns

- **Layered Architecture**: Handlers → Services → Repositories
- **Feature Modules**: Self-contained features (temple-pricing, state-management, defect-tracking)
- **Shared Utilities**: Common AWS clients, validation, logging in utils/
- **Infrastructure as Code**: AWS CDK in infrastructure/

## Admin Portal Structure

```
admin-portal/
├── src/
│   ├── api/              # API client layer
│   ├── components/       # Reusable React components
│   ├── pages/            # Page-level components
│   └── types/            # TypeScript interfaces
├── coverage/             # Test coverage reports
└── package.json
```

### Admin Portal Patterns

- **API Layer**: Centralized API calls in src/api/
- **Component-Based**: Reusable components in src/components/
- **Type Safety**: Shared types in src/types/

## Mobile App Structure

```
mobile-app/
├── src/
│   ├── components/       # React Native components
│   ├── screens/          # Screen components
│   ├── services/         # API and business logic
│   ├── state/            # State management
│   ├── config/           # Configuration
│   ├── constants/        # App constants
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
├── android/              # Android native code
└── app.json              # Expo configuration
```

### Mobile App Patterns

- **Screen-Based Navigation**: Screens in src/screens/
- **Service Layer**: API calls and business logic in src/services/
- **State Management**: Centralized state in src/state/
- **Platform-Specific**: Native code in android/ folder

## Shared Conventions

### File Naming
- TypeScript files: kebab-case (e.g., `temple-pricing.ts`)
- React components: PascalCase (e.g., `TempleCard.tsx`)
- Test files: `*.test.ts` or `*.spec.ts`
- Config files: lowercase with dots (e.g., `jest.config.js`)

### Import Patterns
- Absolute imports with `@/` alias in admin portal
- Relative imports in backend and mobile app
- Index files for clean exports

### Environment Configuration
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env.example` - Template for required variables

## Documentation Location

- Feature docs: `docs/features/`
- API docs: `docs/api/`
- Deployment guides: `docs/deployment/`
- Architecture: `docs/architecture/`
- Getting started: `docs/getting-started/`

## Spec Files

Spec-driven development files in `.kiro/specs/{feature-name}/`:
- `requirements.md` or `bugfix.md` - Requirements/bug description
- `design.md` - Technical design
- `tasks.md` - Implementation tasks
- `.config.kiro` - Spec metadata

## Testing Organization

- Backend: `backend/tests/` and co-located `*.test.ts` files
- Admin Portal: Co-located `*.test.tsx` files
- Mobile App: Co-located `*.test.tsx` files
- Test utilities: `setupTests.ts` or `jest-setup.js`
