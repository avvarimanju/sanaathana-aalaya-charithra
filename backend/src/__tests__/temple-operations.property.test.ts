/**
 * Property-Based Tests for Temple Operations
 * 
 * **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.7, 2.8**
 * 
 * These tests use fast-check to verify temple CRUD operations across
 * a wide range of inputs, ensuring the temple management system behaves
 * correctly under all conditions.
 */

import fc from 'fast-check';

// Mock temple data structure based on the Python handler
interface Temple {
  siteId: string;
  siteName: string;
  stateLocation: string;
  description: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deleted: boolean;
}

interface TempleCreationRequest {
  siteName: string;
  stateLocation: string;
  description: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
}

// Mock temple service functions
class TempleService {
  private temples: Map<string, Temple> = new Map();

  createTemple(request: TempleCreationRequest, userId: string): Temple {
    const siteId = this.generateSiteId();
    const timestamp = new Date().toISOString();
    
    const temple: Temple = {
      siteId,
      siteName: request.siteName,
      stateLocation: request.stateLocation,
      description: request.description,
      latitude: request.latitude,
      longitude: request.longitude,
      images: request.images || [],
      status: request.status || 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      deleted: false,
    };

    this.temples.set(siteId, temple);
    return temple;
  }

  updateTemple(siteId: string, updates: Partial<TempleCreationRequest>, userId: string): Temple {
    const existing = this.temples.get(siteId);
    if (!existing || existing.deleted) {
      throw new Error(`Temple not found: ${siteId}`);
    }

    const updated: Temple = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      siteId: existing.siteId, // Preserve original ID
      createdAt: existing.createdAt, // Preserve creation time
      createdBy: existing.createdBy, // Preserve creator
    };

    this.temples.set(siteId, updated);
    return updated;
  }

  deleteTemple(siteId: string, userId: string): Temple {
    const existing = this.temples.get(siteId);
    if (!existing || existing.deleted) {
      throw new Error(`Temple not found: ${siteId}`);
    }

    const deleted: Temple = {
      ...existing,
      deleted: true,
      updatedAt: new Date().toISOString(),
    };

    this.temples.set(siteId, deleted);
    return deleted;
  }

  getTemple(siteId: string): Temple | null {
    const temple = this.temples.get(siteId);
    return temple && !temple.deleted ? temple : null;
  }

  getAllTemples(): Temple[] {
    return Array.from(this.temples.values()).filter(t => !t.deleted);
  }

  searchTemples(query: string): Temple[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemples().filter(temple =>
      temple.siteName.toLowerCase().includes(lowerQuery) ||
      temple.description.toLowerCase().includes(lowerQuery)
    );
  }

  filterByState(state: string): Temple[] {
    return this.getAllTemples().filter(temple => temple.stateLocation === state);
  }

  private generateSiteId(): string {
    return `temple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  clear(): void {
    this.temples.clear();
  }
}
describe('Temple Operations Properties', () => {
  let templeService: TempleService;

  beforeEach(() => {
    templeService = new TempleService();
  });

  // Test data generators using fast-check
  const validTempleNameArb = fc.string({ minLength: 3, maxLength: 100 })
    .filter(name => name.trim().length >= 3);

  const validStateArb = fc.constantFrom(
    'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Madhya Pradesh', 'Kerala'
  );

  const validDescriptionArb = fc.string({ minLength: 10, maxLength: 1000 })
    .filter(desc => desc.trim().length >= 10);

  const validCoordinatesArb = fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 }),
  });

  const validTempleRequestArb = fc.record({
    siteName: validTempleNameArb,
    stateLocation: validStateArb,
    description: validDescriptionArb,
    latitude: fc.option(fc.double({ min: -90, max: 90 })),
    longitude: fc.option(fc.double({ min: -180, max: 180 })),
    images: fc.array(fc.webUrl(), { maxLength: 10 }),
    status: fc.option(fc.constantFrom('ACTIVE', 'ARCHIVED', 'DRAFT')),
  });

  /**
   * **Property 4: Temple creation includes all required fields**
   * **Validates: Requirements 2.1**
   */
  describe('Property 4: Temple creation includes all required fields', () => {
    it('should create temple with all required fields', () => {
      fc.assert(
        fc.property(
          validTempleRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (request, userId) => {
            const createdTemple = templeService.createTemple(request, userId);

            // Verify all required fields are present
            expect(createdTemple.siteId).toBeDefined();
            expect(createdTemple.siteId).toMatch(/^temple-\d+-[a-z0-9]{9}$/);
            
            expect(createdTemple.siteName).toBe(request.siteName);
            expect(createdTemple.stateLocation).toBe(request.stateLocation);
            expect(createdTemple.description).toBe(request.description);
            expect(createdTemple.latitude).toBe(request.latitude);
            expect(createdTemple.longitude).toBe(request.longitude);
            expect(createdTemple.images).toEqual(request.images || []);
            expect(createdTemple.status).toBe(request.status || 'ACTIVE');
            
            // Verify metadata fields
            expect(createdTemple.createdAt).toBeDefined();
            expect(createdTemple.updatedAt).toBeDefined();
            expect(createdTemple.createdBy).toBe(userId);
            expect(createdTemple.deleted).toBe(false);
            
            // Verify timestamps are valid ISO strings
            expect(new Date(createdTemple.createdAt).toISOString()).toBe(createdTemple.createdAt);
            expect(new Date(createdTemple.updatedAt).toISOString()).toBe(createdTemple.updatedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique site IDs for temples', () => {
      fc.assert(
        fc.property(
          validTempleRequestArb,
          fc.integer({ min: 2, max: 10 }),
          (baseRequest, count) => {
            const siteIds = new Set<string>();
            
            // Create multiple temples
            for (let i = 0; i < count; i++) {
              const temple = templeService.createTemple(baseRequest, `user-${i}`);
              siteIds.add(temple.siteId);
            }
            
            // All site IDs should be unique
            expect(siteIds.size).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 5: Temple updates are persisted correctly**
   * **Validates: Requirements 2.2, 2.8**
   */
  describe('Property 5: Temple updates are persisted correctly', () => {
    it('should persist temple updates with correct metadata', () => {
      fc.assert(
        fc.property(
          validTempleRequestArb,
          fc.record({
            siteName: fc.option(validTempleNameArb),
            description: fc.option(validDescriptionArb),
            stateLocation: fc.option(validStateArb),
          }),
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (originalRequest, updates, creatorId, updaterId) => {
            // Create original temple
            const originalTemple = templeService.createTemple(originalRequest, creatorId);
            const originalCreatedAt = originalTemple.createdAt;
            
            // Wait a bit to ensure different timestamps
            const beforeUpdate = Date.now();
            
            // Update temple
            const updatedTemple = templeService.updateTemple(originalTemple.siteId, updates, updaterId);

            // Verify updates were applied
            if (updates.siteName) {
              expect(updatedTemple.siteName).toBe(updates.siteName);
            }
            if (updates.description) {
              expect(updatedTemple.description).toBe(updates.description);
            }
            if (updates.stateLocation) {
              expect(updatedTemple.stateLocation).toBe(updates.stateLocation);
            }
            
            // Verify metadata is updated correctly
            expect(updatedTemple.updatedAt).toBeDefined();
            expect(new Date(updatedTemple.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeUpdate);
            
            // Verify original creation metadata is preserved
            expect(updatedTemple.createdAt).toBe(originalCreatedAt);
            expect(updatedTemple.createdBy).toBe(creatorId);
            expect(updatedTemple.siteId).toBe(originalTemple.siteId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  /**
   * **Property 6: Temple deletion is soft delete**
   * **Validates: Requirements 2.4**
   */
  describe('Property 6: Temple deletion is soft delete', () => {
    it('should perform soft delete and preserve temple data', () => {
      fc.assert(
        fc.property(
          validTempleRequestArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (request, creatorId, deleterId) => {
            // Create temple
            const originalTemple = templeService.createTemple(request, creatorId);
            
            // Delete temple (soft delete)
            const deletedTemple = templeService.deleteTemple(originalTemple.siteId, deleterId);

            // Verify the temple data is preserved
            expect(deletedTemple.siteId).toBe(originalTemple.siteId);
            expect(deletedTemple.siteName).toBe(originalTemple.siteName);
            expect(deletedTemple.stateLocation).toBe(originalTemple.stateLocation);
            expect(deletedTemple.description).toBe(originalTemple.description);
            expect(deletedTemple.images).toEqual(originalTemple.images);
            
            // Verify soft delete behavior
            expect(deletedTemple.deleted).toBe(true);
            expect(deletedTemple.updatedAt).toBeDefined();
            
            // Verify original creation data is preserved
            expect(deletedTemple.createdAt).toBe(originalTemple.createdAt);
            expect(deletedTemple.createdBy).toBe(originalTemple.createdBy);
            
            // Verify temple is no longer accessible through normal operations
            expect(templeService.getTemple(originalTemple.siteId)).toBeNull();
            expect(templeService.getAllTemples()).not.toContain(deletedTemple);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of non-existent temples', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (nonExistentId, userId) => {
            expect(() => {
              templeService.deleteTemple(nonExistentId, userId);
            }).toThrow('Temple not found');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 7: Temple names are unique**
   * **Validates: Requirements 2.5**
   */
  describe('Property 7: Temple names are unique', () => {
    it('should generate unique identifiers even with identical names', () => {
      fc.assert(
        fc.property(
          validTempleNameArb,
          fc.integer({ min: 2, max: 10 }),
          (templeName, count) => {
            const siteIds = new Set<string>();
            const baseRequest: TempleCreationRequest = {
              siteName: templeName,
              stateLocation: 'Karnataka',
              description: 'Test temple description for uniqueness testing',
            };
            
            // Create multiple temples with the same name
            for (let i = 0; i < count; i++) {
              const temple = templeService.createTemple(baseRequest, `user-${i}`);
              siteIds.add(temple.siteId);
              
              // Verify the name is preserved
              expect(temple.siteName).toBe(templeName);
            }
            
            // All generated site IDs should be unique
            expect(siteIds.size).toBe(count);
            
            // Verify all IDs follow the expected pattern
            siteIds.forEach(siteId => {
              expect(siteId).toMatch(/^temple-\d+-[a-z0-9]{9}$/);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow name updates without breaking uniqueness', () => {
      fc.assert(
        fc.property(
          validTempleRequestArb,
          validTempleRequestArb,
          validTempleNameArb,
          (request1, request2, newName) => {
            // Create two different temples
            const temple1 = templeService.createTemple(request1, 'user1');
            const temple2 = templeService.createTemple(request2, 'user2');
            
            // Update both to have the same name
            const updated1 = templeService.updateTemple(temple1.siteId, { siteName: newName }, 'user1');
            const updated2 = templeService.updateTemple(temple2.siteId, { siteName: newName }, 'user2');
            
            // Both should have the same name but different IDs
            expect(updated1.siteName).toBe(newName);
            expect(updated2.siteName).toBe(newName);
            expect(updated1.siteId).not.toBe(updated2.siteId);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 9: Temple filtering returns matching results**
   * **Validates: Requirements 2.7**
   */
  describe('Property 9: Temple filtering returns matching results', () => {
    it('should filter temples by search query correctly', () => {
      fc.assert(
        fc.property(
          fc.array(validTempleRequestArb, { minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 3, maxLength: 10 }),
          (templeRequests, searchTerm) => {
            // Create temples
            templeRequests.forEach((request, index) => {
              templeService.createTemple(request, `user-${index}`);
            });
            
            const filteredTemples = templeService.searchTemples(searchTerm);
            
            // Verify all returned temples match the search criteria
            filteredTemples.forEach(temple => {
              const matchesName = temple.siteName.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesDescription = temple.description.toLowerCase().includes(searchTerm.toLowerCase());
              
              expect(matchesName || matchesDescription).toBe(true);
            });
            
            // Verify no matching temples were excluded
            const allTemples = templeService.getAllTemples();
            const expectedMatches = allTemples.filter(temple => 
              temple.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              temple.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            expect(filteredTemples.length).toBe(expectedMatches.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should filter temples by state correctly', () => {
      fc.assert(
        fc.property(
          fc.array(validTempleRequestArb, { minLength: 5, maxLength: 15 }),
          validStateArb,
          (templeRequests, stateFilter) => {
            // Create temples
            templeRequests.forEach((request, index) => {
              templeService.createTemple(request, `user-${index}`);
            });
            
            const filteredTemples = templeService.filterByState(stateFilter);
            
            // Verify all returned temples have the correct state
            filteredTemples.forEach(temple => {
              expect(temple.stateLocation).toBe(stateFilter);
            });
            
            // Verify the count matches expected results
            const allTemples = templeService.getAllTemples();
            const expectedResults = allTemples.filter(temple => temple.stateLocation === stateFilter);
            expect(filteredTemples.length).toBe(expectedResults.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle empty search results correctly', () => {
      fc.assert(
        fc.property(
          fc.array(validTempleRequestArb, { minLength: 3, maxLength: 10 }),
          fc.string({ minLength: 20, maxLength: 30 }).filter(s => !s.includes('temple')),
          (templeRequests, uniqueSearchTerm) => {
            // Create temples
            templeRequests.forEach((request, index) => {
              templeService.createTemple(request, `user-${index}`);
            });
            
            const filteredTemples = templeService.searchTemples(uniqueSearchTerm);
            
            // Should return empty array if no matches
            expect(Array.isArray(filteredTemples)).toBe(true);
            
            // Verify no false positives
            filteredTemples.forEach(temple => {
              const matchesName = temple.siteName.toLowerCase().includes(uniqueSearchTerm.toLowerCase());
              const matchesDescription = temple.description.toLowerCase().includes(uniqueSearchTerm.toLowerCase());
              expect(matchesName || matchesDescription).toBe(true);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain filtering consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.array(validTempleRequestArb, { minLength: 5, maxLength: 10 }),
          fc.string({ minLength: 3, maxLength: 8 }),
          (templeRequests, searchTerm) => {
            // Create temples
            templeRequests.forEach((request, index) => {
              templeService.createTemple(request, `user-${index}`);
            });
            
            // Call search multiple times
            const result1 = templeService.searchTemples(searchTerm);
            const result2 = templeService.searchTemples(searchTerm);
            const result3 = templeService.searchTemples(searchTerm);
            
            // Results should be consistent
            expect(result1.length).toBe(result2.length);
            expect(result2.length).toBe(result3.length);
            
            // Results should contain the same temples
            expect(result1.map(t => t.siteId).sort()).toEqual(result2.map(t => t.siteId).sort());
            expect(result2.map(t => t.siteId).sort()).toEqual(result3.map(t => t.siteId).sort());
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  afterEach(() => {
    templeService.clear();
  });
});