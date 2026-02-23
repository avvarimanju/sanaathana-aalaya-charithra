// Unit tests for UserSessionsRepository
import { UserSessionsRepository } from '../../src/repositories/user-sessions-repository';
import { UserSession, Language, InteractionType, ContentType } from '../../src/models/common';
import { docClient } from '../../src/utils/aws-clients';

// Mock AWS clients
jest.mock('../../src/utils/aws-clients');
jest.mock('../../src/utils/logger');

describe('UserSessionsRepository', () => {
  let repository: UserSessionsRepository;
  let mockDocClient: any;

  const mockSession: UserSession = {
    sessionId: 'session-1',
    userId: 'user-1',
    siteId: 'site-1',
    visitStartTime: '2024-01-01T10:00:00.000Z',
    preferredLanguage: Language.ENGLISH,
    scannedArtifacts: ['artifact-1'],
    contentInteractions: [
      {
        contentId: 'content-1',
        interactionType: InteractionType.PLAY,
        timestamp: '2024-01-01T10:05:00.000Z',
        duration: 120,
      },
    ],
    conversationHistory: [
      {
        id: 'qa-1',
        question: 'What is the history of this artifact?',
        answer: 'This artifact dates back to the 12th century...',
        timestamp: '2024-01-01T10:10:00.000Z',
        language: Language.ENGLISH,
        confidence: 0.95,
        sources: [],
      },
    ],
    preferences: {
      language: Language.ENGLISH,
      audioSpeed: 1.0,
      volume: 0.8,
      highContrast: false,
      largeText: false,
      audioDescriptions: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocClient = docClient as any;
    mockDocClient.send = jest.fn();
    repository = new UserSessionsRepository();
  });

  describe('getBySessionId', () => {
    it('should get user session by ID', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      const result = await repository.getBySessionId('session-1');
      
      expect(result).toEqual(mockSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return null when session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.getBySessionId('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new user session', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await repository.create(mockSession);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should set visitStartTime timestamp when creating', async () => {
      const sessionWithoutTimestamp = {
        ...mockSession,
        visitStartTime: '',
      };

      mockDocClient.send.mockResolvedValueOnce({});

      await repository.create(sessionWithoutTimestamp);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSession', () => {
    it('should update user session', async () => {
      const updatedSession = {
        ...mockSession,
        preferredLanguage: Language.HINDI,
      };

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedSession,
      });

      const result = await repository.updateSession('session-1', {
        preferredLanguage: Language.HINDI,
      });
      
      expect(result).toEqual(updatedSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteSession', () => {
    it('should delete user session', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockSession,
      });

      const result = await repository.deleteSession('session-1');
      
      expect(result).toEqual(mockSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('addScannedArtifact', () => {
    it('should add scanned artifact to session', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      // Mock update operation
      const updatedSession = {
        ...mockSession,
        scannedArtifacts: ['artifact-1', 'artifact-2'],
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedSession,
      });

      const result = await repository.addScannedArtifact('session-1', 'artifact-2');
      
      expect(result).toEqual(updatedSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should not add duplicate artifact', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      const result = await repository.addScannedArtifact('session-1', 'artifact-1');
      
      expect(result).toEqual(mockSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should throw error if session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await expect(repository.addScannedArtifact('nonexistent', 'artifact-1'))
        .rejects.toThrow('User session not found: nonexistent');
    });
  });

  describe('addContentInteraction', () => {
    it('should add content interaction to session', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      const newInteraction = {
        contentId: 'content-2',
        interactionType: InteractionType.PLAY,
        timestamp: '2024-01-01T10:15:00.000Z',
        duration: 300,
      };

      // Mock update operation
      const updatedSession = {
        ...mockSession,
        contentInteractions: [...mockSession.contentInteractions, newInteraction],
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedSession,
      });

      const result = await repository.addContentInteraction('session-1', newInteraction);
      
      expect(result).toEqual(updatedSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should set timestamp if not provided', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockSession,
      });

      const interactionWithoutTimestamp = {
        contentId: 'content-2',
        interactionType: InteractionType.PLAY,
        duration: 300,
      };

      await repository.addContentInteraction('session-1', interactionWithoutTimestamp as any);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should throw error if session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const interaction = {
        contentId: 'content-1',
        interactionType: InteractionType.PLAY,
        timestamp: '2024-01-01T10:00:00.000Z',
      };

      await expect(repository.addContentInteraction('nonexistent', interaction))
        .rejects.toThrow('User session not found: nonexistent');
    });
  });

  describe('addQAInteraction', () => {
    it('should add Q&A interaction to session', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      const newQA = {
        id: 'qa-2',
        question: 'When was this built?',
        answer: 'It was built in the 12th century.',
        timestamp: '2024-01-01T10:20:00.000Z',
        language: Language.ENGLISH,
        confidence: 0.92,
        sources: [],
      };

      // Mock update operation
      const updatedSession = {
        ...mockSession,
        conversationHistory: [...mockSession.conversationHistory, newQA],
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedSession,
      });

      const result = await repository.addQAInteraction('session-1', newQA);
      
      expect(result).toEqual(updatedSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should set timestamp if not provided', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      mockDocClient.send.mockResolvedValueOnce({
        Attributes: mockSession,
      });

      const qaWithoutTimestamp = {
        id: 'qa-3',
        question: 'Test question?',
        answer: 'Test answer.',
        language: Language.ENGLISH,
        confidence: 0.9,
        sources: [],
      };

      await repository.addQAInteraction('session-1', qaWithoutTimestamp as any);
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should throw error if session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const qa = {
        id: 'qa-4',
        question: 'Test?',
        answer: 'Answer.',
        timestamp: '2024-01-01T10:00:00.000Z',
        language: Language.ENGLISH,
        confidence: 0.88,
        sources: [],
      };

      await expect(repository.addQAInteraction('nonexistent', qa))
        .rejects.toThrow('User session not found: nonexistent');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      // Mock get operation
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      // Mock update operation
      const updatedSession = {
        ...mockSession,
        preferences: {
          ...mockSession.preferences,
          audioSpeed: 1.5,
          highContrast: true,
        },
      };
      
      mockDocClient.send.mockResolvedValueOnce({
        Attributes: updatedSession,
      });

      const result = await repository.updatePreferences('session-1', {
        audioSpeed: 1.5,
        highContrast: true,
      });
      
      expect(result).toEqual(updatedSession);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should throw error if session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await expect(repository.updatePreferences('nonexistent', { audioSpeed: 1.5 }))
        .rejects.toThrow('User session not found: nonexistent');
    });
  });

  describe('getActiveSessionsBySite', () => {
    it('should get active sessions for a site', async () => {
      const sessions = [mockSession];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
      });

      const result = await repository.getActiveSessionsBySite('site-1', 24);
      
      expect(result).toEqual(sessions);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use default 24 hours if not specified', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockSession],
      });

      await repository.getActiveSessionsBySite('site-1');
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessionsByLanguage', () => {
    it('should get sessions by language preference', async () => {
      const sessions = [mockSession];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
      });

      const result = await repository.getSessionsByLanguage(Language.ENGLISH, 24);
      
      expect(result).toEqual(sessions);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessionsByUserId', () => {
    it('should get sessions by user ID', async () => {
      const sessions = [mockSession];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
      });

      const result = await repository.getSessionsByUserId('user-1');
      
      expect(result).toEqual(sessions);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessionStatistics', () => {
    it('should get session statistics', async () => {
      const sessions = [
        mockSession,
        {
          ...mockSession,
          sessionId: 'session-2',
          userId: 'user-2',
          preferredLanguage: Language.HINDI,
          scannedArtifacts: ['artifact-2', 'artifact-3'],
        },
      ];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
      });

      const result = await repository.getSessionStatistics('site-1', 24);
      
      expect(result.totalSessions).toBe(2);
      expect(result.uniqueUsers).toBe(2);
      expect(result.languageDistribution[Language.ENGLISH]).toBe(1);
      expect(result.languageDistribution[Language.HINDI]).toBe(1);
      expect(result.totalArtifactScans).toBe(3);
      expect(result.totalContentInteractions).toBe(2);
      expect(result.totalQAInteractions).toBe(2);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should calculate popular artifacts', async () => {
      const sessions = [
        mockSession,
        {
          ...mockSession,
          sessionId: 'session-2',
          scannedArtifacts: ['artifact-1', 'artifact-2'],
        },
      ];
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
      });

      const result = await repository.getSessionStatistics('site-1', 24);
      
      expect(result.popularArtifacts).toBeDefined();
      expect(result.popularArtifacts.length).toBeGreaterThan(0);
      expect(result.popularArtifacts[0].artifactId).toBe('artifact-1');
      expect(result.popularArtifacts[0].scanCount).toBe(2);
    });
  });

  describe('getUserEngagementMetrics', () => {
    it('should get user engagement metrics', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Item: mockSession,
      });

      const result = await repository.getUserEngagementMetrics('session-1');
      
      expect(result.artifactsScanned).toBe(1);
      expect(result.contentInteractions).toBe(1);
      expect(result.qaInteractions).toBe(1);
      expect(result.engagementScore).toBeGreaterThan(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
      expect(result.interactionTypes).toBeDefined();
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should throw error if session not found', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      await expect(repository.getUserEngagementMetrics('nonexistent'))
        .rejects.toThrow('User session not found: nonexistent');
    });
  });

  describe('cleanupOldSessions', () => {
    it('should cleanup old sessions', async () => {
      const oldSessions = [
        {
          ...mockSession,
          visitStartTime: '2023-01-01T00:00:00.000Z',
        },
      ];
      
      // Mock scan operation
      mockDocClient.send.mockResolvedValueOnce({
        Items: oldSessions,
      });

      // Mock batch delete operation
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await repository.cleanupOldSessions(30);
      
      expect(result).toBe(1);
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no old sessions found', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.cleanupOldSessions(30);
      
      expect(result).toBe(0);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessionsWithPagination', () => {
    it('should get sessions with pagination', async () => {
      const sessions = [mockSession];
      const lastKey = { sessionId: 'session-1' };
      
      mockDocClient.send.mockResolvedValueOnce({
        Items: sessions,
        LastEvaluatedKey: lastKey,
      });

      const result = await repository.getSessionsWithPagination(20);
      
      expect(result.sessions).toEqual(sessions);
      expect(result.lastEvaluatedKey).toEqual(lastKey);
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use default limit of 20', async () => {
      mockDocClient.send.mockResolvedValueOnce({
        Items: [mockSession],
      });

      await repository.getSessionsWithPagination();
      
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache statistics', () => {
    it('should return cache statistics', () => {
      const stats = repository.getUserSessionCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });
  });
});
