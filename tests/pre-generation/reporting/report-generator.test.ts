/**
 * Unit tests for ReportGenerator
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ReportGenerator } from '../../../src/pre-generation/reporting/report-generator';
import { GenerationResult, CostBreakdown, Language, ContentType } from '../../../src/pre-generation/types';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let testOutputDir: string;
  
  beforeEach(() => {
    // Create a temporary test output directory
    testOutputDir = path.join(__dirname, 'test-reports');
    reportGenerator = new ReportGenerator(testOutputDir);
  });
  
  afterEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });
  
  describe('generateAllReports', () => {
    it('should generate all report files in requested formats', async () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 95,
        failed: 3,
        skipped: 2,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 48.5,
        failures: [
          {
            artifactId: 'artifact-1',
            language: 'en' as Language,
            contentType: 'audio_guide' as ContentType,
            error: 'Network timeout',
            retryCount: 3,
            timestamp: new Date().toISOString(),
          },
        ],
        actualMetrics: {
          totalInputTokens: 50000,
          totalOutputTokens: 150000,
          totalCharacters: 100000,
          totalFileSizeBytes: 1024 * 1024 * 100, // 100 MB
          totalS3Requests: 100,
          totalDynamoDBWrites: 200,
        },
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago
      
      // Act
      const reportPaths = await reportGenerator.generateAllReports(
        result,
        estimatedCost,
        startTime,
        ['json', 'csv', 'html']
      );
      
      // Assert
      expect(reportPaths.length).toBeGreaterThan(0);
      
      // Verify JSON reports exist
      const jsonReports = reportPaths.filter(p => p.endsWith('.json'));
      expect(jsonReports.length).toBeGreaterThan(0);
      
      // Verify CSV reports exist
      const csvReports = reportPaths.filter(p => p.endsWith('.csv'));
      expect(csvReports.length).toBeGreaterThan(0);
      
      // Verify HTML report exists
      const htmlReports = reportPaths.filter(p => p.endsWith('.html'));
      expect(htmlReports.length).toBeGreaterThan(0);
      
      // Verify all files actually exist
      for (const reportPath of reportPaths) {
        expect(fs.existsSync(reportPath)).toBe(true);
      }
    });
    
    it('should generate summary report with correct statistics', async () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 90,
        failed: 5,
        skipped: 5,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 48.5,
        failures: [],
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000);
      
      // Act
      const reportPaths = await reportGenerator.generateAllReports(
        result,
        estimatedCost,
        startTime,
        ['json']
      );
      
      // Assert
      const summaryPath = reportPaths.find(p => p.includes('summary') && p.endsWith('.json'));
      expect(summaryPath).toBeDefined();
      
      if (summaryPath) {
        const summaryContent = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
        expect(summaryContent.totalItems).toBe(100);
        expect(summaryContent.succeeded).toBe(90);
        expect(summaryContent.failed).toBe(5);
        expect(summaryContent.skipped).toBe(5);
        expect(summaryContent.successRate).toBe(90);
      }
    });
  });
  
  describe('generateConsoleSummary', () => {
    it('should generate a formatted console summary', () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 95,
        failed: 3,
        skipped: 2,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 48.5,
        failures: [
          {
            artifactId: 'artifact-1',
            language: 'en' as Language,
            contentType: 'audio_guide' as ContentType,
            error: 'Network timeout',
            retryCount: 3,
            timestamp: new Date().toISOString(),
          },
        ],
        actualMetrics: {
          totalInputTokens: 50000,
          totalOutputTokens: 150000,
          totalCharacters: 100000,
          totalFileSizeBytes: 1024 * 1024 * 100,
          totalS3Requests: 100,
          totalDynamoDBWrites: 200,
        },
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const actualCost: CostBreakdown = {
        bedrockCost: 28.5,
        pollyCost: 9.5,
        s3StorageCost: 5.2,
        s3RequestCost: 2.1,
        dynamoDBCost: 3.2,
        totalCost: 48.5,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      
      // Act
      const summary = reportGenerator.generateConsoleSummary(
        result,
        estimatedCost,
        actualCost,
        startTime,
        endTime
      );
      
      // Assert
      expect(summary).toContain('GENERATION COMPLETE');
      expect(summary).toContain('Total Items:     100');
      expect(summary).toContain('Succeeded:       95');
      expect(summary).toContain('Failed:          3');
      expect(summary).toContain('Skipped:         2');
      expect(summary).toContain('Success Rate:    95%');
      expect(summary).toContain('Estimated:');
      expect(summary).toContain('Actual:');
      expect(summary).toContain('Storage Usage:');
    });
  });
  
  describe('cost report generation', () => {
    it('should calculate cost variance correctly', async () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 100,
        failed: 0,
        skipped: 0,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 55.0,
        failures: [],
        actualMetrics: {
          totalInputTokens: 50000,
          totalOutputTokens: 150000,
          totalCharacters: 100000,
          totalFileSizeBytes: 1024 * 1024 * 100,
          totalS3Requests: 100,
          totalDynamoDBWrites: 200,
        },
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000);
      
      // Act
      const reportPaths = await reportGenerator.generateAllReports(
        result,
        estimatedCost,
        startTime,
        ['json']
      );
      
      // Assert
      const costPath = reportPaths.find(p => p.includes('cost') && p.endsWith('.json'));
      expect(costPath).toBeDefined();
      
      if (costPath) {
        const costContent = JSON.parse(fs.readFileSync(costPath, 'utf-8'));
        expect(costContent.estimated).toBeDefined();
        expect(costContent.actual).toBeDefined();
        expect(costContent.variance).toBeDefined();
        // Variance can be positive or negative depending on actual vs estimated
        expect(typeof costContent.variance.total).toBe('number');
      }
    });
  });
  
  describe('failure report generation', () => {
    it('should include recommended actions for failures', async () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 95,
        failed: 5,
        skipped: 0,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 48.5,
        failures: [
          {
            artifactId: 'artifact-1',
            language: 'en' as Language,
            contentType: 'audio_guide' as ContentType,
            error: 'Throttling error from AWS Bedrock',
            retryCount: 3,
            timestamp: new Date().toISOString(),
          },
          {
            artifactId: 'artifact-2',
            language: 'hi' as Language,
            contentType: 'video' as ContentType,
            error: 'Validation failed: content too short',
            retryCount: 3,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000);
      
      // Act
      const reportPaths = await reportGenerator.generateAllReports(
        result,
        estimatedCost,
        startTime,
        ['json']
      );
      
      // Assert
      const failurePath = reportPaths.find(p => p.includes('failures') && p.endsWith('.json'));
      expect(failurePath).toBeDefined();
      
      if (failurePath) {
        const failureContent = JSON.parse(fs.readFileSync(failurePath, 'utf-8'));
        expect(failureContent).toHaveLength(2);
        expect(failureContent[0].recommendedAction).toBeDefined();
        expect(failureContent[0].recommendedAction).toContain('rate limit');
        expect(failureContent[1].recommendedAction).toContain('metadata');
      }
    });
  });
  
  describe('storage report generation', () => {
    it('should calculate storage usage from actual metrics', async () => {
      // Arrange
      const result: GenerationResult = {
        totalItems: 100,
        succeeded: 100,
        failed: 0,
        skipped: 0,
        duration: 3600,
        estimatedCost: 50.0,
        actualCost: 48.5,
        failures: [],
        actualMetrics: {
          totalInputTokens: 50000,
          totalOutputTokens: 150000,
          totalCharacters: 100000,
          totalFileSizeBytes: 1024 * 1024 * 500, // 500 MB
          totalS3Requests: 100,
          totalDynamoDBWrites: 200,
        },
      };
      
      const estimatedCost: CostBreakdown = {
        bedrockCost: 30.0,
        pollyCost: 10.0,
        s3StorageCost: 5.0,
        s3RequestCost: 2.0,
        dynamoDBCost: 3.0,
        totalCost: 50.0,
        currency: 'USD',
      };
      
      const startTime = new Date(Date.now() - 3600000);
      
      // Act
      const reportPaths = await reportGenerator.generateAllReports(
        result,
        estimatedCost,
        startTime,
        ['json']
      );
      
      // Assert
      const storagePath = reportPaths.find(p => p.includes('storage') && p.endsWith('.json'));
      expect(storagePath).toBeDefined();
      
      if (storagePath) {
        const storageContent = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
        expect(storageContent.s3.totalSizeBytes).toBe(1024 * 1024 * 500);
        expect(storageContent.s3.objectCount).toBe(100);
        expect(storageContent.dynamoDB.itemCount).toBe(200); // 2 items per succeeded item
      }
    });
  });
});
