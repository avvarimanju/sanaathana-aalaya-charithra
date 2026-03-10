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

```bash
cd backend
npm install
npm run build
npm run start:local
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
