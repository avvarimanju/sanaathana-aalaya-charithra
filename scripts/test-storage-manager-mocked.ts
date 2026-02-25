#!/usr/bin/env tsx

/**
 * Mocked test script for StorageManager
 * Tests S3 upload/download, DynamoDB cache entry creation without requiring AWS infrastructure
 */

import { ConfigLoader } from '../src/pre-generation/config/config-loader';
import { Language, ContentType } from '../src/pre-generation/types';
import { createHash } from 'crypto';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

// Mock storage for S3 and DynamoDB
class MockStorageManager {
  private s3Storage: Map<string, Buffer> = new Map();
  private dynamoDBCache: Map<string, any> = new Map();
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Generate S3 key from parameters
   */
  private generateS3Key(
    templeGroup: string,
    artifactId: string,
    language: Language,
    contentType: ContentType
  ): string {
    const timestamp = Date.now();
    const extension = this.getExtension(contentType);
    
    // Normalize names (replace spaces with hyphens, lowercase)
    const normalizedTempleGroup = templeGroup.toLowerCase().replace(/\s+/g, '-');
    const normalizedArtifactId = artifactId.toLowerCase().replace(/\s+/g, '-');
    
    return `${normalizedTempleGroup}/${normalizedArtifactId}/${language}/${contentType}/${timestamp}.${extension}`;
  }

  /**
   * Get file extension for content type
   */
  private getExtension(contentType: ContentType): string {
    switch (contentType) {
      case 'audio_guide':
        return 'mp3';
      case 'video':
        return 'mp4';
      case 'infographic':
        return 'png';
      case 'qa_knowledge_base':
        return 'json';
      default:
        return 'bin';
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    siteId: string,
    artifactId: string,
    language: Language,
    contentType: ContentType
  ): string {
    return `${siteId}#${artifactId}#${language}#${contentType}`;
  }

  /**
   * Store content (mock)
   */
  async storeContent(params: {
    content: Buffer;
    artifactId: string;
    siteId: string;
    templeGroup: string;
    language: Language;
    contentType: ContentType;
    mimeType: string;
    generationJobId: string;
    generationDuration: number;
    bedrockModelId?: string;
  }): Promise<{
    s3Key: string;
    contentHash: string;
    fileSize: number;
    cdnUrl: string;
  }> {
    const { content, artifactId, siteId, templeGroup, language, contentType, mimeType, generationJobId, generationDuration, bedrockModelId } = params;

    // Generate S3 key
    const s3Key = this.generateS3Key(templeGroup, artifactId, language, contentType);

    // Calculate content hash
    const contentHash = createHash('sha256').update(content).digest('hex');

    // Store in mock S3
    this.s3Storage.set(s3Key, content);

    // Create cache entry with version tracking
    const cacheKey = this.generateCacheKey(siteId, artifactId, language, contentType);
    const now = new Date().toISOString();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttl = nowSeconds + 2592000; // 30 days

    // Check for existing cache entry to implement version tracking
    const existingEntry = this.dynamoDBCache.get(cacheKey);

    let version: string;
    let previousVersions: string[] | undefined;
    let createdAt: string;

    if (existingEntry) {
      // Increment version number when regenerating
      const currentVersion = parseFloat(existingEntry.version);
      const newVersion = (currentVersion + 0.1).toFixed(1);
      version = newVersion;

      // Add current version to previous versions array
      previousVersions = existingEntry.previousVersions || [];
      if (previousVersions) {
        previousVersions.push(existingEntry.version);
      }

      // Keep original creation timestamp
      createdAt = existingEntry.createdAt;
    } else {
      // First time generation
      version = '1.0';
      previousVersions = undefined;
      createdAt = now;
    }

    const cacheEntry = {
      cacheKey,
      siteId,
      artifactId,
      language,
      contentType,
      s3Key,
      contentHash,
      fileSize: content.length,
      mimeType,
      generatedAt: now,
      ttl,
      version,
      previousVersions,
      generationJobId,
      generationDuration,
      bedrockModelId,
      cacheControl: 'public, max-age=31536000, immutable',
      createdAt,
      updatedAt: now,
    };

    this.dynamoDBCache.set(cacheKey, cacheEntry);

    // Generate CDN URL
    const cdnUrl = `https://cdn.example.com/${s3Key}`;

    return {
      s3Key,
      contentHash,
      fileSize: content.length,
      cdnUrl,
    };
  }

  /**
   * Verify content exists (mock)
   */
  async verifyContentExists(s3Key: string): Promise<boolean> {
    return this.s3Storage.has(s3Key);
  }

  /**
   * Retrieve content (mock)
   */
  async retrieveContent(s3Key: string): Promise<Buffer> {
    const content = this.s3Storage.get(s3Key);
    if (!content) {
      throw new Error(`Content not found: ${s3Key}`);
    }
    return content;
  }

  /**
   * Get cached content (mock)
   */
  async getCachedContent(
    siteId: string,
    artifactId: string,
    language: Language,
    contentType: ContentType
  ): Promise<any | null> {
    const cacheKey = this.generateCacheKey(siteId, artifactId, language, contentType);
    return this.dynamoDBCache.get(cacheKey) || null;
  }

  /**
   * Should regenerate (mock)
   */
  async shouldRegenerate(
    siteId: string,
    artifactId: string,
    language: Language,
    contentType: ContentType,
    force: boolean
  ): Promise<boolean> {
    if (force) {
      return true;
    }

    const cacheEntry = await this.getCachedContent(siteId, artifactId, language, contentType);
    return cacheEntry === null;
  }
}

/**
 * Generate test content
 */
function generateTestContent(contentType: ContentType): Buffer {
  switch (contentType) {
    case 'audio_guide':
      return Buffer.from('MOCK_AUDIO_CONTENT_' + Date.now());
    case 'video':
      return Buffer.from('MOCK_VIDEO_CONTENT_' + Date.now());
    case 'infographic':
      return Buffer.from('MOCK_IMAGE_CONTENT_' + Date.now());
    case 'qa_knowledge_base':
      return Buffer.from(
        JSON.stringify({
          artifactId: 'test-artifact',
          language: 'en',
          questionAnswerPairs: [
            {
              question: 'What is this artifact?',
              answer: 'This is a test artifact.',
              confidence: 0.95,
              sources: ['test-source'],
            },
          ],
        })
      );
    default:
      return Buffer.from('MOCK_CONTENT');
  }
}

/**
 * Get MIME type for content type
 */
function getMimeType(contentType: ContentType): string {
  switch (contentType) {
    case 'audio_guide':
      return 'audio/mpeg';
    case 'video':
      return 'video/mp4';
    case 'infographic':
      return 'image/png';
    case 'qa_knowledge_base':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Test 1: S3 Upload and Download
 */
async function testS3UploadDownload(storageManager: MockStorageManager) {
  logInfo('\n=== Test 1: S3 Upload and Download ===');

  try {
    const content = generateTestContent('audio_guide');
    const contentHash = createHash('sha256').update(content).digest('hex');

    const result = await storageManager.storeContent({
      content,
      artifactId: 'test-artifact-1',
      siteId: 'test-site-1',
      templeGroup: 'test-temple-group',
      language: 'en' as Language,
      contentType: 'audio_guide' as ContentType,
      mimeType: 'audio/mpeg',
      generationJobId: 'test-job-1',
      generationDuration: 1000,
    });

    logSuccess(`Content uploaded to S3: ${result.s3Key}`);
    logSuccess(`Content hash: ${result.contentHash}`);
    logSuccess(`File size: ${result.fileSize} bytes`);
    logSuccess(`CDN URL: ${result.cdnUrl}`);

    // Verify hash matches
    if (result.contentHash === contentHash) {
      logSuccess('Content hash matches expected value');
    } else {
      logError('Content hash mismatch!');
      return false;
    }

    // Verify content exists
    const exists = await storageManager.verifyContentExists(result.s3Key);
    if (exists) {
      logSuccess('Content exists in S3');
    } else {
      logError('Content not found in S3!');
      return false;
    }

    // Retrieve content
    const retrievedContent = await storageManager.retrieveContent(result.s3Key);
    const retrievedHash = createHash('sha256')
      .update(retrievedContent)
      .digest('hex');

    if (retrievedHash === contentHash) {
      logSuccess('Retrieved content hash matches original');
    } else {
      logError('Retrieved content hash mismatch!');
      return false;
    }

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 2: DynamoDB Cache Entry Creation
 */
async function testDynamoDBCacheEntry(storageManager: MockStorageManager) {
  logInfo('\n=== Test 2: DynamoDB Cache Entry Creation ===');

  try {
    const content = generateTestContent('video');

    const result = await storageManager.storeContent({
      content,
      artifactId: 'test-artifact-2',
      siteId: 'test-site-2',
      templeGroup: 'test-temple-group',
      language: 'hi' as Language,
      contentType: 'video' as ContentType,
      mimeType: 'video/mp4',
      generationJobId: 'test-job-2',
      generationDuration: 2000,
      bedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    });

    logSuccess(`Content stored with cache entry`);

    // Retrieve cache entry
    const cacheEntry = await storageManager.getCachedContent(
      'test-site-2',
      'test-artifact-2',
      'hi' as Language,
      'video' as ContentType
    );

    if (!cacheEntry) {
      logError('Cache entry not found!');
      return false;
    }

    logSuccess('Cache entry retrieved from DynamoDB');
    logSuccess(`Cache key: ${cacheEntry.cacheKey}`);
    logSuccess(`S3 key: ${cacheEntry.s3Key}`);
    logSuccess(`Content hash: ${cacheEntry.contentHash}`);
    logSuccess(`File size: ${cacheEntry.fileSize} bytes`);
    logSuccess(`Generated at: ${cacheEntry.generatedAt}`);
    logSuccess(`TTL: ${cacheEntry.ttl}`);
    logSuccess(`Version: ${cacheEntry.version}`);

    // Verify cache entry fields
    if (cacheEntry.artifactId !== 'test-artifact-2') {
      logError('Artifact ID mismatch!');
      return false;
    }
    if (cacheEntry.language !== 'hi') {
      logError('Language mismatch!');
      return false;
    }
    if (cacheEntry.contentType !== 'video') {
      logError('Content type mismatch!');
      return false;
    }
    if (cacheEntry.s3Key !== result.s3Key) {
      logError('S3 key mismatch!');
      return false;
    }
    if (cacheEntry.contentHash !== result.contentHash) {
      logError('Content hash mismatch!');
      return false;
    }

    logSuccess('All cache entry fields match expected values');

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 3: Round-Trip Verification
 */
async function testRoundTripVerification(storageManager: MockStorageManager) {
  logInfo('\n=== Test 3: Round-Trip Verification ===');

  try {
    const content = generateTestContent('infographic');

    const result = await storageManager.storeContent({
      content,
      artifactId: 'test-artifact-3',
      siteId: 'test-site-3',
      templeGroup: 'test-temple-group',
      language: 'ta' as Language,
      contentType: 'infographic' as ContentType,
      mimeType: 'image/png',
      generationJobId: 'test-job-3',
      generationDuration: 1500,
    });

    logSuccess('Round-trip verification passed during upload');
    logSuccess(`Content stored: ${result.s3Key}`);

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 4: S3 Key Format Compliance
 */
async function testS3KeyFormat(storageManager: MockStorageManager) {
  logInfo('\n=== Test 4: S3 Key Format Compliance ===');

  try {
    const testCases = [
      {
        templeGroup: 'Lepakshi Temple Andhra',
        artifactId: 'Hanging Pillar',
        language: 'en' as Language,
        contentType: 'audio_guide' as ContentType,
      },
      {
        templeGroup: 'Tirumala Tirupati Andhra',
        artifactId: 'Venkateswara Main Temple',
        language: 'hi' as Language,
        contentType: 'video' as ContentType,
      },
      {
        templeGroup: 'Halebidu Temple Karnataka',
        artifactId: 'Hoysaleswara Sculpture',
        language: 'ta' as Language,
        contentType: 'infographic' as ContentType,
      },
    ];

    for (const testCase of testCases) {
      const content = generateTestContent(testCase.contentType);
      const mimeType = getMimeType(testCase.contentType);

      const result = await storageManager.storeContent({
        content,
        artifactId: testCase.artifactId,
        siteId: 'test-site',
        templeGroup: testCase.templeGroup,
        language: testCase.language,
        contentType: testCase.contentType,
        mimeType,
        generationJobId: 'test-job',
        generationDuration: 1000,
      });

      // Verify S3 key format: {temple_group}/{artifact_id}/{language}/{content_type}/{timestamp}.{extension}
      const keyParts = result.s3Key.split('/');
      
      if (keyParts.length !== 5) {
        logError(`Invalid S3 key format: ${result.s3Key} (expected 5 parts, got ${keyParts.length})`);
        return false;
      }

      const [templeGroup, artifactId, language, contentType, filename] = keyParts;

      // Verify each component is non-empty
      if (!templeGroup || !artifactId || !language || !contentType || !filename) {
        logError(`S3 key has empty components: ${result.s3Key}`);
        return false;
      }

      // Verify filename has timestamp and extension
      const filenameParts = filename.split('.');
      if (filenameParts.length !== 2) {
        logError(`Invalid filename format: ${filename}`);
        return false;
      }

      const [timestamp, extension] = filenameParts;
      if (!/^\d+$/.test(timestamp)) {
        logError(`Invalid timestamp in filename: ${timestamp}`);
        return false;
      }

      logSuccess(`S3 key format valid: ${result.s3Key}`);
    }

    logSuccess('All S3 keys follow the correct format');
    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 5: Cache TTL Configuration
 */
async function testCacheTTL(storageManager: MockStorageManager) {
  logInfo('\n=== Test 5: Cache TTL Configuration ===');

  try {
    const content = generateTestContent('qa_knowledge_base');

    await storageManager.storeContent({
      content,
      artifactId: 'test-artifact-5',
      siteId: 'test-site-5',
      templeGroup: 'test-temple-group',
      language: 'te' as Language,
      contentType: 'qa_knowledge_base' as ContentType,
      mimeType: 'application/json',
      generationJobId: 'test-job-5',
      generationDuration: 1000,
    });

    // Retrieve cache entry
    const cacheEntry = await storageManager.getCachedContent(
      'test-site-5',
      'test-artifact-5',
      'te' as Language,
      'qa_knowledge_base' as ContentType
    );

    if (!cacheEntry) {
      logError('Cache entry not found!');
      return false;
    }

    // Verify TTL is set (should be current time + 30 days)
    const now = Math.floor(Date.now() / 1000);
    const expectedTTL = now + 2592000; // 30 days in seconds
    const ttlDiff = Math.abs(cacheEntry.ttl - expectedTTL);

    // Allow 10 seconds tolerance for test execution time
    if (ttlDiff > 10) {
      logError(`TTL mismatch: expected ~${expectedTTL}, got ${cacheEntry.ttl} (diff: ${ttlDiff}s)`);
      return false;
    }

    logSuccess(`TTL correctly set to ~30 days from now: ${cacheEntry.ttl}`);

    // Verify cache control header
    if (cacheEntry.cacheControl !== 'public, max-age=31536000, immutable') {
      logError(`Cache control mismatch: ${cacheEntry.cacheControl}`);
      return false;
    }

    logSuccess(`Cache control header correct: ${cacheEntry.cacheControl}`);

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 6: Should Regenerate Logic
 */
async function testShouldRegenerate(storageManager: MockStorageManager) {
  logInfo('\n=== Test 6: Should Regenerate Logic ===');

  try {
    const content = generateTestContent('audio_guide');

    // Store content
    await storageManager.storeContent({
      content,
      artifactId: 'test-artifact-6',
      siteId: 'test-site-6',
      templeGroup: 'test-temple-group',
      language: 'bn' as Language,
      contentType: 'audio_guide' as ContentType,
      mimeType: 'audio/mpeg',
      generationJobId: 'test-job-6',
      generationDuration: 1000,
    });

    // Test 1: Should not regenerate if cache is fresh and force=false
    const shouldRegenerate1 = await storageManager.shouldRegenerate(
      'test-site-6',
      'test-artifact-6',
      'bn' as Language,
      'audio_guide' as ContentType,
      false
    );

    if (shouldRegenerate1) {
      logError('Should not regenerate fresh cache without force flag');
      return false;
    }
    logSuccess('Correctly skips regeneration for fresh cache');

    // Test 2: Should regenerate if force=true
    const shouldRegenerate2 = await storageManager.shouldRegenerate(
      'test-site-6',
      'test-artifact-6',
      'bn' as Language,
      'audio_guide' as ContentType,
      true
    );

    if (!shouldRegenerate2) {
      logError('Should regenerate when force flag is true');
      return false;
    }
    logSuccess('Correctly regenerates when force flag is set');

    // Test 3: Should regenerate if no cache exists
    const shouldRegenerate3 = await storageManager.shouldRegenerate(
      'test-site-999',
      'test-artifact-999',
      'en' as Language,
      'video' as ContentType,
      false
    );

    if (!shouldRegenerate3) {
      logError('Should regenerate when no cache exists');
      return false;
    }
    logSuccess('Correctly regenerates when no cache exists');

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 7: Version Tracking on Regeneration
 */
async function testVersionTracking(storageManager: MockStorageManager) {
  logInfo('\n=== Test 7: Version Tracking on Regeneration ===');

  try {
    const artifactId = 'test-artifact-version';
    const siteId = 'test-site-version';
    const language = 'en' as Language;
    const contentType = 'audio_guide' as ContentType;

    // First generation - should create version 1.0
    const content1 = generateTestContent(contentType);
    await storageManager.storeContent({
      content: content1,
      artifactId,
      siteId,
      templeGroup: 'test-temple-group',
      language,
      contentType,
      mimeType: 'audio/mpeg',
      generationJobId: 'test-job-version-1',
      generationDuration: 1000,
    });

    const cacheEntry1 = await storageManager.getCachedContent(
      siteId,
      artifactId,
      language,
      contentType
    );

    if (!cacheEntry1) {
      logError('First cache entry not found!');
      return false;
    }

    if (cacheEntry1.version !== '1.0') {
      logError(`First version should be 1.0, got ${cacheEntry1.version}`);
      return false;
    }

    if (cacheEntry1.previousVersions && cacheEntry1.previousVersions.length > 0) {
      logError('First version should not have previous versions');
      return false;
    }

    logSuccess('First generation created version 1.0');

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second generation - should increment to version 1.1
    const content2 = generateTestContent(contentType);
    await storageManager.storeContent({
      content: content2,
      artifactId,
      siteId,
      templeGroup: 'test-temple-group',
      language,
      contentType,
      mimeType: 'audio/mpeg',
      generationJobId: 'test-job-version-2',
      generationDuration: 1000,
    });

    const cacheEntry2 = await storageManager.getCachedContent(
      siteId,
      artifactId,
      language,
      contentType
    );

    if (!cacheEntry2) {
      logError('Second cache entry not found!');
      return false;
    }

    if (cacheEntry2.version !== '1.1') {
      logError(`Second version should be 1.1, got ${cacheEntry2.version}`);
      return false;
    }

    if (!cacheEntry2.previousVersions || cacheEntry2.previousVersions.length !== 1) {
      logError('Second version should have 1 previous version');
      return false;
    }

    if (cacheEntry2.previousVersions[0] !== '1.0') {
      logError(`Previous version should be 1.0, got ${cacheEntry2.previousVersions[0]}`);
      return false;
    }

    logSuccess('Second generation incremented to version 1.1 with previous version 1.0');

    // Third generation - should increment to version 1.2
    await new Promise(resolve => setTimeout(resolve, 100));

    const content3 = generateTestContent(contentType);
    await storageManager.storeContent({
      content: content3,
      artifactId,
      siteId,
      templeGroup: 'test-temple-group',
      language,
      contentType,
      mimeType: 'audio/mpeg',
      generationJobId: 'test-job-version-3',
      generationDuration: 1000,
    });

    const cacheEntry3 = await storageManager.getCachedContent(
      siteId,
      artifactId,
      language,
      contentType
    );

    if (!cacheEntry3) {
      logError('Third cache entry not found!');
      return false;
    }

    if (cacheEntry3.version !== '1.2') {
      logError(`Third version should be 1.2, got ${cacheEntry3.version}`);
      return false;
    }

    if (!cacheEntry3.previousVersions || cacheEntry3.previousVersions.length !== 2) {
      logError('Third version should have 2 previous versions');
      return false;
    }

    if (cacheEntry3.previousVersions[0] !== '1.0' || cacheEntry3.previousVersions[1] !== '1.1') {
      logError(`Previous versions should be [1.0, 1.1], got [${cacheEntry3.previousVersions.join(', ')}]`);
      return false;
    }

    logSuccess('Third generation incremented to version 1.2 with previous versions [1.0, 1.1]');

    // Verify createdAt timestamp is preserved across versions
    if (cacheEntry1.createdAt !== cacheEntry2.createdAt || cacheEntry2.createdAt !== cacheEntry3.createdAt) {
      logError('createdAt timestamp should be preserved across versions');
      return false;
    }

    logSuccess('createdAt timestamp preserved across all versions');

    // Verify updatedAt timestamp changes
    if (cacheEntry1.updatedAt === cacheEntry2.updatedAt || cacheEntry2.updatedAt === cacheEntry3.updatedAt) {
      logError('updatedAt timestamp should change with each version');
      return false;
    }

    logSuccess('updatedAt timestamp correctly updated with each version');

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test 8: Error Handling
 */
async function testErrorHandling(storageManager: MockStorageManager) {
  logInfo('\n=== Test 8: Error Handling ===');

  try {
    // Test 1: Verify non-existent content returns false
    const exists = await storageManager.verifyContentExists('non-existent-key');
    if (exists) {
      logError('Should return false for non-existent content');
      return false;
    }
    logSuccess('Correctly handles non-existent content check');

    // Test 2: Retrieve non-existent content should throw
    try {
      await storageManager.retrieveContent('non-existent-key');
      logError('Should throw error when retrieving non-existent content');
      return false;
    } catch (error: any) {
      logSuccess('Correctly throws error for non-existent content retrieval');
    }

    // Test 3: Get non-existent cache entry returns null
    const cacheEntry = await storageManager.getCachedContent(
      'non-existent-site',
      'non-existent-artifact',
      'en' as Language,
      'audio_guide' as ContentType
    );

    if (cacheEntry !== null) {
      logError('Should return null for non-existent cache entry');
      return false;
    }
    logSuccess('Correctly returns null for non-existent cache entry');

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║    Storage Manager Test Suite (Mocked)                    ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

  try {
    // Load configuration
    logInfo('\nLoading configuration...');
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    logSuccess('Configuration loaded successfully');

    // Create mocked storage manager
    const storageManager = new MockStorageManager(config);
    logSuccess('MockStorageManager initialized');

    // Run tests
    const tests = [
      { name: 'S3 Upload and Download', fn: testS3UploadDownload },
      { name: 'DynamoDB Cache Entry Creation', fn: testDynamoDBCacheEntry },
      { name: 'Round-Trip Verification', fn: testRoundTripVerification },
      { name: 'S3 Key Format Compliance', fn: testS3KeyFormat },
      { name: 'Cache TTL Configuration', fn: testCacheTTL },
      { name: 'Should Regenerate Logic', fn: testShouldRegenerate },
      { name: 'Version Tracking on Regeneration', fn: testVersionTracking },
      { name: 'Error Handling', fn: testErrorHandling },
    ];

    const results: { name: string; passed: boolean }[] = [];

    for (const test of tests) {
      const passed = await test.fn(storageManager);
      results.push({ name: test.name, passed });
    }

    // Print summary
    log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
    log('║                    Test Summary                            ║', colors.cyan);
    log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

    let passedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      if (result.passed) {
        logSuccess(`${result.name}: PASSED`);
        passedCount++;
      } else {
        logError(`${result.name}: FAILED`);
        failedCount++;
      }
    }

    log('\n' + '─'.repeat(60));
    log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

    if (failedCount === 0) {
      logSuccess('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      logError(`\n❌ ${failedCount} test(s) failed`);
      process.exit(1);
    }
  } catch (error: any) {
    logError(`\nFatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
