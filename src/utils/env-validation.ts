/**
 * Environment Variable Validation
 * 
 * Enterprise best practice: Validate all required environment variables at startup
 * Catches "missing endpoint" errors before the app even attempts a database call
 * 
 * Uses Zod for runtime validation with clear error messages
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // AWS Configuration
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCOUNT_ID: z.string().optional(),
  
  // DynamoDB Endpoint (optional - only for local development)
  DYNAMODB_ENDPOINT: z.string().url().optional(),
  
  // DynamoDB Table Names
  TEMPLES_TABLE: z.string().min(1, 'TEMPLES_TABLE is required'),
  ARTIFACTS_TABLE: z.string().min(1, 'ARTIFACTS_TABLE is required'),
  TEMPLE_GROUPS_TABLE: z.string().min(1, 'TEMPLE_GROUPS_TABLE is required'),
  PRICING_TABLE: z.string().min(1, 'PRICING_TABLE is required'),
  PRICE_HISTORY_TABLE: z.string().min(1, 'PRICE_HISTORY_TABLE is required'),
  PRICING_FORMULAS_TABLE: z.string().min(1, 'PRICING_FORMULAS_TABLE is required'),
  CONTENT_JOBS_TABLE: z.string().min(1, 'CONTENT_JOBS_TABLE is required'),
  CONTENT_TABLE: z.string().min(1, 'CONTENT_TABLE is required'),
  ADMIN_USERS_TABLE: z.string().min(1, 'ADMIN_USERS_TABLE is required'),
  MOBILE_USERS_TABLE: z.string().min(1, 'MOBILE_USERS_TABLE is required'),
  DEFECTS_TABLE: z.string().min(1, 'DEFECTS_TABLE is required'),
  STATE_VISIBILITY_TABLE: z.string().min(1, 'STATE_VISIBILITY_TABLE is required'),
  
  // S3 Bucket Names (optional)
  CONTENT_BUCKET: z.string().optional(),
  ASSETS_BUCKET: z.string().optional(),
  
  // API Configuration
  API_URL: z.string().url('API_URL must be a valid URL'),
  
  // Feature Flags
  ENABLE_AI_CONTENT_GENERATION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws an error with clear messages if validation fails
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional validation: Warn if DYNAMODB_ENDPOINT is set in production
    if (env.NODE_ENV === 'production' && env.DYNAMODB_ENDPOINT) {
      console.warn('⚠️  WARNING: DYNAMODB_ENDPOINT is set in production environment!');
      console.warn('⚠️  This will cause Lambda functions to fail.');
      console.warn('⚠️  Remove DYNAMODB_ENDPOINT from production environment variables.');
    }
    
    // Log environment configuration (without sensitive data)
    console.log('✅ Environment validation passed');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   AWS Region: ${env.AWS_REGION}`);
    console.log(`   DynamoDB Endpoint: ${env.DYNAMODB_ENDPOINT || 'AWS Default (real DynamoDB)'}`);
    console.log(`   API URL: ${env.API_URL}`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed!');
      console.error('❌ Missing or invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('');
      console.error('💡 Tip: Copy .env.example to .env.development and fill in the values');
      throw new Error('Environment validation failed. Check the errors above.');
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Call this at the start of your application
 */
export function getEnv(): Env {
  return validateEnv();
}

/**
 * Check if running in local development mode
 */
export function isLocalDevelopment(env: Env): boolean {
  return env.NODE_ENV === 'development' && !!env.DYNAMODB_ENDPOINT;
}

/**
 * Check if running in production mode
 */
export function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Get DynamoDB client configuration based on environment
 */
export function getDynamoDBConfig(env: Env) {
  const config: any = {
    region: env.AWS_REGION,
    maxAttempts: 3,
  };
  
  // Only set endpoint for local development
  if (env.DYNAMODB_ENDPOINT) {
    config.endpoint = env.DYNAMODB_ENDPOINT;
    console.log(`🔧 Using LocalStack DynamoDB: ${env.DYNAMODB_ENDPOINT}`);
  } else {
    console.log(`☁️  Using AWS DynamoDB in region: ${env.AWS_REGION}`);
  }
  
  return config;
}
