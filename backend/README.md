# Backend API

This directory contains the AWS Lambda-based backend API for Sanaathana Aalaya Charithra.

## Structure

```
backend/
├── auth/                  # Authentication lambdas
├── lambdas/               # Lambda functions
├── layers/                # Lambda layers
├── local-server/          # Local development server (also in src/)
├── models/                # Data models
├── repositories/          # Data access layer
├── services/              # Business logic
├── state-management/      # State management lambdas
├── temple-pricing/        # Temple pricing feature
├── utils/                 # Utility functions
├── infrastructure/        # CloudFormation/CDK infrastructure
├── template.yaml          # SAM template
├── cdk.json              # CDK configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

**Note:** The backend code is currently at the root of the `/backend` directory. The original `/src` structure has been preserved to maintain existing import paths.

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured
- **AWS SAM CLI** (required for local development)
  - Install from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
  - Verify: `sam --version`

### Installation

```bash
# From project root (workspace installation)
cd Sanaathana-Aalaya-Charithra
npm install --legacy-peer-deps

# Or use the automated deployment script (recommended)
.\scripts\start-dev-environment.ps1
```

### Local Development

```bash
# From project root
npm run dev:backend

# Or directly from backend directory
cd backend
npm run local:start
```

This starts the API locally using AWS SAM at `http://localhost:3000`

### Building

```bash
cd backend
npm run build
```

## Environment Variables

Copy `.env.example` to `.env.development` and configure:
- AWS credentials
- Database connection strings
- API endpoints

## Deployment

```bash
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```

## Testing

```bash
npm test
npm run test:integration
```
