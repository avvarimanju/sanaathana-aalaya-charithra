/**
 * Unit tests for CostEstimator
 * 
 * Tests cost calculation logic for AWS services
 */

import { CostEstimator } from '../../../src/pre-generation/utils/cost-estimator';
import { ArtifactMetadata, GenerationOptions, Language } from '../../../src/pre-generation/types';

describe('CostEstimator', () => {
  let costEstimator: CostEstimator;
  
  beforeEach(() => {
    costEstimator = new CostEstimator();
  });
  
  describe('estimateCost', () => {
    it('should calculate cost for single artifact in one language with all content types', () => {
      const artifacts: ArtifactMetadata[] = [
        {
          artifactId: 'test-artifact-1',
          siteId: 'test-site-1',
          name: 'Test Artifact',
          type: 'sculpture',
          description: 'Test description',
          historicalContext: 'Test context',
          culturalSignificance: 'Test significance',
          templeGroup: 'test-temple',
        },
      ];
      
      const options: GenerationOptions = {
        languages: ['en' as Language],
        contentTypes: ['audio_guide', 'video', 'infographic', 'qa_knowledge_base'],
        forceRegenerate: false,
        dryRun: false,
        batchSize: 10,
        maxConcurrency: 5,
      };
      
      const estimate = costEstimator.estimateCost(artifacts, options);
      
      // Verify basic structure
      expect(estimate).toHaveProperty('totalCostUSD');
      expect(estimate).toHaveProperty('totalCostINR');
      expect(estimate).toHaveProperty('breakdown');
      expect(estimate).toHaveProperty('estimatedDuration');
      expect(estimate).toHaveProperty('itemCount');
      
      // Verify item count
      expect(estimate.itemCount).toBe(4); // 1 artifact * 1 language * 4 content types
      
      // Verify costs are positive
      expect(estimate.totalCostUSD).toBeGreaterThan(0);
      expect(estimate.totalCostINR).toBeGreaterThan(0);
      expect(estimate.breakdown.bedrockCost).toBeGreaterThan(0);
      expect(estimate.breakdown.pollyCost).toBeGreaterThan(0);
      expect(estimate.breakdown.s3StorageCost).toBeGreaterThan(0);
      expect(estimate.breakdown.s3RequestCost).toBeGreaterThan(0);
      expect(estimate.breakdown.dynamoDBCost).toBeGreaterThan(0);
      
      // Verify breakdown sums to total
      const breakdownSum = 
        estimate.breakdown.bedrockCost +
        estimate.breakdown.pollyCost +
        estimate.breakdown.s3StorageCost +
        estimate.breakdown.s3RequestCost +
        estimate.breakdown.dynamoDBCost;
      
      expect(estimate.breakdown.totalCost).toBeCloseTo(breakdownSum, 2);
      expect(estimate.totalCostUSD).toBeCloseTo(breakdownSum, 2);
    });
    
    it('should calculate cost for multiple artifacts and languages', () => {
      const artifacts: ArtifactMetadata[] = [
        {
          artifactId: 'artifact-1',
          siteId: 'site-1',
          name: 'Artifact 1',
          type: 'sculpture',
          description: 'Description 1',
          historicalContext: 'Context 1',
          culturalSignificance: 'Significance 1',
          templeGroup: 'temple-1',
        },
        {
          artifactId: 'artifact-2',
          siteId: 'site-2',
          name: 'Artifact 2',
          type: 'inscription',
          description: 'Description 2',
          historicalContext: 'Context 2',
          culturalSignificance: 'Significance 2',
          templeGroup: 'temple-2',
        },
      ];
      
      const options: GenerationOptions = {
        languages: ['en' as Language, 'hi' as Language],
        contentTypes: ['audio_guide', 'video'],
        forceRegenerate: false,
        dryRun: false,
        batchSize: 10,
        maxConcurrency: 5,
      };
      
      const estimate = costEstimator.estimateCost(artifacts, options);
      
      // Verify item count: 2 artifacts * 2 languages * 2 content types = 8
      expect(estimate.itemCount).toBe(8);
      
      // Verify costs scale appropriately
      expect(estimate.totalCostUSD).toBeGreaterThan(0);
    });
    
    it('should not charge Bedrock cost for audio-only generation', () => {
      const artifacts: ArtifactMetadata[] = [
        {
          artifactId: 'test-artifact',
          siteId: 'test-site',
          name: 'Test Artifact',
          type: 'sculpture',
          description: 'Test description',
          historicalContext: 'Test context',
          culturalSignificance: 'Test significance',
          templeGroup: 'test-temple',
        },
      ];
      
      const options: GenerationOptions = {
        languages: ['en' as Language],
        contentTypes: ['audio_guide'], // Only audio
        forceRegenerate: false,
        dryRun: false,
        batchSize: 10,
        maxConcurrency: 5,
      };
      
      const estimate = costEstimator.estimateCost(artifacts, options);
      
      // Bedrock should not be used for audio-only
      expect(estimate.breakdown.bedrockCost).toBe(0);
      
      // Polly should be charged
      expect(estimate.breakdown.pollyCost).toBeGreaterThan(0);
    });
    
    it('should not charge Polly cost when audio_guide is not included', () => {
      const artifacts: ArtifactMetadata[] = [
        {
          artifactId: 'test-artifact',
          siteId: 'test-site',
          name: 'Test Artifact',
          type: 'sculpture',
          description: 'Test description',
          historicalContext: 'Test context',
          culturalSignificance: 'Test significance',
          templeGroup: 'test-temple',
        },
      ];
      
      const options: GenerationOptions = {
        languages: ['en' as Language],
        contentTypes: ['video', 'infographic'], // No audio
        forceRegenerate: false,
        dryRun: false,
        batchSize: 10,
        maxConcurrency: 5,
      };
      
      const estimate = costEstimator.estimateCost(artifacts, options);
      
      // Polly should not be charged
      expect(estimate.breakdown.pollyCost).toBe(0);
      
      // Bedrock should be charged
      expect(estimate.breakdown.bedrockCost).toBeGreaterThan(0);
    });
    
    it('should calculate estimated duration based on item count', () => {
      const artifacts: ArtifactMetadata[] = Array.from({ length: 10 }, (_, i) => ({
        artifactId: `artifact-${i}`,
        siteId: `site-${i}`,
        name: `Artifact ${i}`,
        type: 'sculpture',
        description: `Description ${i}`,
        historicalContext: `Context ${i}`,
        culturalSignificance: `Significance ${i}`,
        templeGroup: `temple-${i}`,
      }));
      
      const options: GenerationOptions = {
        languages: ['en' as Language],
        contentTypes: ['audio_guide', 'video'],
        forceRegenerate: false,
        dryRun: false,
        batchSize: 10,
        maxConcurrency: 5,
      };
      
      const estimate = costEstimator.estimateCost(artifacts, options);
      
      // 10 artifacts * 1 language * 2 content types = 20 items
      expect(estimate.itemCount).toBe(20);
      
      // Duration should be positive
      expect(estimate.estimatedDuration).toBeGreaterThan(0);
      
      // With 10 req/sec rate limit, 20 items should take at least 2 seconds
      // (plus 20% buffer)
      expect(estimate.estimatedDuration).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('calculateActualCost', () => {
    it('should calculate actual cost from generation results with actual metrics', () => {
      const results = {
        totalItems: 100,
        succeeded: 95,
        failed: 3,
        skipped: 2,
        duration: 600,
        estimatedCost: 10.0,
        actualCost: 0,
        failures: [],
        actualMetrics: {
          totalInputTokens: 47500,      // 95 items * 500 tokens
          totalOutputTokens: 142500,    // 95 items * 1500 tokens
          totalCharacters: 23750,       // ~25 audio guides * 950 characters
          totalFileSizeBytes: 1000000000, // ~1 GB
          totalS3Requests: 95,
          totalDynamoDBWrites: 190,     // 95 items * 2 writes
        },
      };
      
      const actualCost = costEstimator.calculateActualCost(results);
      
      // Verify structure
      expect(actualCost).toHaveProperty('bedrockCost');
      expect(actualCost).toHaveProperty('pollyCost');
      expect(actualCost).toHaveProperty('s3StorageCost');
      expect(actualCost).toHaveProperty('s3RequestCost');
      expect(actualCost).toHaveProperty('dynamoDBCost');
      expect(actualCost).toHaveProperty('totalCost');
      expect(actualCost).toHaveProperty('currency');
      
      // Verify costs are calculated from actual metrics
      // Bedrock: (47500/1000 * 0.003) + (142500/1000 * 0.015) = 0.1425 + 2.1375 = 2.28
      expect(actualCost.bedrockCost).toBeCloseTo(2.28, 2);
      
      // Polly: (23750/1000000 * 16) = 0.38
      expect(actualCost.pollyCost).toBeCloseTo(0.38, 2);
      
      // S3 Storage: (1000000000 / (1024*1024*1024)) * 0.023 = 0.93 * 0.023 = 0.0214
      expect(actualCost.s3StorageCost).toBeCloseTo(0.0214, 3);
      
      // S3 Requests: (95/1000) * 0.005 = 0.000475
      expect(actualCost.s3RequestCost).toBeCloseTo(0.000475, 5);
      
      // DynamoDB: (190/1000000) * 1.25 = 0.0002375
      expect(actualCost.dynamoDBCost).toBeCloseTo(0.0002375, 6);
      
      // Verify breakdown sums to total
      const breakdownSum = 
        actualCost.bedrockCost +
        actualCost.pollyCost +
        actualCost.s3StorageCost +
        actualCost.s3RequestCost +
        actualCost.dynamoDBCost;
      
      expect(actualCost.totalCost).toBeCloseTo(breakdownSum, 2);
    });
    
    it('should fall back to estimation when actual metrics are not available', () => {
      const results = {
        totalItems: 100,
        succeeded: 95,
        failed: 3,
        skipped: 2,
        duration: 600,
        estimatedCost: 10.0,
        actualCost: 0,
        failures: [],
      };
      
      const actualCost = costEstimator.calculateActualCost(results);
      
      // Verify structure
      expect(actualCost).toHaveProperty('bedrockCost');
      expect(actualCost).toHaveProperty('pollyCost');
      expect(actualCost).toHaveProperty('s3StorageCost');
      expect(actualCost).toHaveProperty('s3RequestCost');
      expect(actualCost).toHaveProperty('dynamoDBCost');
      expect(actualCost).toHaveProperty('totalCost');
      expect(actualCost).toHaveProperty('currency');
      
      // Verify costs are positive (using estimation)
      expect(actualCost.totalCost).toBeGreaterThan(0);
      
      // Verify breakdown sums to total
      const breakdownSum = 
        actualCost.bedrockCost +
        actualCost.pollyCost +
        actualCost.s3StorageCost +
        actualCost.s3RequestCost +
        actualCost.dynamoDBCost;
      
      expect(actualCost.totalCost).toBeCloseTo(breakdownSum, 2);
    });
  });
  
  describe('formatCostEstimate', () => {
    it('should format cost estimate for display', () => {
      const estimate = {
        totalCostINR: 835.0,
        totalCostUSD: 10.0,
        breakdown: {
          bedrockCost: 5.0,
          pollyCost: 2.0,
          s3StorageCost: 1.5,
          s3RequestCost: 1.0,
          dynamoDBCost: 0.5,
          totalCost: 10.0,
          currency: 'USD' as const,
        },
        estimatedDuration: 3600,
        itemCount: 100,
      };
      
      const formatted = costEstimator.formatCostEstimate(estimate);
      
      // Verify formatted string contains key information
      expect(formatted).toContain('COST ESTIMATE');
      expect(formatted).toContain('Total Items to Process: 100');
      expect(formatted).toContain('Estimated Duration: 1h');
      expect(formatted).toContain('Bedrock');
      expect(formatted).toContain('Polly');
      expect(formatted).toContain('S3 Storage');
      expect(formatted).toContain('S3 Requests');
      expect(formatted).toContain('DynamoDB');
      expect(formatted).toContain('$10.00');
      expect(formatted).toContain('₹835.00');
    });
  });
  
  describe('formatCostComparison', () => {
    it('should format cost comparison between estimated and actual costs', () => {
      const estimated = {
        bedrockCost: 5.0,
        pollyCost: 2.0,
        s3StorageCost: 1.5,
        s3RequestCost: 1.0,
        dynamoDBCost: 0.5,
        totalCost: 10.0,
        currency: 'USD' as const,
      };
      
      const actual = {
        bedrockCost: 5.2,
        pollyCost: 1.9,
        s3StorageCost: 1.6,
        s3RequestCost: 0.95,
        dynamoDBCost: 0.48,
        totalCost: 10.13,
        currency: 'USD' as const,
      };
      
      const formatted = costEstimator.formatCostComparison(estimated, actual);
      
      // Verify formatted string contains key information
      expect(formatted).toContain('COST COMPARISON');
      expect(formatted).toContain('ESTIMATED vs ACTUAL');
      expect(formatted).toContain('Bedrock');
      expect(formatted).toContain('Polly');
      expect(formatted).toContain('S3 Storage');
      expect(formatted).toContain('S3 Requests');
      expect(formatted).toContain('DynamoDB');
      expect(formatted).toContain('$10.00');
      expect(formatted).toContain('$10.13');
      expect(formatted).toContain('Variance');
      expect(formatted).toContain('Within 10% accuracy');
    });
    
    it('should show warning when over budget by more than 10%', () => {
      const estimated = {
        bedrockCost: 5.0,
        pollyCost: 2.0,
        s3StorageCost: 1.5,
        s3RequestCost: 1.0,
        dynamoDBCost: 0.5,
        totalCost: 10.0,
        currency: 'USD' as const,
      };
      
      const actual = {
        bedrockCost: 6.5,
        pollyCost: 2.5,
        s3StorageCost: 2.0,
        s3RequestCost: 1.2,
        dynamoDBCost: 0.6,
        totalCost: 12.8,
        currency: 'USD' as const,
      };
      
      const formatted = costEstimator.formatCostComparison(estimated, actual);
      
      // Verify warning is shown
      expect(formatted).toContain('Over budget');
      expect(formatted).toContain('28.0%');
    });
    
    it('should show success when under budget', () => {
      const estimated = {
        bedrockCost: 5.0,
        pollyCost: 2.0,
        s3StorageCost: 1.5,
        s3RequestCost: 1.0,
        dynamoDBCost: 0.5,
        totalCost: 10.0,
        currency: 'USD' as const,
      };
      
      const actual = {
        bedrockCost: 4.0,
        pollyCost: 1.5,
        s3StorageCost: 1.2,
        s3RequestCost: 0.8,
        dynamoDBCost: 0.4,
        totalCost: 7.9,
        currency: 'USD' as const,
      };
      
      const formatted = costEstimator.formatCostComparison(estimated, actual);
      
      // Verify success is shown
      expect(formatted).toContain('Under budget');
      expect(formatted).toContain('21.0%');
    });
  });
});
