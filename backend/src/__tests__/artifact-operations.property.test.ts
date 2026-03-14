/**
 * Property-Based Tests for Artifact Operations
 * 
 * **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.10**
 * 
 * These tests use fast-check to verify artifact CRUD operations across
 * a wide range of inputs, ensuring the artifact management system behaves
 * correctly under all conditions.
 */

// Import fast-check with require to avoid TypeScript module resolution issues
const fc = require('fast-check');

// Mock artifact data structure based on the Python handler
interface Artifact {
  artifactId: string;
  siteId: string;
  artifactName: string;
  description: string;
  qrCode: string;
  qrCodeUrl: string;
  media: {
    images: string[];
    videos: string[];
  };
  content: {
    hasTextContent: boolean;
    hasAudioGuide: boolean;
    hasQA: boolean;
    hasInfographic: boolean;
    languages: string[];
  };
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  category?: string;
  historicalPeriod?: string;
}

interface ArtifactCreationRequest {
  artifactName: string;
  siteId: string;
  description: string;
  images?: string[];
  videos?: string[];
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  category?: string;
  historicalPeriod?: string;
}

interface Temple {
  siteId: string;
  siteName: string;
  deleted: boolean;
}

// Mock content cache entry
interface ContentCacheEntry {
  cacheKey: string;
  content: string | object;
  s3Url?: string;
  ttl: number;
  createdAt: string;
}
// Mock artifact service functions
class ArtifactService {
  private artifacts: Map<string, Artifact> = new Map();
  private temples: Map<string, Temple> = new Map();
  private contentCache: Map<string, ContentCacheEntry> = new Map();
  private qrCodes: Set<string> = new Set();

  // Add a temple for testing
  addTemple(temple: Temple): void {
    this.temples.set(temple.siteId, temple);
  }

  // Generate unique QR code
  private generateQRCode(artifactId: string): string {
    let qrCode: string;
    let attempts = 0;
    do {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 8).toUpperCase();
      qrCode = `QR-${artifactId.substr(0, 8)}-${random}`;
      attempts++;
      if (attempts > 100) {
        throw new Error('Unable to generate unique QR code');
      }
    } while (this.qrCodes.has(qrCode));
    
    this.qrCodes.add(qrCode);
    return qrCode;
  }

  // Generate QR code URL
  private generateQRCodeUrl(artifactId: string, qrCode: string): string {
    return `https://sanaathana-aalaya-charithra-content.s3.amazonaws.com/artifacts/${artifactId}/qr-codes/${qrCode}.png`;
  }

  createArtifact(request: ArtifactCreationRequest, userId: string): Artifact {
    // Validate required fields
    if (!request.artifactName || request.artifactName.trim().length === 0) {
      throw new Error('Missing required field: artifactName');
    }
    if (!request.siteId || request.siteId.trim().length === 0) {
      throw new Error('Missing required field: siteId');
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Missing required field: description');
    }

    // Validate temple exists
    const temple = this.temples.get(request.siteId);
    if (!temple || temple.deleted) {
      throw new Error(`Temple not found: ${request.siteId}`);
    }

    // Generate artifact ID and QR code
    const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const qrCode = this.generateQRCode(artifactId);
    const qrCodeUrl = this.generateQRCodeUrl(artifactId, qrCode);
    const timestamp = new Date().toISOString();

    const artifact: Artifact = {
      artifactId,
      siteId: request.siteId,
      artifactName: request.artifactName,
      description: request.description,
      qrCode,
      qrCodeUrl,
      media: {
        images: request.images || [],
        videos: request.videos || [],
      },
      content: {
        hasTextContent: false,
        hasAudioGuide: false,
        hasQA: false,
        hasInfographic: false,
        languages: [],
      },
      status: request.status || 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      deleted: false,
    };

    // Add optional fields
    if (request.category) {
      artifact.category = request.category;
    }
    if (request.historicalPeriod) {
      artifact.historicalPeriod = request.historicalPeriod;
    }

    this.artifacts.set(artifactId, artifact);
    return artifact;
  }
  updateArtifact(artifactId: string, updates: Partial<ArtifactCreationRequest>, userId: string): Artifact {
    const existing = this.artifacts.get(artifactId);
    if (!existing || existing.deleted) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const updated: Artifact = {
      ...existing,
      ...updates,
      artifactId: existing.artifactId, // Preserve original ID
      siteId: existing.siteId, // Preserve site association
      qrCode: existing.qrCode, // Preserve QR code
      qrCodeUrl: existing.qrCodeUrl, // Preserve QR code URL
      createdAt: existing.createdAt, // Preserve creation time
      createdBy: existing.createdBy, // Preserve creator
      updatedAt: new Date().toISOString(),
    };

    this.artifacts.set(artifactId, updated);
    
    // Invalidate cache for this artifact
    this.invalidateContentCache(artifactId);
    
    return updated;
  }

  deleteArtifact(artifactId: string, userId: string): Artifact {
    const existing = this.artifacts.get(artifactId);
    if (!existing || existing.deleted) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const deleted: Artifact = {
      ...existing,
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    this.artifacts.set(artifactId, deleted);
    
    // Invalidate cache for this artifact
    this.invalidateContentCache(artifactId);
    
    return deleted;
  }

  getArtifact(artifactId: string): Artifact | null {
    const artifact = this.artifacts.get(artifactId);
    return artifact && !artifact.deleted ? artifact : null;
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values()).filter(a => !a.deleted);
  }

  // Cache management methods
  addContentCache(artifactId: string, language: string, contentType: string, content: string): void {
    const cacheKey = `${artifactId}#${language}#${contentType}`;
    const cacheEntry: ContentCacheEntry = {
      cacheKey,
      content,
      ttl: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date().toISOString(),
    };
    this.contentCache.set(cacheKey, cacheEntry);
  }

  getCacheEntriesForArtifact(artifactId: string): ContentCacheEntry[] {
    return Array.from(this.contentCache.values())
      .filter(entry => entry.cacheKey.startsWith(`${artifactId}#`));
  }

  invalidateContentCache(artifactId: string): void {
    const keysToDelete: string[] = [];
    this.contentCache.forEach((entry, key) => {
      if (entry.cacheKey.startsWith(`${artifactId}#`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.contentCache.delete(key));
  }

  // Check if QR code exists
  qrCodeExists(qrCode: string): boolean {
    return this.qrCodes.has(qrCode);
  }

  // Get all QR codes
  getAllQRCodes(): string[] {
    return Array.from(this.qrCodes);
  }

  clear(): void {
    this.artifacts.clear();
    this.temples.clear();
    this.contentCache.clear();
    this.qrCodes.clear();
  }
}
describe('Artifact Operations Properties', () => {
  let artifactService: ArtifactService;

  beforeEach(() => {
    artifactService = new ArtifactService();
  });

  // Test data generators using fast-check
  const validArtifactNameArb = fc.string({ minLength: 3, maxLength: 100 })
    .filter(name => name.trim().length >= 3);

  const validSiteIdArb = fc.string({ minLength: 10, maxLength: 50 })
    .filter(id => id.trim().length >= 10);

  const validDescriptionArb = fc.string({ minLength: 10, maxLength: 1000 })
    .filter(desc => desc.trim().length >= 10);

  const validTempleArb = fc.record({
    siteId: validSiteIdArb,
    siteName: fc.string({ minLength: 3, maxLength: 100 }),
    deleted: fc.constant(false),
  });

  const validArtifactRequestArb = fc.record({
    artifactName: validArtifactNameArb,
    siteId: validSiteIdArb,
    description: validDescriptionArb,
    images: fc.array(fc.webUrl(), { maxLength: 5 }),
    videos: fc.array(fc.webUrl(), { maxLength: 3 }),
    status: fc.option(fc.constantFrom('ACTIVE', 'ARCHIVED', 'DRAFT')),
    category: fc.option(fc.string({ minLength: 3, maxLength: 50 })),
    historicalPeriod: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
  });

  /**
   * **Property 10: Artifact creation includes all required fields**
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 10: Artifact creation includes all required fields', () => {
    it('should create artifact with all required fields', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, userId) => {
            // Add temple to service
            artifactService.addTemple(temple);
            
            // Use temple's siteId in request
            const artifactRequest = { ...request, siteId: temple.siteId };
            
            const createdArtifact = artifactService.createArtifact(artifactRequest, userId);

            // Verify all required fields are present
            expect(createdArtifact.artifactId).toBeDefined();
            expect(createdArtifact.artifactId).toMatch(/^artifact-\d+-[a-z0-9]{9}$/);
            
            expect(createdArtifact.siteId).toBe(temple.siteId);
            expect(createdArtifact.artifactName).toBe(artifactRequest.artifactName);
            expect(createdArtifact.description).toBe(artifactRequest.description);
            
            // Verify QR code fields
            expect(createdArtifact.qrCode).toBeDefined();
            expect(createdArtifact.qrCode).toMatch(/^QR-[A-Z0-9]{8}-[A-Z0-9]{8}$/);
            expect(createdArtifact.qrCodeUrl).toBeDefined();
            expect(createdArtifact.qrCodeUrl).toContain(createdArtifact.artifactId);
            expect(createdArtifact.qrCodeUrl).toContain(createdArtifact.qrCode);
            
            // Verify media structure
            expect(createdArtifact.media).toBeDefined();
            expect(createdArtifact.media.images).toEqual(artifactRequest.images || []);
            expect(createdArtifact.media.videos).toEqual(artifactRequest.videos || []);
            
            // Verify content structure
            expect(createdArtifact.content).toBeDefined();
            expect(createdArtifact.content.hasTextContent).toBe(false);
            expect(createdArtifact.content.hasAudioGuide).toBe(false);
            expect(createdArtifact.content.hasQA).toBe(false);
            expect(createdArtifact.content.hasInfographic).toBe(false);
            expect(createdArtifact.content.languages).toEqual([]);
            
            // Verify status
            expect(createdArtifact.status).toBe(artifactRequest.status || 'ACTIVE');
            
            // Verify metadata fields
            expect(createdArtifact.createdAt).toBeDefined();
            expect(createdArtifact.updatedAt).toBeDefined();
            expect(createdArtifact.createdBy).toBe(userId);
            expect(createdArtifact.deleted).toBe(false);
            
            // Verify optional fields
            if (artifactRequest.category) {
              expect(createdArtifact.category).toBe(artifactRequest.category);
            }
            if (artifactRequest.historicalPeriod) {
              expect(createdArtifact.historicalPeriod).toBe(artifactRequest.historicalPeriod);
            }
            
            // Verify timestamps are valid ISO strings
            expect(new Date(createdArtifact.createdAt).toISOString()).toBe(createdArtifact.createdAt);
            expect(new Date(createdArtifact.updatedAt).toISOString()).toBe(createdArtifact.updatedAt);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
    it('should validate required fields and reject missing data', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          fc.record({
            artifactName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            siteId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            description: fc.option(fc.string({ minLength: 1, maxLength: 1000 })),
          }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, partialRequest, userId) => {
            // Add temple to service
            artifactService.addTemple(temple);
            
            // Create request with potentially missing required fields
            const request = {
              artifactName: partialRequest.artifactName || '',
              siteId: partialRequest.siteId || temple.siteId,
              description: partialRequest.description || '',
            };
            
            const hasValidName = request.artifactName && request.artifactName.trim().length > 0;
            const hasValidSiteId = request.siteId && request.siteId.trim().length > 0;
            const hasValidDescription = request.description && request.description.trim().length > 0;
            
            if (!hasValidName || !hasValidSiteId || !hasValidDescription) {
              expect(() => {
                artifactService.createArtifact(request, userId);
              }).toThrow(/Missing required field/);
            } else {
              // Should succeed if all required fields are present
              const artifact = artifactService.createArtifact(request, userId);
              expect(artifact.artifactId).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject creation for non-existent temples', () => {
      fc.assert(
        fc.property(
          validArtifactRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (request, userId) => {
            // Don't add temple to service - it won't exist
            expect(() => {
              artifactService.createArtifact(request, userId);
            }).toThrow(/Temple not found/);
          }
        ),
        { numRuns: 30 }
      );
    });

  /**
   * **Property 11: QR codes are globally unique**
   * **Validates: Requirements 3.2, 3.6**
   */
  describe('Property 11: QR codes are globally unique', () => {
    it('should generate unique QR codes for all artifacts', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          fc.array(validArtifactRequestArb, { minLength: 2, maxLength: 20 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, requests, userId) => {
            // Add temple to service
            artifactService.addTemple(temple);
            
            const qrCodes = new Set<string>();
            const artifacts: Artifact[] = [];
            
            // Create multiple artifacts
            requests.forEach((request, index) => {
              const artifactRequest = { 
                ...request, 
                siteId: temple.siteId,
                artifactName: `${request.artifactName}-${index}` // Ensure unique names
              };
              
              const artifact = artifactService.createArtifact(artifactRequest, `${userId}-${index}`);
              artifacts.push(artifact);
              qrCodes.add(artifact.qrCode);
            });
            
            // All QR codes should be unique
            expect(qrCodes.size).toBe(artifacts.length);
            
            // Verify QR codes follow expected format
            artifacts.forEach(artifact => {
              expect(artifact.qrCode).toMatch(/^QR-[A-Z0-9]{8}-[A-Z0-9]{8}$/);
              expect(artifactService.qrCodeExists(artifact.qrCode)).toBe(true);
            });
            
            // Verify QR code URLs are unique and properly formatted
            const qrCodeUrls = new Set(artifacts.map(a => a.qrCodeUrl));
            expect(qrCodeUrls.size).toBe(artifacts.length);
            
            artifacts.forEach(artifact => {
              expect(artifact.qrCodeUrl).toContain(artifact.artifactId);
              expect(artifact.qrCodeUrl).toContain(artifact.qrCode);
              expect(artifact.qrCodeUrl).toMatch(/^https:\/\/.*\.s3\.amazonaws\.com\/artifacts\/.*\/qr-codes\/.*\.png$/);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain QR code uniqueness across service restarts', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          fc.array(validArtifactRequestArb, { minLength: 3, maxLength: 10 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, requests, userId) => {
            // Add temple to service
            artifactService.addTemple(temple);
            
            const firstBatchQRCodes: string[] = [];
            
            // Create first batch of artifacts
            requests.slice(0, Math.ceil(requests.length / 2)).forEach((request, index) => {
              const artifactRequest = { 
                ...request, 
                siteId: temple.siteId,
                artifactName: `${request.artifactName}-batch1-${index}`
              };
              
              const artifact = artifactService.createArtifact(artifactRequest, `${userId}-1-${index}`);
              firstBatchQRCodes.push(artifact.qrCode);
            });
            
            // Simulate service restart by creating new service but preserving QR codes
            const existingQRCodes = artifactService.getAllQRCodes();
            const newService = new ArtifactService();
            newService.addTemple(temple);
            
            // Manually add existing QR codes to simulate persistence
            existingQRCodes.forEach(qr => {
              (newService as any).qrCodes.add(qr);
            });
            
            // Create second batch with new service
            const secondBatchQRCodes: string[] = [];
            requests.slice(Math.ceil(requests.length / 2)).forEach((request, index) => {
              const artifactRequest = { 
                ...request, 
                siteId: temple.siteId,
                artifactName: `${request.artifactName}-batch2-${index}`
              };
              
              const artifact = newService.createArtifact(artifactRequest, `${userId}-2-${index}`);
              secondBatchQRCodes.push(artifact.qrCode);
            });
            
            // Verify no QR code collisions between batches
            const allQRCodes = [...firstBatchQRCodes, ...secondBatchQRCodes];
            const uniqueQRCodes = new Set(allQRCodes);
            expect(uniqueQRCodes.size).toBe(allQRCodes.length);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  /**
   * **Property 12: Artifact deletion is soft delete**
   * **Validates: Requirements 3.4, 3.5**
   */
  describe('Property 12: Artifact deletion is soft delete', () => {
    it('should perform soft delete and preserve artifact data', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, creatorId, deleterId) => {
            // Add temple and create artifact
            artifactService.addTemple(temple);
            const artifactRequest = { ...request, siteId: temple.siteId };
            const originalArtifact = artifactService.createArtifact(artifactRequest, creatorId);
            
            // Delete artifact (soft delete)
            const deletedArtifact = artifactService.deleteArtifact(originalArtifact.artifactId, deleterId);

            // Verify the artifact data is preserved
            expect(deletedArtifact.artifactId).toBe(originalArtifact.artifactId);
            expect(deletedArtifact.siteId).toBe(originalArtifact.siteId);
            expect(deletedArtifact.artifactName).toBe(originalArtifact.artifactName);
            expect(deletedArtifact.description).toBe(originalArtifact.description);
            expect(deletedArtifact.qrCode).toBe(originalArtifact.qrCode);
            expect(deletedArtifact.qrCodeUrl).toBe(originalArtifact.qrCodeUrl);
            expect(deletedArtifact.media).toEqual(originalArtifact.media);
            expect(deletedArtifact.content).toEqual(originalArtifact.content);
            expect(deletedArtifact.status).toBe(originalArtifact.status);
            
            // Verify soft delete behavior
            expect(deletedArtifact.deleted).toBe(true);
            expect(deletedArtifact.deletedAt).toBeDefined();
            expect(deletedArtifact.deletedBy).toBe(deleterId);
            expect(deletedArtifact.updatedAt).toBeDefined();
            
            // Verify original creation data is preserved
            expect(deletedArtifact.createdAt).toBe(originalArtifact.createdAt);
            expect(deletedArtifact.createdBy).toBe(originalArtifact.createdBy);
            
            // Verify timestamps are valid
            expect(new Date(deletedArtifact.deletedAt!).toISOString()).toBe(deletedArtifact.deletedAt);
            expect(new Date(deletedArtifact.updatedAt).toISOString()).toBe(deletedArtifact.updatedAt);
            
            // Verify artifact is no longer accessible through normal operations
            expect(artifactService.getArtifact(originalArtifact.artifactId)).toBeNull();
            expect(artifactService.getAllArtifacts()).not.toContainEqual(deletedArtifact);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle deletion of non-existent artifacts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (nonExistentId, userId) => {
            expect(() => {
              artifactService.deleteArtifact(nonExistentId, userId);
            }).toThrow('Artifact not found');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle deletion of already deleted artifacts', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, userId) => {
            // Add temple and create artifact
            artifactService.addTemple(temple);
            const artifactRequest = { ...request, siteId: temple.siteId };
            const artifact = artifactService.createArtifact(artifactRequest, userId);
            
            // Delete artifact first time
            artifactService.deleteArtifact(artifact.artifactId, userId);
            
            // Try to delete again
            expect(() => {
              artifactService.deleteArtifact(artifact.artifactId, userId);
            }).toThrow('Artifact not found');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should preserve QR code uniqueness after soft deletion', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          fc.array(validArtifactRequestArb, { minLength: 3, maxLength: 8 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, requests, userId) => {
            // Add temple and create artifacts
            artifactService.addTemple(temple);
            const artifacts: Artifact[] = [];
            
            requests.forEach((request, index) => {
              const artifactRequest = { 
                ...request, 
                siteId: temple.siteId,
                artifactName: `${request.artifactName}-${index}`
              };
              const artifact = artifactService.createArtifact(artifactRequest, `${userId}-${index}`);
              artifacts.push(artifact);
            });
            
            // Delete some artifacts
            const toDelete = artifacts.slice(0, Math.ceil(artifacts.length / 2));
            toDelete.forEach(artifact => {
              artifactService.deleteArtifact(artifact.artifactId, userId);
            });
            
            // Verify QR codes are still unique among all artifacts (including deleted)
            const allQRCodes = artifacts.map(a => a.qrCode);
            const uniqueQRCodes = new Set(allQRCodes);
            expect(uniqueQRCodes.size).toBe(allQRCodes.length);
            
            // Verify deleted artifacts' QR codes are still tracked
            toDelete.forEach(artifact => {
              expect(artifactService.qrCodeExists(artifact.qrCode)).toBe(true);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });
  /**
   * **Property 13: Artifact updates invalidate cache**
   * **Validates: Requirements 3.10**
   */
  describe('Property 13: Artifact updates invalidate cache', () => {
    it('should invalidate all cache entries when artifact is updated', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.array(fc.record({
            language: fc.constantFrom('en', 'hi', 'kn', 'ta', 'te'),
            contentType: fc.constantFrom('text', 'audio', 'qa', 'infographic'),
            content: fc.string({ minLength: 10, maxLength: 500 }),
          }), { minLength: 1, maxLength: 10 }),
          fc.record({
            artifactName: fc.option(fc.string({ minLength: 3, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 10, maxLength: 1000 })),
            status: fc.option(fc.constantFrom('ACTIVE', 'ARCHIVED', 'DRAFT')),
          }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, cacheEntries, updates, userId) => {
            // Add temple and create artifact
            artifactService.addTemple(temple);
            const artifactRequest = { ...request, siteId: temple.siteId };
            const artifact = artifactService.createArtifact(artifactRequest, userId);
            
            // Add cache entries for this artifact
            cacheEntries.forEach(entry => {
              artifactService.addContentCache(
                artifact.artifactId,
                entry.language,
                entry.contentType,
                entry.content
              );
            });
            
            // Verify cache entries exist before update
            const cacheBeforeUpdate = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
            expect(cacheBeforeUpdate.length).toBe(cacheEntries.length);
            
            // Update artifact
            const hasValidUpdates = Object.values(updates).some(value => 
              value !== undefined && value !== null && 
              (typeof value !== 'string' || value.trim().length > 0)
            );
            
            if (hasValidUpdates) {
              artifactService.updateArtifact(artifact.artifactId, updates, userId);
              
              // Verify cache entries are invalidated after update
              const cacheAfterUpdate = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
              expect(cacheAfterUpdate.length).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should invalidate cache entries when artifact is deleted', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.array(fc.record({
            language: fc.constantFrom('en', 'hi', 'kn', 'ta'),
            contentType: fc.constantFrom('text', 'audio', 'qa'),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          }), { minLength: 2, maxLength: 8 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, cacheEntries, userId) => {
            // Add temple and create artifact
            artifactService.addTemple(temple);
            const artifactRequest = { ...request, siteId: temple.siteId };
            const artifact = artifactService.createArtifact(artifactRequest, userId);
            
            // Add cache entries for this artifact
            cacheEntries.forEach(entry => {
              artifactService.addContentCache(
                artifact.artifactId,
                entry.language,
                entry.contentType,
                entry.content
              );
            });
            
            // Verify cache entries exist before deletion
            const cacheBeforeDeletion = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
            expect(cacheBeforeDeletion.length).toBe(cacheEntries.length);
            
            // Delete artifact
            artifactService.deleteArtifact(artifact.artifactId, userId);
            
            // Verify cache entries are invalidated after deletion
            const cacheAfterDeletion = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
            expect(cacheAfterDeletion.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should only invalidate cache for the specific artifact being updated', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          fc.array(validArtifactRequestArb, { minLength: 2, maxLength: 5 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, requests, userId) => {
            // Add temple and create multiple artifacts
            artifactService.addTemple(temple);
            const artifacts: Artifact[] = [];
            
            requests.forEach((request, index) => {
              const artifactRequest = { 
                ...request, 
                siteId: temple.siteId,
                artifactName: `${request.artifactName}-${index}`
              };
              const artifact = artifactService.createArtifact(artifactRequest, `${userId}-${index}`);
              artifacts.push(artifact);
            });
            
            // Add cache entries for all artifacts
            artifacts.forEach((artifact, artifactIndex) => {
              ['en', 'hi'].forEach(language => {
                ['text', 'audio'].forEach(contentType => {
                  artifactService.addContentCache(
                    artifact.artifactId,
                    language,
                    contentType,
                    `Content for ${artifact.artifactName} in ${language} as ${contentType}`
                  );
                });
              });
            });
            
            // Verify all artifacts have cache entries
            artifacts.forEach(artifact => {
              const cache = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
              expect(cache.length).toBe(4); // 2 languages × 2 content types
            });
            
            // Update only the first artifact
            const targetArtifact = artifacts[0];
            const otherArtifacts = artifacts.slice(1);
            
            artifactService.updateArtifact(targetArtifact.artifactId, {
              description: 'Updated description for cache invalidation test'
            }, userId);
            
            // Verify only target artifact's cache is invalidated
            const targetCache = artifactService.getCacheEntriesForArtifact(targetArtifact.artifactId);
            expect(targetCache.length).toBe(0);
            
            // Verify other artifacts' cache is preserved
            otherArtifacts.forEach(artifact => {
              const cache = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
              expect(cache.length).toBe(4);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle cache invalidation for artifacts with no cache entries', () => {
      fc.assert(
        fc.property(
          validTempleArb,
          validArtifactRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (temple, request, userId) => {
            // Add temple and create artifact
            artifactService.addTemple(temple);
            const artifactRequest = { ...request, siteId: temple.siteId };
            const artifact = artifactService.createArtifact(artifactRequest, userId);
            
            // Verify no cache entries exist
            const cacheBefore = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
            expect(cacheBefore.length).toBe(0);
            
            // Update artifact (should not fail even with no cache)
            expect(() => {
              artifactService.updateArtifact(artifact.artifactId, {
                description: 'Updated description'
              }, userId);
            }).not.toThrow();
            
            // Verify still no cache entries
            const cacheAfter = artifactService.getCacheEntriesForArtifact(artifact.artifactId);
            expect(cacheAfter.length).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  afterEach(() => {
    artifactService.clear();
  });
});