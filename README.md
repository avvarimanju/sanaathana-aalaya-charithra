# 🏛️ Sanaathana Aalaya Charithra

**Eternal Temple History - AI-Powered Hindu Temple Heritage Platform**

> Preserving Hindu Temple Heritage Through AI

## Overview

AI-powered mobile platform providing immersive, multilingual content for Hindu temple visitors through QR code scanning. Built with AWS serverless architecture.

## Key Features

- QR code-based artifact identification
- AI-generated audio guides (Amazon Bedrock + Polly)
- 10+ Indian languages support
- Offline capability
- WCAG 2.1 AA accessibility
- Real-time Q&A with RAG system

## Architecture

**AWS Services:**
- Amazon Bedrock (AI content generation)
- Amazon Polly (Text-to-speech)
- AWS Lambda (Serverless compute)
- Amazon DynamoDB (Data storage)
- Amazon S3 + CloudFront (Content delivery)
- Amazon API Gateway (REST API)
- Amazon Translate (Language detection)

## Project Structure

```
sanaathana-aalaya-charithra/
├── infrastructure/          # AWS CDK infrastructure
├── src/
│   ├── lambdas/            # Lambda functions
│   ├── models/             # Data models
│   ├── repositories/       # Data access
│   └── services/           # Business logic
├── mobile-app/             # React Native app
├── scripts/                # Utility scripts
└── tests/                  # Unit tests
```

## Quick Start

### Prerequisites
- AWS Account
- Node.js 18+
- AWS CLI configured

### Deployment

```bash
# Install and deploy
npm install
npm run quick-deploy

# Or step by step
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

See [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed setup and API configuration.

## Temple Coverage

11 Hindu temples across 5 states with 23 artifacts:

**Andhra Pradesh:**
1. Lepakshi Temple
2. Tirumala Venkateswara Temple (TTD)
3. Sri Kalahasti Temple
4. Srisailam Temple

**Karnataka:**
5. Vidurashwatha Temple
6. Hampi Ruins
7. Halebidu Temple
8. Belur Temple

**Tamil Nadu:**
9. Thanjavur Brihadeeswarar Temple
10. Meenakshi Temple

**Maharashtra:**
11. Ellora Caves

**Madhya Pradesh:**
12. Khajuraho Temples

## Supported Languages

English, Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi

## Development

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT License

## Contact

Manjunath Venkata Avvari
- GitHub: [@avvarimanju](https://github.com/avvarimanju)
- Email: avvarimanju@gmail.com

---

*Preserving Hindu Temple Heritage Through AI*