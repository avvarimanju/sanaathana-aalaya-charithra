# Technology Stack

## Architecture

Monorepo structure with three main workspaces: admin-portal, mobile-app, backend

## Backend

- **Runtime**: Node.js 18+ (TypeScript) + Python (Lambda handlers)
- **Cloud**: AWS Serverless (Lambda, DynamoDB, API Gateway, S3, CloudFront)
- **AI Services**: Amazon Bedrock (content generation), Amazon Polly (TTS), Amazon Translate
- **Infrastructure**: AWS CDK, SAM (Serverless Application Model)
- **Local Dev**: Docker + LocalStack for DynamoDB
- **Testing**: Jest (TypeScript), pytest (Python), fast-check (property-based testing)
- **Key Libraries**: Zod (validation), Joi, uuid, razorpay

## Admin Portal

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Styling**: TailwindCSS (implied from structure)

## Mobile App

- **Framework**: React Native + Expo SDK 55
- **Platform**: iOS and Android
- **Testing**: Jest + React Native Testing Library
- **Build**: EAS Build, Gradle (Android)

## Common Commands

### Root Level (Monorepo)
```bash
npm run build:all          # Build all workspaces
npm run test:all           # Run all tests
npm run lint:all           # Lint all workspaces
npm run dev:backend        # Start backend server
npm run dev:admin          # Start admin portal
npm run dev:mobile         # Start mobile app
```

### Backend
```bash
cd backend
npm run build              # Compile TypeScript
npm test                   # Run Jest tests (sequential)
npm run test:coverage      # Generate coverage report
npm run cdk deploy         # Deploy to AWS
npm start                  # Start local server (port 4000)
```

### Admin Portal
```bash
cd admin-portal
npm run dev                # Start Vite dev server (port 5173)
npm run build              # Build for production
npm test                   # Run Jest tests
npm run type-check         # TypeScript validation
```

### Mobile App
```bash
cd mobile-app
npx expo start             # Start Expo dev server
npx expo start --tunnel    # Use tunnel for remote testing
npm test                   # Run Jest tests
```

## Development Environment

### Prerequisites
- Docker Desktop (for LocalStack)
- Node.js 18+
- npm 9+

### Quick Start
```powershell
.\scripts\start-dev-environment.ps1
```

This script:
1. Starts LocalStack container
2. Initializes DynamoDB tables
3. Starts backend API (port 4000)
4. Starts admin portal (port 5173)

### Important Startup Order
Backend server MUST start before admin portal to avoid connection errors. The startup script handles this automatically.

## Testing Strategy

- Backend: 118 tests (Jest + pytest)
- Admin Portal: 7 tests (Jest + React Testing Library)
- Mobile App: 6 tests (Jest + React Native Testing Library)
- Property-based testing with fast-check for correctness properties
