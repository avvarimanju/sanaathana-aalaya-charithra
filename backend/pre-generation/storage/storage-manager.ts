import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createHash } from 'crypto';
import {
  ContentCacheEntry,
  Language,
  ContentType,
  PreGenerationConfig,
} from '../types';

/**
 * StorageManager handles uploading content to S3 and creating cache entries in DynamoDB
 * Implements round-trip verification to ensure content integrity
 */
export class StorageManager {
  private s3Client: S3Client;
  private dynamoDBClient: DynamoDBClient;
  private config: PreGenerationConfig;

  constructor(config: PreGenerationConfig) {
    this.config = config;
    this.s3Client = new S3Client({ region: config.aws.region });
    this.dynamoDBClient = new DynamoDBClient({ region: config.aws.region });
  }

  /**
   * Upload content to S3 and create DynamoDB cache entry
   * Implements round-trip verification
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
    pollyVoiceId?: string;
  }): Promise<{
    s3Key: string;
    cdnUrl: string;
    contentHash: string;
    fileSize: number;
  }> {
    const {
      content,
      artifactId,
      siteId,
      templeGroup,
      language,
      contentType,
      mimeType,
      generationJobId,
      generationDuration,
      bedrockModelId,
      pollyVoiceId,
    } = params;

    // Calculate content hash
    const contentHash = this.calculateHash(content);
    const fileSize = content.length;

    // Generate S3 key
    const s3Key = this.generateS3Key(
      templeGroup,
      artifactId,
      language,
      contentType,
      mimeType
    );

    // Upload to S3
    await this.uploadToS3(s3Key, content, mimeType);

    // Round-trip verification
    await this.verifyUpload(s3Key, contentHash);

    // Generate CDN URL (placeholder - will be replaced with actual CloudFront URL)
    const cdnUrl = this.generateCDNUrl(s3Key);

    // Create DynamoDB cache entry
    await this.createCacheEntry({
      siteId,
      artifactId,
      language,
      contentType,
      s3Key,
      cdnUrl,
      contentHash,
      fileSize,
      mimeType,
      generationJobId,
      generationDuration,
      bedrockModelId,
      pollyVoiceId,
    });

    return {
      s3Key,
      cdnUrl,
      contentHash,
      fileSize,
    };
  }

  /**
   * Generate S3 key with structured format
   * Format: {templeGroup}/{artifactId}/{language}/{contentType}/{timestamp}.{extension}
   */
  private generateS3Key(
    templeGroup: string,
    artifactId: string,
    language: Language,
    contentType: ContentType,
    mimeType: string
  ): string {
    const timestamp = Date.now();
    const extension = this.getExtensionFromMimeType(mimeType);
    
    // Normalize temple group and artifact ID for S3 key (lowercase, replace spaces with hyphens)
    const normalizedTempleGroup = templeGroup.toLowerCase().replace(/\s+/g, '-');
    const normalizedArtifactId = artifactId.toLowerCase().replace(/\s+/g, '-');
    
    return `${normalizedTempleGroup}/${normalizedArtifactId}/${language}/${contentType}/${timestamp}.${extension}`;
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'video/mp4': 'mp4',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'application/json': 'json',
    };

    return mimeToExt[mimeType] || 'bin';
  }

  /**
   * Calculate SHA-256 hash of content
   */
  private calculateHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Upload content to S3
   */
  private async uploadToS3(
    key: string,
    content: Buffer,
    mimeType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.aws.s3.bucket,
      Key: key,
      Body: content,
      ContentType: mimeType,
      ServerSideEncryption: this.config.aws.s3.encryption as 'AES256',
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    });

    await this.s3Client.send(command);
  }

  /**
   * Verify upload by retrieving content and comparing hashes
   * Implements round-trip verification
   */
  private async verifyUpload(key: string, expectedHash: string): Promise<void> {
    // Retrieve content from S3
    const getCommand = new GetObjectCommand({
      Bucket: this.config.aws.s3.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(getCommand);
    
    if (!response.Body) {
      throw new Error(`Failed to retrieve content from S3: ${key}`);
    }

    // Convert stream to buffer
    const retrievedContent = await this.streamToBuffer(response.Body);

    // Calculate hash of retrieved content
    const retrievedHash = this.calculateHash(retrievedContent);

    // Compare hashes
    if (retrievedHash !== expectedHash) {
      throw new Error(
        `Round-trip verification failed for ${key}: expected hash ${expectedHash}, got ${retrievedHash}`
      );
    }
  }

  /**
   * Convert readable stream to buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  /**
   * Generate CDN URL from S3 key
   */
  private generateCDNUrl(s3Key: string): string {
    // For now, return S3 URL. In production, this would be CloudFront URL
    return `https://${this.config.aws.s3.bucket}.s3.${this.config.aws.region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Create cache entry in DynamoDB
   * Implements version tracking: increments version number and maintains version history
   */
  private async createCacheEntry(params: {
    siteId: string;
    artifactId: string;
    language: Language;
    contentType: ContentType;
    s3Key: string;
    cdnUrl: string;
    contentHash: string;
    fileSize: number;
    mimeType: string;
    generationJobId: string;
    generationDuration: number;
    bedrockModelId?: string;
    pollyVoiceId?: string;
  }): Promise<void> {
    const {
      siteId,
      artifactId,
      language,
      contentType,
      s3Key,
      cdnUrl,
      contentHash,
      fileSize,
      mimeType,
      generationJobId,
      generationDuration,
      bedrockModelId,
      pollyVoiceId,
    } = params;

    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + this.config.generation.cacheMaxAge;

    // Generate cache key: {siteId}#{artifactId}#{language}#{contentType}
    const cacheKey = `${siteId}#${artifactId}#${language}#${contentType}`;

    // Check for existing cache entry to implement version tracking
    const existingEntry = await this.getCachedContent(
      siteId,
      artifactId,
      language,
      contentType
    );

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
      previousVersions.push(existingEntry.version);

      // Keep original creation timestamp
      createdAt = existingEntry.createdAt;
    } else {
      // First time generation
      version = '1.0';
      previousVersions = undefined;
      createdAt = now;
    }

    const cacheEntry: ContentCacheEntry = {
      cacheKey,
      siteId,
      artifactId,
      language,
      contentType,
      s3Key,
      s3Bucket: this.config.aws.s3.bucket,
      cdnUrl,
      contentHash,
      fileSize,
      mimeType,
      generatedAt: now,
      generationJobId,
      generationDuration,
      bedrockModelId,
      pollyVoiceId,
      version,
      previousVersions,
      ttl,
      cacheControl: 'public, max-age=31536000, immutable',
      createdAt,
      updatedAt: now,
    };

    const command = new PutItemCommand({
      TableName: this.config.aws.dynamodb.cacheTable,
      Item: marshall(cacheEntry, { removeUndefinedValues: true }),
    });

    await this.dynamoDBClient.send(command);
  }

  /**
   * Check if cached content exists and is valid
   */
  async getCachedContent(
    siteId: string,
    artifactId: string,
    language: Language,
    contentType: ContentType
  ): Promise<ContentCacheEntry | null> {
    const cacheKey = `${siteId}#${artifactId}#${language}#${contentType}`;

    const command = new GetItemCommand({
      TableName: this.config.aws.dynamodb.cacheTable,
      Key: marshall({ cacheKey }),
    });

    const response = await this.dynamoDBClient.send(command);

    if (!response.Item) {
      return null;
    }

    const cacheEntry = unmarshall(response.Item) as ContentCacheEntry;

    // Check if cache is still valid (not expired)
    const now = Math.floor(Date.now() / 1000);
    if (cacheEntry.ttl && cacheEntry.ttl < now) {
      return null; // Cache expired
    }

    return cacheEntry;
  }

  /**
   * Check if content should be regenerated
   */
  async shouldRegenerate(
    siteId: string,
    artifactId: string,
    language: Language,
    contentType: ContentType,
    forceRegenerate: boolean
  ): Promise<boolean> {
    if (forceRegenerate) {
      return true;
    }

    const cachedContent = await this.getCachedContent(
      siteId,
      artifactId,
      language,
      contentType
    );

    if (!cachedContent) {
      return true; // No cached content, need to generate
    }

    // Check if cached content is less than cacheMaxAge old
    const generatedAt = new Date(cachedContent.generatedAt).getTime();
    const now = Date.now();
    const ageInSeconds = (now - generatedAt) / 1000;

    return ageInSeconds >= this.config.generation.cacheMaxAge;
  }

  /**
   * Retrieve content from S3
   */
  async retrieveContent(s3Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.config.aws.s3.bucket,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`Failed to retrieve content from S3: ${s3Key}`);
    }

    return this.streamToBuffer(response.Body);
  }

  /**
   * Verify content exists in S3
   */
  async verifyContentExists(s3Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.aws.s3.bucket,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
