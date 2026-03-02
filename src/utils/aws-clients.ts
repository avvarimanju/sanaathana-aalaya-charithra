// AWS service clients configuration and initialization
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { PollyClient } from '@aws-sdk/client-polly';
import { S3Client } from '@aws-sdk/client-s3';
import { TranslateClient } from '@aws-sdk/client-translate';
import { getEnv, getDynamoDBConfig } from './env-validation';

// Validate environment variables at startup
const env = getEnv();

// Get DynamoDB configuration (automatically handles LocalStack vs AWS)
const dynamoDBConfig = getDynamoDBConfig(env);

// Common client configuration
const clientConfig = {
  region: env.AWS_REGION,
  maxAttempts: 3,
};

// Initialize AWS service clients
export const bedrockClient = new BedrockRuntimeClient(clientConfig);

export const dynamoDBClient = new DynamoDBClient(dynamoDBConfig);

export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const pollyClient = new PollyClient(clientConfig);

export const s3Client = new S3Client(clientConfig);

export const translateClient = new TranslateClient(clientConfig);

// Environment variables for table names (validated at startup)
export const TABLES = {
  TEMPLES: env.TEMPLES_TABLE,
  ARTIFACTS: env.ARTIFACTS_TABLE,
  TEMPLE_GROUPS: env.TEMPLE_GROUPS_TABLE,
  PRICING: env.PRICING_TABLE,
  PRICE_HISTORY: env.PRICE_HISTORY_TABLE,
  PRICING_FORMULAS: env.PRICING_FORMULAS_TABLE,
  CONTENT_JOBS: env.CONTENT_JOBS_TABLE,
  CONTENT: env.CONTENT_TABLE,
  ADMIN_USERS: env.ADMIN_USERS_TABLE,
  MOBILE_USERS: env.MOBILE_USERS_TABLE,
  DEFECTS: env.DEFECTS_TABLE,
  STATE_VISIBILITY: env.STATE_VISIBILITY_TABLE,
};

export const BUCKETS = {
  CONTENT: env.CONTENT_BUCKET || 'sanaathana-content-bucket',
  ASSETS: env.ASSETS_BUCKET || 'sanaathana-assets-bucket',
};

export const API_URL = env.API_URL;

export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || '';

// Bedrock model configurations
export const BEDROCK_MODELS = {
  TEXT_GENERATION: 'anthropic.claude-3-sonnet-20240229-v1:0',
  EMBEDDING: 'amazon.titan-embed-text-v1',
};

// Polly voice configurations for Indian languages
export const POLLY_VOICES = {
  en: { VoiceId: 'Joanna', Engine: 'neural' },
  hi: { VoiceId: 'Aditi', Engine: 'standard' },
  ta: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  te: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  bn: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  mr: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  gu: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  kn: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  ml: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
  pa: { VoiceId: 'Aditi', Engine: 'standard' }, // Fallback to Hindi voice
} as const;