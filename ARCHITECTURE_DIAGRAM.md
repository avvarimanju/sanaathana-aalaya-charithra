# System Architecture Diagram

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│       Admin Portal              │     │         Mobile App              │
│     (Web Frontend)              │     │      (React Native)             │
│                                 │     │                                 │
│     Port: 5173                  │     │     Port: 8081                  │
│     Tech: React/Vite            │     │     Tech: Expo/RN               │
│                                 │     │     (Metro Bundler)             │
└────────────────┬────────────────┘     └────────────────┬────────────────┘
                 │                                       │
                 │                                       │
                 └───────────────┬───────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────────┐
                 │      Backend API Server               │
                 │         (REST APIs)                   │
                 │                                       │
                 │     Port: 4000                        │
                 │     Tech: Express/Node.js             │
                 │     NOT in Docker                     │
                 └───────────────┬───────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────────┐
                 │     LocalStack (Docker)               │
                 │                                       │
                 │     Port: 4566                        │
                 │     Services:                         │
                 │       • DynamoDB (Database)           │
                 │       • S3 (File Storage)             │
                 └───────────────────────────────────────┘
```

## Component Details

### Admin Portal
- **Type:** Web Frontend
- **Framework:** React + TypeScript + Vite
- **Port:** 5173
- **Location:** `/admin-portal`
- **Purpose:** Temple and content management interface
- **Features:**
  - Temple CRUD operations
  - Pricing management
  - State visibility control
  - Content management

### Mobile App
- **Type:** Mobile Application
- **Framework:** React Native + Expo
- **Port:** 8081 (Metro Bundler)
- **Location:** `/mobile-app`
- **Purpose:** Visitor-facing temple exploration app
- **Features:**
  - QR code scanning
  - Temple browsing
  - India map navigation
  - Multilingual content
  - Audio guides

### Backend API Server
- **Type:** REST API Server
- **Framework:** Express.js + Node.js + TypeScript
- **Port:** 4000
- **Location:** `/backend`
- **Environment:** Local development (NOT in Docker)
- **Purpose:** Business logic and API endpoints
- **Features:**
  - Authentication
  - Temple management APIs
  - Pricing calculator
  - State management
  - Content generation integration

### LocalStack (Docker)
- **Type:** AWS Service Emulator
- **Port:** 4566
- **Environment:** Docker container
- **Purpose:** Local AWS services for development
- **Services:**
  - **DynamoDB:** NoSQL database for temples, artifacts, pricing
  - **S3:** File storage for images and media
  - **API Gateway:** (Optional) API routing
  - **Lambda:** (Optional) Serverless functions

## Data Flow

```
User Action (Admin Portal / Mobile App)
    ↓
HTTP Request (REST API)
    ↓
Backend API Server (Port 4000)
    ↓
Business Logic Processing
    ↓
LocalStack Services (Port 4566)
    ↓
DynamoDB / S3
    ↓
Response back through chain
```

## Network Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Admin Portal | 5173 | HTTP | Web UI |
| Mobile App | 8081 | HTTP | Metro Bundler |
| Backend API | 4000 | HTTP | REST API |
| LocalStack | 4566 | HTTP | AWS Services |

## Technology Stack Summary

### Frontend Technologies
- **Admin Portal:** React, TypeScript, Vite, TailwindCSS, React Router
- **Mobile App:** React Native, Expo, TypeScript, React Navigation

### Backend Technologies
- **API Server:** Express.js, Node.js, TypeScript
- **Database:** DynamoDB (via LocalStack)
- **Storage:** S3 (via LocalStack)
- **Authentication:** JWT tokens

### Development Tools
- **Docker:** LocalStack container
- **Package Manager:** npm
- **Build Tools:** Vite (admin), Metro (mobile), TypeScript compiler (backend)

## Environment Configuration

### Admin Portal
```bash
VITE_API_URL=http://localhost:4000
```

### Mobile App
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000
```

### Backend API
```bash
PORT=4000
AWS_ENDPOINT=http://localhost:4566
DYNAMODB_ENDPOINT=http://localhost:4566
S3_ENDPOINT=http://localhost:4566
```

### LocalStack
```bash
SERVICES=dynamodb,s3
PORT=4566
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│       Admin Portal              │     │         Mobile App              │
│   (S3 + CloudFront CDN)         │     │    (iOS App Store /             │
│                                 │     │     Google Play Store)          │
└────────────────┬────────────────┘     └────────────────┬────────────────┘
                 │                                       │
                 │                                       │
                 └───────────────┬───────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────────┐
                 │      API Gateway (AWS)                │
                 └───────────────┬───────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────────┐
                 │      Lambda Functions (AWS)           │
                 │   • Temple Management                 │
                 │   • Pricing Calculator                │
                 │   • State Management                  │
                 │   • Authentication                    │
                 └───────────────┬───────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────────┐
                 │      AWS Services                     │
                 │   • DynamoDB (Database)               │
                 │   • S3 (Storage)                      │
                 │   • Bedrock (AI)                      │
                 │   • Polly (Text-to-Speech)            │
                 └───────────────────────────────────────┘
```

## Quick Start Commands

### Start All Services

```bash
# 1. Start LocalStack
docker-compose up -d

# 2. Initialize Database
.\scripts\init-local-db.ps1

# 3. Start Backend (Terminal 1)
cd backend
npm install
npm run start:local

# 4. Start Admin Portal (Terminal 2)
cd admin-portal
npm install
npm run dev

# 5. Start Mobile App (Terminal 3)
cd mobile-app
npm install
npx expo start
```

### Access URLs

- **Admin Portal:** http://localhost:5173
- **Mobile App:** Scan QR code with Expo Go
- **Backend API:** http://localhost:4000
- **LocalStack:** http://localhost:4566

## Architecture Benefits

1. **Separation of Concerns:** Clear boundaries between frontend, backend, and data layers
2. **Local Development:** Full AWS stack locally via LocalStack
3. **Scalability:** Easy to scale each component independently
4. **Maintainability:** Monorepo structure with clear organization
5. **Flexibility:** Can deploy to different environments (local, staging, production)
6. **Cost-Effective:** Free local development with LocalStack

## Security Considerations

### Local Development
- No authentication required
- Open ports on localhost only
- Mock AWS credentials

### Production
- JWT-based authentication
- API Gateway with throttling
- IAM roles for Lambda functions
- Encrypted data at rest (DynamoDB)
- HTTPS only
- CORS configuration

## Monitoring & Logging

### Local Development
- Console logs
- LocalStack logs: `docker-compose logs -f`
- Backend logs: Terminal output

### Production
- CloudWatch Logs
- CloudWatch Metrics
- X-Ray tracing
- Custom dashboards

## Related Documentation

- [Quick Start Guide](docs/getting-started/quick-start.md)
- [Local Development](docs/getting-started/local-development.md)
- [AWS Deployment](docs/deployment/aws-deployment.md)
- [API Documentation](docs/api/backend-api.md)
