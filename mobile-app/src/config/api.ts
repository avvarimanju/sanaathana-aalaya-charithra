/**
 * API Configuration for Sanaathana Aalaya Charithra Mobile App
 * 
 * To connect to your deployed backend:
 * 1. Deploy the backend: cd .. && npm run deploy
 * 2. Get the API Gateway URL from the deployment output
 * 3. Replace the API_BASE_URL below with your actual API Gateway URL
 */

// IMPORTANT: Replace this with your actual API Gateway URL after deployment
// You can get this by running: aws cloudformation describe-stacks --stack-name SanaathanaAalayaCharithraStack --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' --output text
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-gateway-url.execute-api.ap-south-1.amazonaws.com/prod';

// API Endpoints
export const API_ENDPOINTS = {
  // QR Processing
  QR_SCAN: `${API_BASE_URL}/qr`,
  
  // Content Generation
  CONTENT_GENERATE: `${API_BASE_URL}/content`,
  CONTENT_GET: (artifactId: string) => `${API_BASE_URL}/content/${artifactId}`,
  
  // Q&A
  QA_ASK: `${API_BASE_URL}/qa`,
  QA_HISTORY: (sessionId: string) => `${API_BASE_URL}/qa/${sessionId}`,
  
  // Analytics
  ANALYTICS_TRACK: `${API_BASE_URL}/analytics`,
  ANALYTICS_GET: `${API_BASE_URL}/analytics`,
  
  // Health Check
  HEALTH: `${API_BASE_URL}/health`,
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Demo Mode Configuration
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false'; // Default to demo mode

// Check if API is configured
export const isAPIConfigured = (): boolean => {
  return API_BASE_URL !== 'https://your-api-gateway-url.execute-api.ap-south-1.amazonaws.com/prod';
};
