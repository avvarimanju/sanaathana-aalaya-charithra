# 🏛️ Sanaathana Aalaya Charithra

**Eternal Temple History - AI-Powered Hindu Temple Heritage Platform**

> Preserving Hindu Temple Heritage Through AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)

## Overview

Sanaathana Aalaya Charithra is an AI-powered platform that provides immersive, multilingual content for Hindu temple visitors. The platform consists of a mobile app for visitors, an admin portal for temple management, and a serverless backend built on AWS.

### Key Features

- **QR Code Scanning** - Instant artifact identification and information
- **AI-Generated Content** - Rich historical and cultural content powered by Amazon Bedrock
- **Multilingual Audio Guides** - 10+ Indian languages with natural-sounding voices (Amazon Polly)
- **Interactive India Map** - Explore temples by state with visual navigation
- **Temple Management** - Comprehensive admin portal for temple and pricing management
- **State Visibility Control** - Dynamic state filtering for mobile app
- **Offline Capability** - Access content without internet connection
- **Accessibility** - WCAG 2.1 AA compliant
- **Real-time Q&A** - RAG-powered question answering system

## Architecture

### Technology Stack

**Backend:**
- AWS Lambda (Serverless compute)
- Amazon DynamoDB (NoSQL database)
- Amazon API Gateway (REST API)
- Amazon Bedrock (AI content generation)
- Amazon Polly (Text-to-speech)
- Amazon S3 + CloudFront (Content delivery)
- Amazon Translate (Language detection)

**Frontend:**
- React + TypeScript + Vite (Admin Portal)
- React Native + Expo (Mobile App)
- TailwindCSS (Styling)

**Infrastructure:**
- AWS CDK (Infrastructure as Code)
- Docker + LocalStack (Local development)
- GitHub Actions (CI/CD - optional)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
│                     Admin Portal (React)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (REST API)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Functions                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Temple     │  │   Pricing    │  │    State     │     │
│  │ Management   │  │ Calculator   │  │ Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB Tables                         │
│  Temples | Artifacts | Pricing | States | Access Control    │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Sanaathana-Aalaya-Charithra/
├── admin-portal/              # Admin web application (React + Vite)
│   ├── src/
│   │   ├── api/              # API client layer
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── mobile-app/                # Mobile application (React Native + Expo)
│   ├── src/
│   │   ├── components/       # React Native components
│   │   ├── screens/          # Screen components
│   │   ├── navigation/       # Navigation setup
│   │   └── api/              # API client
│   └── package.json
│
├── src/                       # Backend Lambda functions
│   ├── temple-pricing/       # Temple pricing service
│   │   ├── lambdas/          # Lambda handlers
│   │   └── types/            # TypeScript types
│   ├── state-management/     # State visibility service
│   ├── local-server/         # Local development server
│   └── shared/               # Shared utilities
│
├── infrastructure/            # AWS CDK infrastructure code
│   ├── lib/                  # CDK constructs
│   └── bin/                  # CDK app entry
│
├── scripts/                   # Utility scripts
│   ├── deployment/           # Deployment scripts
│   ├── development/          # Development scripts
│   └── testing/              # Test scripts
│
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
│
├── docs/                      # Documentation
│   ├── getting-started/      # Setup guides
│   ├── architecture/         # Architecture docs
│   ├── deployment/           # Deployment guides
│   ├── api/                  # API documentation
│   ├── features/             # Feature documentation
│   ├── testing/              # Testing guides
│   ├── mobile-app/           # Mobile app docs
│   └── admin-portal/         # Admin portal docs
│
├── config/                    # Configuration files
├── docker-compose.yml         # LocalStack setup
├── template.yaml              # SAM template
├── cdk.json                   # CDK configuration
└── package.json               # Root dependencies
```

## Quick Start

Get started in 5 minutes with local development:

### Prerequisites

- Docker Desktop (for LocalStack)
- Node.js 18+
- AWS CLI (for LocalStack interaction)
- Git

### 1. Start LocalStack

```powershell
docker-compose up -d
```

### 2. Initialize Database

```powershell
.\scripts\init-local-db.ps1
```

### 3. Start Backend Server

```powershell
.\scripts\start-local-backend.ps1
```

### 4. Start Admin Portal

```powershell
cd admin-portal
npm install
npm run dev
```

Open http://localhost:5173

### 5. Start Mobile App (Optional)

```powershell
cd mobile-app
npm install
npx expo start
```

Scan QR code with Expo Go app.

For detailed setup instructions, see [Quick Start Guide](docs/getting-started/quick-start.md).

## Documentation

### Getting Started

- [Quick Start](docs/getting-started/quick-start.md) - Get up and running in 5 minutes
- [Local Development](docs/getting-started/local-development.md) - Development workflow and best practices
- [Environment Setup](docs/getting-started/environment-setup.md) - Configure dev/staging/production

### Deployment

- [AWS Deployment](docs/deployment/aws-deployment.md) - Deploy to AWS (staging/production)
- [Mobile App Deployment](docs/mobile-app/deployment.md) - Deploy to App Stores
- [Admin Portal Deployment](docs/admin-portal/deployment.md) - Deploy to S3 + CloudFront

### API Documentation

- [Backend API Reference](docs/api/backend-api.md) - Complete API documentation
- [API Endpoints](docs/api/endpoints.md) - Endpoint specifications

### Features

- [Temple Management](docs/features/temple-management.md) - Temple CRUD operations
- [Pricing Calculator](docs/features/pricing-calculator.md) - Dynamic pricing system
- [State Management](docs/features/state-management.md) - State visibility control
- [Defect Tracking](docs/features/defect-tracking.md) - Issue reporting system

### Testing

- [Test Guide](docs/testing/test-guide.md) - Testing strategies and best practices
- [Test Coverage](docs/testing/test-coverage.md) - Current test coverage

### Architecture

- [System Overview](docs/architecture/system-overview.md) - High-level architecture
- [Infrastructure](docs/architecture/infrastructure.md) - AWS infrastructure details
- [Data Flow](docs/architecture/data-flow.md) - Data flow diagrams

## Temple Coverage

14 Hindu temples across 6 states with 45+ artifacts:

**Andhra Pradesh:**
- Lepakshi Temple
- Tirumala Temples (Main Temple Complex)
- Tirupathi Local Temples Tour
- Tirupathi Surrounding Temples Tour
- Sri Kalahasti Temple
- Srisailam Temple

**Karnataka:**
- Vidurashwatha Temple
- Hampi Ruins
- Halebidu Temple
- Belur Temple

**Tamil Nadu:**
- Thanjavur Brihadeeswarar Temple
- Meenakshi Temple

**Maharashtra:**
- Ellora Caves

**Madhya Pradesh:**
- Khajuraho Temples

## Supported Languages

English, Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi

## Development

### Build

```powershell
npm run build
```

### Test

```powershell
# Run all tests
npm test

# Run specific test suite
npm run test:backend
cd admin-portal && npm test
cd mobile-app && npm test
```

### Lint

```powershell
npm run lint
```

### Type Check

```powershell
npm run type-check
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

- **Backend:** 118 tests (Jest)
- **Admin Portal:** 7 tests (Jest + React Testing Library)
- **Mobile App:** 6 tests (Jest + React Native Testing Library)
- **Total:** 131 tests

See [Test Guide](docs/testing/test-guide.md) for details.

## Deployment

### Development

- **Cost:** $0/month (LocalStack)
- **Setup Time:** 5 minutes
- **Infrastructure:** Docker + LocalStack

### Staging

- **Cost:** ~$55/month
- **Setup Time:** 1-2 weeks
- **Infrastructure:** AWS (reduced capacity)

### Production

- **Cost:** ~$350/month
- **Setup Time:** 2-3 weeks
- **Infrastructure:** AWS (full capacity with monitoring)

See [AWS Deployment Guide](docs/deployment/aws-deployment.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

**Manjunath Venkata Avvari**
- GitHub: [@avvarimanju](https://github.com/avvarimanju)
- Email: avvarimanju@gmail.com

## Acknowledgments

- Amazon Web Services for serverless infrastructure
- Expo for React Native development platform
- All contributors who have helped shape this project

---

**Status:** Development Ready | Staging Deployable | Production Ready (pending AWS deployment)

*Preserving Hindu Temple Heritage Through AI*