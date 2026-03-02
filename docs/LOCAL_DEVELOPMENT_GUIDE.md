# Local Development Guide - Zero Cost Setup

## 🎯 Overview

Run the **complete application locally** at **$0 cost**:
- ✅ Admin Backend (temple/artifact management)
- ✅ Mobile App APIs (QR scanning, content, payments)
- ✅ Database (DynamoDB Local)
- ✅ Storage (S3 Local)
- ✅ Authentication (Cognito Local)

**No AWS charges during development!**

---

## 🏗️ Local Development Architecture

```
┌─────────────────────────────────────────────────────────┐
│              YOUR COMPUTER (Localhost)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Admin Portal (React)                       │    │
│  │  http://localhost:3000                         │    │
│  │  • Add/Edit Temples                            │    │
│  │  • Generate QR Codes                           │    │
│  │  • Manage Artifacts                            │    │
│  └────────────────────────────────────────────────┘    │
│                          ↓                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  Backend API (Express/Lambda Local)            │    │
│  │  http://localhost:4000                         │    │
│  │  • Temple APIs                                 │    │
│  │  • Artifact APIs                               │    │
│  │  • QR Processing                               │    │
│  │  • Content Generation                          │    │
│  └────────────────────────────────────────────────┘    │
│                          ↓                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  LocalStack (AWS Services Emulation)           │    │
│  │  http://localhost:4566                         │    │
│  │  • DynamoDB Local                              │    │
│  │  • S3 Local                                    │    │
│  │  • Lambda Local                                │    │
│  │  • Cognito Local                               │    │
│  └────────────────────────────────────────────────┘    │
│                          ↑                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  Mobile App (React Native/Flutter)             │    │
│  │  iOS Simulator / Android Emulator              │    │
│  │  • Browse Temples                              │    │
│  │  • Scan QR Codes                               │    │
│  │  • View Content                                │    │
│  │  • Test Payments                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘

Cost: $0 (Everything runs on your computer!)
```

---

## 📦 Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   node --version
   ```

2. **Docker Desktop**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Python 3.8+** (for LocalStack)
   ```bash
   python3 --version
   pip3 --version
   ```

4. **AWS CLI** (for local testing)
   ```bash
   aws --version
   ```

### Optional (for Mobile Development)

5. **React Native CLI** or **Expo**
   ```bash
   npx react-native --version
   ```

6. **Xcode** (for iOS) or **Android Studio** (for Android)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install LocalStack

```bash
# Install LocalStack
pip3 install localstack

# Install AWS CLI Local wrapper
pip3 install awscli-local

# Verify installation
localstack --version
```

### Step 2: Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd Sanaathana-Aalaya-Charithra

# Install dependencies
npm install

# Install Admin Portal dependencies
cd admin-portal
npm install
cd ..
```

### Step 3: Start Local Environment

```bash
# Start everything with one command
npm run dev:local
```

This starts:
- LocalStack (port 4566)
- Backend API (port 4000)
- Admin Portal (port 3000)

### Step 4: Access Applications

- **Admin Portal**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **LocalStack**: http://localhost:4566
- **Mobile App**: Configure to use `http://localhost:4000`

---

## 🔧 Detailed Setup

### 1. LocalStack Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    container_name: temple-localstack
    ports:
      - "4566:4566"            # LocalStack Gateway
      - "4510-4559:4510-4559"  # External services port range
    environment:
      - SERVICES=dynamodb,s3,lambda,cognito-idp,apigateway,cloudwatch
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack-data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - temple-network

networks:
  temple-network:
    driver: bridge
```

### 2. Start LocalStack

```bash
# Start LocalStack with Docker Compose
docker-compose up -d

# Verify LocalStack is running
curl http://localhost:4566/_localstack/health

# Check services
awslocal dynamodb list-tables
awslocal s3 ls
```

### 3. Initialize Local Database

Create `scripts/init-local-db.sh`:

```bash
#!/bin/bash

# Initialize local DynamoDB tables
echo "Creating local DynamoDB tables..."

# HeritageSites table
awslocal dynamodb create-table \
  --table-name local-HeritageSites \
  --attribute-definitions \
    AttributeName=siteId,AttributeType=S \
    AttributeName=name,AttributeType=S \
  --key-schema \
    AttributeName=siteId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=NameIndex,KeySchema=[{AttributeName=name,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# Artifacts table
awslocal dynamodb create-table \
  --table-name local-Artifacts \
  --attribute-definitions \
    AttributeName=artifactId,AttributeType=S \
    AttributeName=siteId,AttributeType=S \
    AttributeName=qrCodeId,AttributeType=S \
  --key-schema \
    AttributeName=artifactId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=SiteIndex,KeySchema=[{AttributeName=siteId,KeyType=HASH}],Projection={ProjectionType=ALL} \
    IndexName=QRCodeIndex,KeySchema=[{AttributeName=qrCodeId,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# TempleGroups table
awslocal dynamodb create-table \
  --table-name local-TempleGroups \
  --attribute-definitions \
    AttributeName=groupId,AttributeType=S \
  --key-schema \
    AttributeName=groupId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# PriceConfigurations table
awslocal dynamodb create-table \
  --table-name local-PriceConfigurations \
  --attribute-definitions \
    AttributeName=entityType,AttributeType=S \
    AttributeName=entityId,AttributeType=S \
  --key-schema \
    AttributeName=entityType,KeyType=HASH \
    AttributeName=entityId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Purchases table
awslocal dynamodb create-table \
  --table-name local-Purchases \
  --attribute-definitions \
    AttributeName=purchaseId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=purchaseId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=UserIndex,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# ContentCache table
awslocal dynamodb create-table \
  --table-name local-ContentCache \
  --attribute-definitions \
    AttributeName=cacheKey,AttributeType=S \
  --key-schema \
    AttributeName=cacheKey,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

echo "✓ All tables created successfully!"

# Create S3 buckets
echo "Creating local S3 buckets..."

awslocal s3 mb s3://local-temple-images
awslocal s3 mb s3://local-artifact-images
awslocal s3 mb s3://local-qr-codes
awslocal s3 mb s3://local-generated-content

echo "✓ All S3 buckets created successfully!"

# Create Cognito User Pool
echo "Creating local Cognito user pool..."

awslocal cognito-idp create-user-pool \
  --pool-name local-temple-users \
  --auto-verified-attributes email \
  --username-attributes email

echo "✓ Cognito user pool created successfully!"

echo ""
echo "🎉 Local environment initialized!"
echo ""
echo "Next steps:"
echo "1. Start backend: npm run dev:backend"
echo "2. Start Admin Portal: npm run dev:admin"
echo "3. Start mobile app: npm run dev:mobile"
```

Run initialization:

```bash
chmod +x scripts/init-local-db.sh
./scripts/init-local-db.sh
```

### 4. Backend API Configuration

Create `.env.local`:

```bash
# Environment
NODE_ENV=development
STAGE=local

# LocalStack Configuration
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=ap-south-1  # Mumbai region (matches production)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# DynamoDB Tables
HERITAGE_SITES_TABLE=local-HeritageSites
ARTIFACTS_TABLE=local-Artifacts
TEMPLE_GROUPS_TABLE=local-TempleGroups
PRICE_CONFIGURATIONS_TABLE=local-PriceConfigurations
PURCHASES_TABLE=local-Purchases
CONTENT_CACHE_TABLE=local-ContentCache

# S3 Buckets
TEMPLE_IMAGES_BUCKET=local-temple-images
ARTIFACT_IMAGES_BUCKET=local-artifact-images
QR_CODES_BUCKET=local-qr-codes
GENERATED_CONTENT_BUCKET=local-generated-content

# API Configuration
API_PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Cognito (Local)
USER_POOL_ID=local-user-pool
USER_POOL_CLIENT_ID=local-client-id

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret

# Bedrock (Mock - no actual calls)
BEDROCK_MODEL=mock
BEDROCK_ENABLED=false

# Polly (Mock - no actual calls)
POLLY_ENABLED=false

# Logging
LOG_LEVEL=debug
```

### 5. Start Backend API

Create `src/local-server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const app = express();
const PORT = process.env.API_PORT || 4000;

// Configure AWS clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_REGION || 'ap-south-1',  // Mumbai region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_REGION || 'ap-south-1',  // Mumbai region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for LocalStack
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: 'local' });
});

// Import and mount routes
import templeRoutes from './routes/temples';
import artifactRoutes from './routes/artifacts';
import qrRoutes from './routes/qr';
import contentRoutes from './routes/content';
import paymentRoutes from './routes/payments';

app.use('/api/temples', templeRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/payments', paymentRoutes);

// Admin routes
import adminTempleRoutes from './routes/admin/temples';
import adminArtifactRoutes from './routes/admin/artifacts';

app.use('/api/admin/temples', adminTempleRoutes);
app.use('/api/admin/artifacts', adminArtifactRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔧 LocalStack: ${process.env.AWS_ENDPOINT_URL}`);
  console.log(`📱 Mobile API: http://localhost:${PORT}/api`);
  console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin`);
});
```

Start backend:

```bash
npm run dev:backend
```

### 6. Admin Portal Configuration

Create `admin-portal/.env.local`:

```bash
REACT_APP_API_URL=http://localhost:4000/api/admin
REACT_APP_MOBILE_API_URL=http://localhost:4000/api
REACT_APP_ENVIRONMENT=local
```

Start Admin Portal:

```bash
cd admin-portal
npm run start
```

Access at: http://localhost:3000

### 7. Mobile App Configuration

**React Native** (`mobile-app/config/env.local.ts`):

```typescript
export const ENV_CONFIG = {
  apiUrl: 'http://localhost:4000/api',
  environment: 'local',
  userPoolId: 'local-user-pool',
  userPoolClientId: 'local-client-id',
  region: 'ap-south-1',  // Mumbai region (matches production)
  razorpayKeyId: 'rzp_test_xxx',
};
```

**Flutter** (`mobile-app/lib/config/env_local.dart`):

```dart
class EnvConfig {
  static const String apiUrl = 'http://localhost:4000/api';
  static const String environment = 'local';
  static const String userPoolId = 'local-user-pool';
  static const String userPoolClientId = 'local-client-id';
  static const String region = 'ap-south-1';  // Mumbai region (matches production)
  static const String razorpayKeyId = 'rzp_test_xxx';
}
```

Start mobile app:

```bash
# React Native
cd mobile-app
npm run ios    # or npm run android

# Flutter
cd mobile-app
flutter run
```

---

## 📋 NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev:local": "concurrently \"npm run dev:localstack\" \"npm run dev:backend\" \"npm run dev:admin\"",
    "dev:localstack": "docker-compose up",
    "dev:backend": "nodemon --exec ts-node src/local-server.ts",
    "dev:admin": "cd admin-portal && npm start",
    "dev:mobile": "cd mobile-app && npm run ios",
    
    "init:local": "bash scripts/init-local-db.sh",
    "seed:local": "ts-node scripts/seed-local-data.ts",
    "reset:local": "docker-compose down -v && npm run init:local",
    
    "test:local": "jest --config jest.local.config.js",
    "logs:local": "docker-compose logs -f localstack"
  }
}
```

---

## 🌱 Seed Test Data

Create `scripts/seed-local-data.ts`:

```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:4566',
  region: 'ap-south-1',  // Mumbai region (matches production)
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

async function seedData() {
  console.log('🌱 Seeding local database...');

  // Seed temples
  const temples = [
    {
      siteId: 'temple-1',
      name: 'Brihadeeswarar Temple',
      location: 'Thanjavur, Tamil Nadu',
      description: 'UNESCO World Heritage Site',
      images: ['temple1-1.jpg', 'temple1-2.jpg'],
      status: 'active',
    },
    {
      siteId: 'temple-2',
      name: 'Meenakshi Temple',
      location: 'Madurai, Tamil Nadu',
      description: 'Historic Hindu temple',
      images: ['temple2-1.jpg'],
      status: 'active',
    },
  ];

  for (const temple of temples) {
    await client.send(new PutItemCommand({
      TableName: 'local-HeritageSites',
      Item: {
        siteId: { S: temple.siteId },
        name: { S: temple.name },
        location: { S: temple.location },
        description: { S: temple.description },
        images: { L: temple.images.map(img => ({ S: img })) },
        status: { S: temple.status },
      },
    }));
    console.log(`✓ Created temple: ${temple.name}`);
  }

  // Seed artifacts
  const artifacts = [
    {
      artifactId: 'artifact-1',
      siteId: 'temple-1',
      name: 'Main Deity Sculpture',
      qrCodeId: 'QR001',
      description: 'Ancient sculpture from 11th century',
      status: 'active',
    },
    {
      artifactId: 'artifact-2',
      siteId: 'temple-1',
      name: 'Temple Bell',
      qrCodeId: 'QR002',
      description: 'Bronze bell with inscriptions',
      status: 'active',
    },
  ];

  for (const artifact of artifacts) {
    await client.send(new PutItemCommand({
      TableName: 'local-Artifacts',
      Item: {
        artifactId: { S: artifact.artifactId },
        siteId: { S: artifact.siteId },
        name: { S: artifact.name },
        qrCodeId: { S: artifact.qrCodeId },
        description: { S: artifact.description },
        status: { S: artifact.status },
      },
    }));
    console.log(`✓ Created artifact: ${artifact.name}`);
  }

  console.log('🎉 Seeding completed!');
}

seedData().catch(console.error);
```

Run seeding:

```bash
npm run seed:local
```

---

## 🧪 Testing Locally

### Test Admin Portal

1. Open http://localhost:3000
2. Add a new temple
3. Upload temple images
4. Add artifacts to the temple
5. Generate QR codes
6. Set pricing

### Test Mobile App

1. Start mobile app (iOS/Android simulator)
2. Browse temples
3. Scan QR code (use generated QR from admin)
4. View artifact content
5. Test payment flow (mock)

### Test APIs with curl

```bash
# Health check
curl http://localhost:4000/health

# Get temples
curl http://localhost:4000/api/temples

# Get specific temple
curl http://localhost:4000/api/temples/temple-1

# Create temple (admin)
curl -X POST http://localhost:4000/api/admin/temples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Temple",
    "location": "Test Location",
    "description": "Test Description"
  }'
```

---

## 🔄 Development Workflow

### Daily Workflow

```bash
# Morning: Start local environment
npm run dev:local

# Work on features
# - Edit code
# - Test in Admin Portal
# - Test in mobile app
# - Hot reload works automatically

# Evening: Stop environment
docker-compose down
```

### Reset Environment

```bash
# Complete reset (deletes all data)
npm run reset:local

# Reseed data
npm run seed:local
```

---

## 💡 Tips & Tricks

### 1. Mock External Services

For services that cost money (Bedrock, Polly), use mocks:

```typescript
// src/services/bedrock-mock.ts
export class BedrockMock {
  async generateContent(prompt: string): Promise<string> {
    return `Mock content for: ${prompt}`;
  }
}

// Use in local development
const bedrock = process.env.NODE_ENV === 'development' 
  ? new BedrockMock()
  : new BedrockClient();
```

### 2. Fast Iteration

```bash
# Use nodemon for auto-restart
npm install --save-dev nodemon

# Watch mode for TypeScript
npm run dev:backend -- --watch
```

### 3. Debug with VS Code

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:backend"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 🆘 Troubleshooting

### LocalStack not starting

```bash
# Check Docker
docker ps

# Restart LocalStack
docker-compose restart localstack

# Check logs
docker-compose logs localstack
```

### Port already in use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Mobile app can't connect

For iOS Simulator, use `localhost`.
For Android Emulator, use `10.0.2.2` instead of `localhost`:

```typescript
const apiUrl = Platform.OS === 'android' 
  ? 'http://10.0.2.2:4000/api'
  : 'http://localhost:4000/api';
```

---

## ✅ Summary

**What You Can Do Locally (Free):**
- ✅ Develop Admin Portal
- ✅ Test mobile app
- ✅ Add/edit temples and artifacts
- ✅ Generate QR codes
- ✅ Test all APIs
- ✅ Debug with full stack traces
- ✅ Fast iteration (hot reload)

**What Requires AWS (Costs Money):**
- ❌ Real Bedrock AI generation
- ❌ Real Polly text-to-speech
- ❌ Real Razorpay payments
- ❌ Production data

**Cost**: $0 for local development!

---

**Last Updated**: 2026-02-26
**Version**: 1.0.0
