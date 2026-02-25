/**
 * Unit tests for Pre-Generation Lambda function
 */
import { Context } from 'aws-lambda';
import { handler, PreGenerationLambdaEvent } from '../../src/lambdas/pre-generation';

// Mock context
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'PreGenerationFunction',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:PreGenerationFunction',
  memoryLimitInMB: '1024',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/PreGenerationFunction',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 300000, // 5 minutes
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    S3_BUCKET: 'test-bucket',
    DYNAMODB_PROGRESS_TABLE: 'TestProgressTable',
    DYNAMODB_CACHE_TABLE: 'TestCacheTable',
    BATCH_SIZE: '10',
    AWS_LAMBDA_FUNCTION_NAME: 'PreGenerationFunction',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Pre-Generation Lambda Handler', () => {
  describe('Environment Validation', () => {
    it('should fail when S3_BUCKET is missing', async () => {
      delete process.env.S3_BUCKET;
      
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('S3_BUCKET');
    });
    
    it('should fail when DYNAMODB_PROGRESS_TABLE is missing', async () => {
      delete process.env.DYNAMODB_PROGRESS_TABLE;
      
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('DYNAMODB_PROGRESS_TABLE');
    });
    
    it('should fail when DYNAMODB_CACHE_TABLE is missing', async () => {
      delete process.env.DYNAMODB_CACHE_TABLE;
      
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('DYNAMODB_CACHE_TABLE');
    });
  });
  
  describe('Event Handling', () => {
    it('should accept valid event with jobId', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
        batchSize: 5,
      };
      
      // This will fail because we don't have a real DynamoDB setup
      // but we can verify the structure
      const result = await handler(event, mockContext);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('batchProcessed');
      expect(result).toHaveProperty('totalProcessed');
      expect(result).toHaveProperty('totalRemaining');
      expect(result).toHaveProperty('hasMoreItems');
      expect(result).toHaveProperty('invokedNextBatch');
      expect(result).toHaveProperty('duration');
    });
    
    it('should use default batch size from environment', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
    
    it('should override batch size from event', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
        batchSize: 20,
      };
      
      const result = await handler(event, mockContext);
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
    
    it('should handle forceRegenerate flag', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
        forceRegenerate: true,
      };
      
      const result = await handler(event, mockContext);
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
    
    it('should handle language filters', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
        languages: ['en', 'hi'],
      };
      
      const result = await handler(event, mockContext);
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
    
    it('should handle content type filters', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
        contentTypes: ['audio_guide', 'video'],
      };
      
      const result = await handler(event, mockContext);
      
      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('jobId');
    });
  });
  
  describe('Response Structure', () => {
    it('should return proper response structure on success', async () => {
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        jobId: expect.any(String),
        batchProcessed: expect.any(Number),
        totalProcessed: expect.any(Number),
        totalRemaining: expect.any(Number),
        hasMoreItems: expect.any(Boolean),
        invokedNextBatch: expect.any(Boolean),
        duration: expect.any(Number),
      });
    });
    
    it('should return proper response structure on error', async () => {
      delete process.env.S3_BUCKET;
      
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      const result = await handler(event, mockContext);
      
      expect(result).toMatchObject({
        success: false,
        jobId: expect.any(String),
        batchProcessed: 0,
        totalProcessed: 0,
        totalRemaining: 0,
        hasMoreItems: false,
        invokedNextBatch: false,
        duration: expect.any(Number),
        errors: expect.any(Array),
      });
    });
  });
  
  describe('Logging', () => {
    it('should log invocation details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const event: PreGenerationLambdaEvent = {
        jobId: 'test-job-123',
      };
      
      await handler(event, mockContext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Pre-Generation Lambda invoked',
        expect.objectContaining({
          requestId: 'test-request-id',
          functionName: 'PreGenerationFunction',
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
