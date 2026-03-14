# Technology Stack

## Architecture
**Monorepo** with npm workspaces containing three main applications and shared infrastructure.

## Frontend Technologies

### Admin Portal
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript ESLint

### Mobile App
- **Framework**: React Native + Expo
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper
- **Testing**: Jest + React Native Testing Library
- **Platform**: Cross-platform (iOS/Android)

## Backend Technologies

### Core Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Architecture**: AWS Serverless (Lambda + API Gateway)
- **Database**: Amazon DynamoDB
- **Storage**: Amazon S3 + CloudFront

### AWS Services
- **Amazon Bedrock**: AI content generation
- **Amazon Polly**: Text-to-speech synthesis
- **Amazon Translate**: Language detection
- **Amazon Comprehend**: Text analysis
- **AWS CDK**: Infrastructure as Code

### Development Tools
- **Local Development**: LocalStack + Docker
- **API Framework**: Express.js (local server)
- **Testing**: Jest + AWS SDK Client Mock
- **Bundling**: esbuild
- **Validation**: Zod + Joi

## Common Commands

### Development Environment
```powershell
# Start complete development environment
.\scripts\start-dev-environment.ps1

# Start individual services
npm run dev:backend    # Backend API (port 4000)
npm run dev:admin      # Admin Portal (port 5173)
npm run dev:mobile     # Mobile App (Expo)
```

### Building
```powershell
# Build all workspaces
npm run build:all

# Build individual components
cd admin-portal && npm run build
cd backend && npm run build
cd mobile-app && npm run build
```

### Testing
```powershell
# Run all tests
npm run test:all

# Run workspace-specific tests
cd admin-portal && npm test
cd backend && npm test
cd mobile-app && npm test

# Coverage reports
npm run test:coverage
```

### Linting & Type Checking
```powershell
# Lint all workspaces
npm run lint:all

# Type check
cd admin-portal && npm run type-check
cd backend && tsc --noEmit
```

### Local Development Setup
```powershell
# Prerequisites: Docker Desktop must be running
# Initialize LocalStack and DynamoDB
.\scripts\init-local-db.ps1

# Start backend server
cd backend && npm start

# Start admin portal
cd admin-portal && npm run dev
```

## Key Dependencies

### Shared
- **zod**: Schema validation
- **uuid**: Unique identifier generation

### Backend Specific
- **AWS SDK v3**: All AWS service clients
- **express**: Local development server
- **cors**: Cross-origin resource sharing
- **joi**: Request validation

### Frontend Specific
- **axios**: HTTP client (mobile app)
- **react-router-dom**: SPA routing (admin portal)
- **@react-navigation**: Navigation (mobile app)

## Environment Requirements
- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **Docker Desktop**: Required for LocalStack
- **AWS CLI**: For deployment (optional for local dev)