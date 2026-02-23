#!/bin/bash

# Test API Script for AvvarI for Bharat
# This script tests all API endpoints to verify the backend is working

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing AvvarI API Endpoints"
echo "================================"
echo ""

# Get API URL from CloudFormation stack
echo "📡 Getting API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name AvvarIForBharatStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
  echo -e "${RED}❌ Could not find API Gateway URL${NC}"
  echo "   Make sure the stack is deployed: npm run deploy"
  exit 1
fi

echo -e "${GREEN}✅ API URL: $API_URL${NC}"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s "${API_URL}health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: QR Code Scan
echo "2️⃣  Testing QR Scan Endpoint..."
QR_RESPONSE=$(curl -s -X POST "${API_URL}qr" \
  -H "Content-Type: application/json" \
  -d '{"qrData": "HM-TEMPLE-001"}')

if echo "$QR_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ QR scan test passed${NC}"
  echo "   Artifact: $(echo $QR_RESPONSE | grep -o '"name":"[^"]*"' | head -1)"
else
  echo -e "${YELLOW}⚠️  QR scan test returned error (expected if data not seeded)${NC}"
  echo "   Run: npm run seed"
fi
echo ""

# Test 3: Content Generation
echo "3️⃣  Testing Content Generation Endpoint..."
CONTENT_RESPONSE=$(curl -s -X POST "${API_URL}content" \
  -H "Content-Type: application/json" \
  -d '{
    "artifactId": "virupaksha-temple",
    "siteId": "hampi-ruins-karnataka",
    "contentType": "audio_guide",
    "language": "en"
  }')

if echo "$CONTENT_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Content generation test passed${NC}"
else
  echo -e "${YELLOW}⚠️  Content generation test returned error (expected if data not seeded)${NC}"
  echo "   Run: npm run seed"
fi
echo ""

# Test 4: Q&A Endpoint
echo "4️⃣  Testing Q&A Endpoint..."
QA_RESPONSE=$(curl -s -X POST "${API_URL}qa" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me about Virupaksha Temple",
    "language": "en",
    "siteId": "hampi-ruins-karnataka"
  }')

if echo "$QA_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Q&A test passed${NC}"
else
  echo -e "${YELLOW}⚠️  Q&A test returned error${NC}"
fi
echo ""

# Test 5: Analytics Endpoint
echo "5️⃣  Testing Analytics Endpoint..."
ANALYTICS_RESPONSE=$(curl -s -X POST "${API_URL}analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "qr_scan",
    "siteId": "hampi-ruins-karnataka",
    "artifactId": "virupaksha-temple",
    "sessionId": "test-session-123"
  }')

if echo "$ANALYTICS_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Analytics test passed${NC}"
else
  echo -e "${YELLOW}⚠️  Analytics test returned error${NC}"
fi
echo ""

# Summary
echo "================================"
echo "🎉 API Testing Complete!"
echo ""
echo "Next Steps:"
echo "1. If tests failed, run: npm run seed"
echo "2. Update mobile app API URL in: mobile-app/src/config/api.ts"
echo "3. Start mobile app: cd mobile-app && npm start"
echo ""
echo "API URL for mobile app:"
echo -e "${GREEN}${API_URL}${NC}"
