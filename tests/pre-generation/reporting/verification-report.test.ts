/**
 * Tests for verification report generation
 */

import { ReportGenerator } from '../../../src/pre-generation/reporting/report-generator';
import { Language } from '../../../src/models/common';
import { ContentType } from '../../../src/pre-generation/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Verification Report Generation', () => {
  let reportGenerator: ReportGenerator;
  let outputDir: string;

  beforeEach(() => {
    outputDir = path.join(__dirname, 'test-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    reportGenerator = new ReportGenerator(outputDir);
  });

  afterEach(() => {
    // Clean up test reports
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        fs.unlinkSync(path.join(outputDir, file));
      }
      fs.rmdirSync(outputDir);
    }
  });

  describe('generateVerificationReport', () => {
    it('should generate verification report for all verified content', async () => {
      // Mock storage manager
      const mockStorageManager = {
        getCachedContent: jest.fn().mockResolvedValue({
          s3Key: 'test-temple/artifact-1/en/audio_guide/123456.mp3',
          cacheKey: 'site1#artifact-1#en#audio_guide',
        }),
        verifyContentExists: jest.fn().mockResolvedValue(true),
      };

      const artifacts = [
        { artifactId: 'artifact-1', siteId: 'site1' },
        { artifactId: 'artifact-2', siteId: 'site1' },
      ];
      const languages = [Language.ENGLISH, Language.HINDI];
      const contentTypes: ContentType[] = ['audio_guide', 'video'];

      const report = await reportGenerator.generateVerificationReport(
        artifacts,
        languages,
        contentTypes,
        mockStorageManager
      );

      // Verify report structure
      expect(report.totalExpected).toBe(8); // 2 artifacts * 2 languages * 2 content types
      expect(report.totalVerified).toBe(8);
      expect(report.totalFailed).toBe(0);
      expect(report.cacheEntriesMissing).toBe(0);
      expect(report.s3ObjectsMissing).toBe(0);
      expect(report.successRate).toBe(100);
      expect(report.entries).toHaveLength(8);
      expect(report.timestamp).toBeDefined();

      // Verify all entries are verified
      for (const entry of report.entries) {
        expect(entry.verified).toBe(true);
        expect(entry.cacheEntryExists).toBe(true);
        expect(entry.s3ObjectExists).toBe(true);
        expect(entry.s3Key).toBeDefined();
        expect(entry.error).toBeUndefined();
      }
    });

    it('should detect missing cache entries', async () => {
      // Mock storage manager with missing cache entries
      const mockStorageManager = {
        getCachedContent: jest.fn().mockResolvedValue(null), // No cache entry
        verifyContentExists: jest.fn().mockResolvedValue(false),
      };

      const artifacts = [{ artifactId: 'artifact-1', siteId: 'site1' }];
      const languages = [Language.ENGLISH];
      const contentTypes: ContentType[] = ['audio_guide'];

      const report = await reportGenerator.generateVerificationReport(
        artifacts,
        languages,
        contentTypes,
        mockStorageManager
      );

      expect(report.totalExpected).toBe(1);
      expect(report.totalVerified).toBe(0);
      expect(report.totalFailed).toBe(1);
      expect(report.cacheEntriesMissing).toBe(1);
      expect(report.s3ObjectsMissing).toBe(0);
      expect(report.successRate).toBe(0);

      const entry = report.entries[0];
      expect(entry.verified).toBe(false);
      expect(entry.cacheEntryExists).toBe(false);
      expect(entry.s3ObjectExists).toBe(false);
      expect(entry.error).toBe('Cache entry not found');
    });

    it('should detect missing S3 objects', async () => {
      // Mock storage manager with cache entry but missing S3 object
      const mockStorageManager = {
        getCachedContent: jest.fn().mockResolvedValue({
          s3Key: 'test-temple/artifact-1/en/audio_guide/123456.mp3',
          cacheKey: 'site1#artifact-1#en#audio_guide',
        }),
        verifyContentExists: jest.fn().mockResolvedValue(false), // S3 object missing
      };

      const artifacts = [{ artifactId: 'artifact-1', siteId: 'site1' }];
      const languages = [Language.ENGLISH];
      const contentTypes: ContentType[] = ['audio_guide'];

      const report = await reportGenerator.generateVerificationReport(
        artifacts,
        languages,
        contentTypes,
        mockStorageManager
      );

      expect(report.totalExpected).toBe(1);
      expect(report.totalVerified).toBe(0);
      expect(report.totalFailed).toBe(1);
      expect(report.cacheEntriesMissing).toBe(0);
      expect(report.s3ObjectsMissing).toBe(1);
      expect(report.successRate).toBe(0);

      const entry = report.entries[0];
      expect(entry.verified).toBe(false);
      expect(entry.cacheEntryExists).toBe(true);
      expect(entry.s3ObjectExists).toBe(false);
      expect(entry.error).toBe('S3 object not found');
    });

    it('should handle verification errors gracefully', async () => {
      // Mock storage manager that throws errors
      const mockStorageManager = {
        getCachedContent: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
        verifyContentExists: jest.fn().mockResolvedValue(false),
      };

      const artifacts = [{ artifactId: 'artifact-1', siteId: 'site1' }];
      const languages = [Language.ENGLISH];
      const contentTypes: ContentType[] = ['audio_guide'];

      const report = await reportGenerator.generateVerificationReport(
        artifacts,
        languages,
        contentTypes,
        mockStorageManager
      );

      expect(report.totalExpected).toBe(1);
      expect(report.totalVerified).toBe(0);
      expect(report.totalFailed).toBe(1);

      const entry = report.entries[0];
      expect(entry.verified).toBe(false);
      expect(entry.error).toContain('Verification error');
      expect(entry.error).toContain('DynamoDB error');
    });

    it('should calculate success rate correctly', async () => {
      // Mock storage manager with mixed results
      let callCount = 0;
      const mockStorageManager = {
        getCachedContent: jest.fn().mockImplementation(() => {
          callCount++;
          // First 3 calls succeed, last one fails
          if (callCount <= 3) {
            return Promise.resolve({
              s3Key: `test-temple/artifact-${callCount}/en/audio_guide/123456.mp3`,
              cacheKey: `site1#artifact-${callCount}#en#audio_guide`,
            });
          }
          return Promise.resolve(null);
        }),
        verifyContentExists: jest.fn().mockResolvedValue(true),
      };

      const artifacts = [
        { artifactId: 'artifact-1', siteId: 'site1' },
        { artifactId: 'artifact-2', siteId: 'site1' },
      ];
      const languages = [Language.ENGLISH, Language.HINDI];
      const contentTypes: ContentType[] = ['audio_guide'];

      const report = await reportGenerator.generateVerificationReport(
        artifacts,
        languages,
        contentTypes,
        mockStorageManager
      );

      expect(report.totalExpected).toBe(4);
      expect(report.totalVerified).toBe(3);
      expect(report.totalFailed).toBe(1);
      expect(report.successRate).toBe(75);
    });
  });

  describe('writeVerificationReport', () => {
    it('should write verification report in JSON format', async () => {
      const mockReport = {
        totalExpected: 10,
        totalVerified: 9,
        totalFailed: 1,
        cacheEntriesMissing: 0,
        s3ObjectsMissing: 1,
        successRate: 90,
        entries: [
          {
            artifactId: 'artifact-1',
            language: Language.ENGLISH,
            contentType: 'audio_guide' as ContentType,
            cacheEntryExists: true,
            s3ObjectExists: true,
            s3Key: 'test-temple/artifact-1/en/audio_guide/123456.mp3',
            verified: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      const reportPath = await reportGenerator.writeVerificationReport(mockReport, 'json');

      expect(fs.existsSync(reportPath)).toBe(true);
      expect(reportPath).toContain('verification-');
      expect(reportPath).toContain('.json');

      const content = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      expect(content.totalExpected).toBe(10);
      expect(content.totalVerified).toBe(9);
      expect(content.successRate).toBe(90);
    });

    it('should write verification report in CSV format', async () => {
      const mockReport = {
        totalExpected: 2,
        totalVerified: 1,
        totalFailed: 1,
        cacheEntriesMissing: 1,
        s3ObjectsMissing: 0,
        successRate: 50,
        entries: [
          {
            artifactId: 'artifact-1',
            language: Language.ENGLISH,
            contentType: 'audio_guide' as ContentType,
            cacheEntryExists: true,
            s3ObjectExists: true,
            s3Key: 'test-temple/artifact-1/en/audio_guide/123456.mp3',
            verified: true,
          },
          {
            artifactId: 'artifact-2',
            language: Language.HINDI,
            contentType: 'video' as ContentType,
            cacheEntryExists: false,
            s3ObjectExists: false,
            verified: false,
            error: 'Cache entry not found',
          },
        ],
        timestamp: new Date().toISOString(),
      };

      const reportPath = await reportGenerator.writeVerificationReport(mockReport, 'csv');

      expect(fs.existsSync(reportPath)).toBe(true);
      expect(reportPath).toContain('verification-');
      expect(reportPath).toContain('.csv');

      const content = fs.readFileSync(reportPath, 'utf-8');
      expect(content).toContain('Verification Summary');
      expect(content).toContain('Total Expected,2');
      expect(content).toContain('Total Verified,1');
      expect(content).toContain('artifact-1,en,audio_guide');
      expect(content).toContain('artifact-2,hi,video');
    });

    it('should write verification report in HTML format', async () => {
      const mockReport = {
        totalExpected: 1,
        totalVerified: 1,
        totalFailed: 0,
        cacheEntriesMissing: 0,
        s3ObjectsMissing: 0,
        successRate: 100,
        entries: [
          {
            artifactId: 'artifact-1',
            language: Language.ENGLISH,
            contentType: 'audio_guide' as ContentType,
            cacheEntryExists: true,
            s3ObjectExists: true,
            s3Key: 'test-temple/artifact-1/en/audio_guide/123456.mp3',
            verified: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      const reportPath = await reportGenerator.writeVerificationReport(mockReport, 'html');

      expect(fs.existsSync(reportPath)).toBe(true);
      expect(reportPath).toContain('verification-');
      expect(reportPath).toContain('.html');

      const content = fs.readFileSync(reportPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Content Verification Report');
      expect(content).toContain('All content verified successfully');
      expect(content).toContain('artifact-1');
    });
  });
});
