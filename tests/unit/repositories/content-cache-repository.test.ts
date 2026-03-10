// Unit tests for ContentCacheRepository
import { ContentCacheRepository, CachedContent } from '../../src/repositories/content-cache-repository';
import { MultimediaContent, ContentType, Language } from '../../src/models/common';
import { docClient } from '../../src/utils/aws-clients';

// Mock AWS clients
jest.mock('../../src/utils/aws-clients');
jest.mock('../../src/utils/logger');

describe('ContentCacheRepository', () => {
  let repository: ContentCacheRepository;
  let mockDocClient: any;

  const mockContent: MultimediaContent = {
    contentId: 'content-1',
    artifactId: 'artifact-1',
    contentType: ContentType.AUDIO_GUIDE,
    language: Language.ENGLISH,
    data: {
      audioUrl: 'https://example.com/audio.mp3',
      duration: 120,
      fileSize: 1024000,
    },
    metadata: {
      siteId: 'site-1',
      artifactId: 'artifact-1',
      contentType: ContentType.AUDIO_GUIDE,
      language: Language.ENGLISH,
      version: '1.0',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      tags: ['heritage', 'audio'],
    },
    cacheSettings: {
      ttl: 3600,
      priority: 5,
      tags: ['audio', 'artifact-1'],
    },
  };

  const mockCachedContent: CachedContent = {
    ...mockContent,
    accessCount: 5,
    lastAccessed: '2024-01-01T12:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z', // Future date
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient = docClient as any;
    mockDocClient.send = jest.fn();
    repository = new ContentCacheRepository();
  });

  describe('getCachedContent', () => {
    it('should get cached content by ID', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockCachedContent,
      });

      // Mock update for access metrics
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: { ...mockCachedContent, accessCount: 6 },
      });

      const result = await repository.getCachedContent('content-1');
      
      expect(result).toEqual(mockCachedContent);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return null when content not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.getCachedContent('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should return null and delete expired content', async () => {
      const expiredContent = {
        ...mockCachedContent,
        expiresAt: '2023-01-01T00:00:00.000Z', // Expired
      };

      mockDocClient.send.mockResolvedValueOnce({
        Item: expiredContent,
      });

      // Mock delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.getCachedContent('content-1');
      
      expect(result).toBeNull();
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('cacheContent', () => {
    it('should cache content with TTL', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.cacheContent(mockContent, 3600);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use default TTL of 3600 seconds', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.cacheContent(mockContent);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should set initial access count to 0', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.cacheContent(mockContent, 3600);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCachedContentByArtifact', () => {
    it('should get cached content by artifact, type, and language', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockCachedContent],
      });

      // Mock update for access metrics
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockCachedContent,
      });

      const result = await repository.getCachedContentByArtifact(
        'artifact-1',
        ContentType.AUDIO_GUIDE,
        Language.ENGLISH
      );
      
      expect(result).toEqual(mockCachedContent);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return null when no content found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.getCachedContentByArtifact(
        'artifact-1',
        ContentType.AUDIO_GUIDE,
        Language.ENGLISH
      );
      
      expect(result).toBeNull();
    });

    it('should return most recently accessed content when multiple exist', async () => {
      const content1 = {
        ...mockCachedContent,
        contentId: 'content-1',
        lastAccessed: '2024-01-01T10:00:00.000Z',
        expiresAt: '2026-12-31T23:59:59.000Z',
      };
      const content2 = {
        ...mockCachedContent,
        contentId: 'content-2',
        lastAccessed: '2024-01-01T12:00:00.000Z',
        expiresAt: '2026-12-31T23:59:59.000Z',
      };

      mockDocClient.send.mockResolvedValueOnce({
        Items: [content1, content2],
      });

      // Mock update for access metrics
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: content2,
      });

      const result = await repository.getCachedContentByArtifact(
        'artifact-1',
        ContentType.AUDIO_GUIDE,
        Language.ENGLISH
      );
      
      expect(result?.contentId).toBe('content-2');
    });

    it('should delete expired content', async () => {
      const expiredContent = {
        ...mockCachedContent,
        expiresAt: '2023-01-01T00:00:00.000Z',
      };

      mockDocClient.send.mockResolvedValueOnce({
        Items: [expiredContent],
      });

      // Mock delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.getCachedContentByArtifact(
        'artifact-1',
        ContentType.AUDIO_GUIDE,
        Language.ENGLISH
      );
      
      expect(result).toBeNull();
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMostAccessedContent', () => {
    it('should get most accessed content', async () => {
      const content1 = { ...mockCachedContent, contentId: 'content-1', accessCount: 10, expiresAt: '2026-12-31T23:59:59.000Z' };
      const content2 = { ...mockCachedContent, contentId: 'content-2', accessCount: 5, expiresAt: '2026-12-31T23:59:59.000Z' };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: [content1, content2],
      });

      const result = await repository.getMostAccessedContent(10);
      
      expect(result).toHaveLength(2);
      expect(result[0].contentId).toBe('content-1');
      expect(result[0].accessCount).toBe(10);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should filter out expired content', async () => {
      const validContent = { ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' };
      const expiredContent = {
        ...mockCachedContent,
        contentId: 'content-2',
        expiresAt: '2023-01-01T00:00:00.000Z',
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: [validContent, expiredContent],
      });

      const result = await repository.getMostAccessedContent(10);
      
      expect(result).toHaveLength(1);
      expect(result[0].contentId).toBe('content-1');
    });

    it('should limit results to specified count', async () => {
      const contents = Array.from({ length: 20 }, (_, i) => ({
        ...mockCachedContent,
        contentId: `content-${i}`,
        accessCount: 20 - i,
        expiresAt: '2026-12-31T23:59:59.000Z',
      }));
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: contents,
      });

      const result = await repository.getMostAccessedContent(5);
      
      expect(result).toHaveLength(5);
    });
  });

  describe('getCachedContentBySite', () => {
    it('should get cached content by site', async () => {
      const contents = [{ ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' }];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: contents,
      });

      const result = await repository.getCachedContentBySite('site-1');
      
      expect(result).toEqual(contents);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should filter out expired content', async () => {
      const validContent = { ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' };
      const expiredContent = {
        ...mockCachedContent,
        contentId: 'content-2',
        expiresAt: '2023-01-01T00:00:00.000Z',
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: [validContent, expiredContent],
      });

      const result = await repository.getCachedContentBySite('site-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].contentId).toBe('content-1');
    });
  });

  describe('cleanupExpiredContent', () => {
    it('should cleanup expired content', async () => {
      const expiredContents = [
        {
          ...mockCachedContent,
          contentId: 'content-1',
          expiresAt: '2023-01-01T00:00:00.000Z',
        },
        {
          ...mockCachedContent,
          contentId: 'content-2',
          expiresAt: '2023-01-02T00:00:00.000Z',
        },
      ];
      
      // Mock scan operation
      mockDocClient.send.mockResolvedValueOnce({
        Items: expiredContents,
      });

      // Mock batch delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.cleanupExpiredContent();
      
      expect(result).toBe(2);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no expired content found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.cleanupExpiredContent();
      
      expect(result).toBe(0);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should handle large batches', async () => {
      const expiredContents = Array.from({ length: 50 }, (_, i) => ({
        ...mockCachedContent,
        contentId: `content-${i}`,
        expiresAt: '2023-01-01T00:00:00.000Z',
      }));
      
      // Mock scan operation
      mockDocClient.send.mockResolvedValueOnce({
        Items: expiredContents,
      });

      // Mock batch delete operations (2 batches of 25)
      mockDocClient.send.mockResolvedValueOnce({});
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.cleanupExpiredContent();
      
      expect(result).toBe(50);
      expect(mockDocClient.send).toHaveBeenCalledTimes(3); // 1 scan + 2 batch deletes
    });
  });

  describe('extendContentTTL', () => {
    it('should extend content TTL', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockCachedContent,
      });

      // Mock update operation
      const extendedContent = {
        ...mockCachedContent,
        expiresAt: '2024-01-03T00:00:00.000Z',
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: extendedContent,
      });

      const result = await repository.extendContentTTL('content-1', 86400);
      
      expect(result).toEqual(extendedContent);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return null when content not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.extendContentTTL('nonexistent', 3600);
      
      expect(result).toBeNull();
    });
  });

  describe('getCacheStatistics', () => {
    it('should get cache statistics', async () => {
      const contents = [
        { ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' },
        {
          ...mockCachedContent,
          contentId: 'content-2',
          contentType: ContentType.VIDEO,
          language: Language.HINDI,
          accessCount: 10,
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      ];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: contents,
      });

      const result = await repository.getCacheStatistics();
      
      expect(result.totalCachedItems).toBe(2);
      expect(result.totalAccessCount).toBe(15);
      expect(result.averageAccessCount).toBe(7.5);
      expect(result.contentTypeDistribution[ContentType.AUDIO_GUIDE]).toBe(1);
      expect(result.contentTypeDistribution[ContentType.VIDEO]).toBe(1);
      expect(result.languageDistribution[Language.ENGLISH]).toBe(1);
      expect(result.languageDistribution[Language.HINDI]).toBe(1);
      expect(result.topAccessedContent).toBeDefined();
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should filter out expired content', async () => {
      const validContent = { ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' };
      const expiredContent = {
        ...mockCachedContent,
        contentId: 'content-2',
        expiresAt: '2023-01-01T00:00:00.000Z',
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: [validContent, expiredContent],
      });

      const result = await repository.getCacheStatistics();
      
      expect(result.totalCachedItems).toBe(1);
    });

    it('should calculate content expiring within 24 hours', async () => {
      const now = new Date();
      const soonExpiring = {
        ...mockCachedContent,
        contentId: 'content-1',
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      };
      const laterExpiring = {
        ...mockCachedContent,
        contentId: 'content-2',
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: [soonExpiring, laterExpiring],
      });

      const result = await repository.getCacheStatistics();
      
      expect(result.expiringWithin24Hours).toBe(1);
    });
  });

  describe('invalidateArtifactCache', () => {
    it('should invalidate cache for artifact', async () => {
      const contents = [
        mockCachedContent,
        { ...mockCachedContent, contentId: 'content-2' },
      ];
      
      // Mock scan operation
      mockDocClient.send.mockResolvedValueOnce({
        Items: contents,
      });

      // Mock batch delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.invalidateArtifactCache('artifact-1');
      
      expect(result).toBe(2);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no content found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.invalidateArtifactCache('artifact-1');
      
      expect(result).toBe(0);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateSiteCache', () => {
    it('should invalidate cache for site', async () => {
      const contents = [
        { ...mockCachedContent, expiresAt: '2026-12-31T23:59:59.000Z' },
        { ...mockCachedContent, contentId: 'content-2', expiresAt: '2026-12-31T23:59:59.000Z' },
      ];
      
      // Mock scan operation
      mockDocClient.send.mockResolvedValueOnce({
        Items: contents,
      });

      // Mock batch delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.invalidateSiteCache('site-1');
      
      expect(result).toBe(2);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no content found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.invalidateSiteCache('site-1');
      
      expect(result).toBe(0);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('preloadArtifactContent', () => {
    it('should preload content for artifact', async () => {
      const contents = [
        mockContent,
        { ...mockContent, contentId: 'content-2', contentType: ContentType.VIDEO },
      ];

      // Mock cache operations
      mockDocClient.send.mockResolvedValueOnce({});
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.preloadArtifactContent('artifact-1', contents, 3600);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should use default TTL', async () => {
      const contents = [mockContent];

      mockDocClient.send.mockResolvedValueOnce({});

      await repository.preloadArtifactContent('artifact-1', contents);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache statistics', () => {
    it('should return cache statistics', () => {
      const stats = repository.getContentCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });
  });
});
