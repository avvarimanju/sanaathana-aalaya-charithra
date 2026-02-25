# 🏛️ Sanaathana Aalaya Charithra

**Eternal Temple History - AI-Powered Hindu Temple Heritage Platform**

## Overview

Sanaathana Aalaya Charithra (Sanskrit/Telugu: "Eternal Temple History") is an AI-powered mobile platform that provides immersive, multilingual content for Hindu temple visitors through QR code scanning.

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+
- AWS CLI configured

### Deployment

```bash
# Install dependencies
npm install

# Deploy infrastructure
npm run quick-deploy

# Or step by step:
npm run build
npm run bundle
cdk deploy --all
npm run seed
```

### Mobile App

```bash
cd mobile-app
npm install
npm start
```

## Architecture

### AWS Services
- **Amazon Bedrock** - AI content generation
- **Amazon Polly** - Text-to-speech (10+ Indian languages)
- **AWS Lambda** - Serverless compute
- **Amazon DynamoDB** - Data storage
- **Amazon S3** - Content storage
- **Amazon CloudFront** - CDN
- **Amazon API Gateway** - REST API

### Key Features
- QR code-based artifact identification
- AI-generated audio guides
- 10+ Indian languages support
- Offline capability
- WCAG 2.1 AA accessibility

## Temple Coverage

Currently includes 11 Hindu temples across 5 states:

1. **Lepakshi Temple** (Andhra Pradesh)
2. **Tirumala Venkateswara Temple** (Andhra Pradesh)
3. **Sri Kalahasti Temple** (Andhra Pradesh)
4. **Vidurashwatha Temple** (Karnataka)
5. **Hampi Ruins** (Karnataka)
6. **Halebidu Temple** (Karnataka)
7. **Belur Temple** (Karnataka)
8. **Thanjavur Brihadeeswarar Temple** (Tamil Nadu)
9. **Meenakshi Temple** (Tamil Nadu)
10. **Ellora Caves** (Maharashtra)
11. **Khajuraho Temples** (Madhya Pradesh)

**Total**: 23 artifacts with QR codes

## API Endpoints

- `POST /qr` - Scan QR code
- `POST /content` - Generate content
- `GET /content/{artifactId}` - Get artifact content
- `POST /qa` - Ask question
- `GET /qa/{sessionId}` - Get Q&A history
- `POST /analytics` - Track analytics
- `GET /analytics` - Get analytics data
- `GET /health` - Health check

## Configuration

### Mobile App API Setup

After deployment, update `mobile-app/src/config/api.ts`:

```typescript
export const API_BASE_URL = 'https://your-api-gateway-url.execute-api.region.amazonaws.com/prod';
```

Get the URL from CloudFormation outputs:
```bash
aws cloudformation describe-stacks --stack-name SanaathanaAalayaCharithraStack --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' --output text
```

## Project Structure

```
sanaathana-aalaya-charithra/
├── infrastructure/          # AWS CDK infrastructure
│   ├── app.ts              # CDK app entry point
│   └── stacks/             # CDK stack definitions
├── src/
│   ├── lambdas/            # Lambda function handlers
│   ├── models/             # Data models
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   └── utils/              # Utilities
├── mobile-app/             # React Native mobile app
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── screens/        # UI screens
│   │   └── services/       # API services
│   └── App.tsx             # App entry point
├── scripts/                # Utility scripts
│   └── seed-data.ts        # Database seeding
├── tests/                  # Unit tests
└── package.json            # Dependencies
```

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
npm run test:coverage
```

### Lint
```bash
npm run lint
npm run lint:fix
```

### Local Development
```bash
npm run watch
```

## DynamoDB Tables

- `SanaathanaAalayaCharithra-HeritageSites` - Temple information
- `SanaathanaAalayaCharithra-Artifacts` - Artifact details
- `SanaathanaAalayaCharithra-UserSessions` - User sessions
- `SanaathanaAalayaCharithra-ContentCache` - Content cache
- `SanaathanaAalayaCharithra-Analytics` - Analytics data

## Lambda Functions

- `SanaathanaAalayaCharithra-QRProcessing` - QR code processing
- `SanaathanaAalayaCharithra-ContentGeneration` - AI content generation
- `SanaathanaAalayaCharithra-QAProcessing` - Q&A processing
- `SanaathanaAalayaCharithra-Analytics` - Analytics tracking

## Supported Languages

- English
- Hindi (हिंदी)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Kannada (ಕನ್ನಡ)
- Bengali (বাংলা)
- Marathi (मराठी)
- Gujarati (ગુજરાતી)
- Malayalam (മലയാളം)
- Punjabi (ਪੰਜਾਬੀ)

## Performance Targets

- Content delivery: < 3 seconds
- Audio generation: < 5 seconds
- Video streaming: < 2 seconds startup
- Offline access: < 500ms
- Concurrent users: 1000+

## Security

- Encryption at rest and in transit
- AWS WAF protection
- DDoS protection with AWS Shield
- Session-based tracking only
- No personal data storage without consent

## License

MIT License

## Contact

**Manjunath Venkata Avvari**
- GitHub: [@avvarimanju](https://github.com/avvarimanju)
- Email: avvarimanju@gmail.com

---

*Preserving Hindu Temple Heritage Through AI*
