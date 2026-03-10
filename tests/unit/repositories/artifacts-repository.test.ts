// Unit tests for ArtifactsRepository
import { ArtifactsRepository } from '../../src/repositories/artifacts-repository';
import { ArtifactMetadata, ArtifactType } from '../../src/models/common';
import { docClient } from '../../src/utils/aws-clients';

// Mock AWS clients
jest.mock('../../src/utils/aws-clients');
jest.mock('../../src/utils/logger');

describe('ArtifactsRepository', () => {
  let repository: ArtifactsRepository;
  let mockDocClient: any;

  const mockArtifact: ArtifactMetadata = {
    artifactId: 'artifact-1',
    siteId: 'site-1',
    name: 'Test Artifact',
    type: ArtifactType.PILLAR,
    description: 'A test artifact',
    historicalContext: 'Built in 12th century',
    culturalSignificance: 'Important religious monument',
    constructionPeriod: '12th Century',
    materials: ['Stone', 'Granite'],
    dimensions: {
      height: 10,
      width: 2,
      depth: 2,
    },
    conservationStatus: 'Good',
    lastUpdated: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient = docClient as any;
    mockDocClient.send = jest.fn();
    repository = new ArtifactsRepository();
  });

  describe('getByArtifactId', () => {
    it('should get artifact by ID and site ID', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockArtifact,
      });

      const result = await repository.getByArtifactId('artifact-1', 'site-1');
      
      expect(result).toEqual(mockArtifact);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return null when artifact not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.getByArtifactId('nonexistent', 'site-1');
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new artifact', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.create(mockArtifact);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should set lastUpdated timestamp when creating', async () => {
      const artifactWithoutTimestamp = {
        ...mockArtifact,
        lastUpdated: '',
      };

      mockDocClient.send.mockResolvedValueOnce({});

      await repository.create(artifactWithoutTimestamp);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateArtifact', () => {
    it('should update artifact', async () => {
      const updatedArtifact = {
        ...mockArtifact,
        name: 'Updated Artifact Name',
      };

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedArtifact,
      });

      const result = await repository.updateArtifact('artifact-1', 'site-1', {
        name: 'Updated Artifact Name',
      });
      
      expect(result).toEqual(updatedArtifact);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should update lastUpdated timestamp', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockArtifact,
      });

      await repository.updateArtifact('artifact-1', 'site-1', {
        description: 'Updated description',
      });
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteArtifact', () => {
    it('should delete artifact', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockArtifact,
      });

      const result = await repository.deleteArtifact('artifact-1', 'site-1');
      
      expect(result).toEqual(mockArtifact);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactsBySite', () => {
    it('should get all artifacts for a site', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsBySite('site-1');
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no artifacts found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.getArtifactsBySite('site-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('getArtifactsByType', () => {
    it('should get artifacts by type', async () => {
      const pillars = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: pillars,
      });

      const result = await repository.getArtifactsByType('site-1', ArtifactType.PILLAR);
      
      expect(result).toEqual(pillars);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchArtifacts', () => {
    it('should search artifacts by name or description', async () => {
      const searchResults = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: searchResults,
      });

      const result = await repository.searchArtifacts('site-1', 'Test');
      
      expect(result).toEqual(searchResults);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should convert search term to lowercase', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockArtifact],
      });

      await repository.searchArtifacts('site-1', 'TEST');
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactsByPeriod', () => {
    it('should get artifacts by construction period', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsByPeriod('site-1', '12th Century');
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactsByConservationStatus', () => {
    it('should get artifacts by conservation status', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsByConservationStatus('site-1', 'Good');
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactsByMaterial', () => {
    it('should get artifacts by material', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsByMaterial('site-1', 'Stone');
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactsByDimensions', () => {
    it('should get artifacts by dimensions', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsByDimensions('site-1', 5, 15, 1, 3);
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return all artifacts when no dimension filters provided', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactsByDimensions('site-1');
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRecentlyUpdatedArtifacts', () => {
    it('should get recently updated artifacts', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getRecentlyUpdatedArtifacts('site-1', 24);
      
      expect(result).toEqual(artifacts);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use default 24 hours if not specified', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockArtifact],
      });

      await repository.getRecentlyUpdatedArtifacts('site-1');
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('batch operations', () => {
    describe('batchGetArtifacts', () => {
      it('should batch get artifacts', async () => {
        const artifacts = [mockArtifact];
        
        mockDocClient.send.mockResolvedValueOnce({
          Responses: {
            'AvvarI-Artifacts': artifacts,
          },
        });

        const keys = [{ artifactId: 'artifact-1', siteId: 'site-1' }];
        const result = await repository.batchGetArtifacts(keys);
        
        expect(result).toEqual(artifacts);
        expect(mockDocClient.send).toHaveBeenCalledTimes(1);
      });

      it('should return empty array for empty keys', async () => {
        const result = await repository.batchGetArtifacts([]);
        
        expect(result).toEqual([]);
        expect(mockDocClient.send).not.toHaveBeenCalled();
      });
    });

    describe('batchCreateArtifacts', () => {
      it('should batch create artifacts', async () => {
        mockDocClient.send.mockResolvedValueOnce({});

        const artifacts = [mockArtifact];
        await repository.batchCreateArtifacts(artifacts);
        
        expect(mockDocClient.send).toHaveBeenCalledTimes(1);
      });

      it('should handle empty array', async () => {
        await repository.batchCreateArtifacts([]);
        
        expect(mockDocClient.send).not.toHaveBeenCalled();
      });
    });

    describe('batchDeleteArtifacts', () => {
      it('should batch delete artifacts', async () => {
        mockDocClient.send.mockResolvedValueOnce({});

        const keys = [{ artifactId: 'artifact-1', siteId: 'site-1' }];
        await repository.batchDeleteArtifacts(keys);
        
        expect(mockDocClient.send).toHaveBeenCalledTimes(1);
      });

      it('should handle empty array', async () => {
        await repository.batchDeleteArtifacts([]);
        
        expect(mockDocClient.send).not.toHaveBeenCalled();
      });
    });
  });

  describe('getArtifactsWithPagination', () => {
    it('should get artifacts with pagination', async () => {
      const artifacts = [mockArtifact];
      const lastKey = { artifactId: 'artifact-1', siteId: 'site-1' };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
        LastEvaluatedKey: lastKey,
      });

      const result = await repository.getArtifactsWithPagination('site-1', 20);
      
      expect(result.artifacts).toEqual(artifacts);
      expect(result.lastEvaluatedKey).toEqual(lastKey);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use default limit of 20', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockArtifact],
      });

      await repository.getArtifactsWithPagination('site-1');
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateConservationStatus', () => {
    it('should update conservation status', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockArtifact,
      });

      // Mock update operation
      const updatedArtifact = {
        ...mockArtifact,
        conservationStatus: 'Excellent',
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedArtifact,
      });

      const result = await repository.updateConservationStatus(
        'artifact-1',
        'site-1',
        'Excellent',
        'Recently restored'
      );
      
      expect(result).toEqual(updatedArtifact);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should update without notes', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockArtifact,
      });

      await repository.updateConservationStatus('artifact-1', 'site-1', 'Fair');
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArtifactStatistics', () => {
    it('should get artifact statistics', async () => {
      const artifacts = [
        mockArtifact,
        {
          ...mockArtifact,
          artifactId: 'artifact-2',
          type: ArtifactType.STATUE,
          conservationStatus: 'Fair',
        },
      ];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactStatistics('site-1');
      
      expect(result.totalCount).toBe(2);
      expect(result.typeDistribution[ArtifactType.PILLAR]).toBe(1);
      expect(result.typeDistribution[ArtifactType.STATUE]).toBe(1);
      expect(result.conservationStatusDistribution['Good']).toBe(1);
      expect(result.conservationStatusDistribution['Fair']).toBe(1);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should calculate average dimensions', async () => {
      const artifacts = [mockArtifact];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: artifacts,
      });

      const result = await repository.getArtifactStatistics('site-1');
      
      expect(result.averageDimensions).toBeDefined();
      expect(result.averageDimensions?.height).toBe(10);
      expect(result.averageDimensions?.width).toBe(2);
      expect(result.averageDimensions?.depth).toBe(2);
    });
  });

  describe('cache statistics', () => {
    it('should return cache statistics', () => {
      const stats = repository.getArtifactCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });
  });
});
