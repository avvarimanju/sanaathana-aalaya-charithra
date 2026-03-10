// Unit tests for SessionManagementService
import { SessionManagementService } from '../../src/services/session-management-service';
import { UserSession, Language, InteractionType } from '../../src/models/common';
import { RepositoryFactory } from '../../src/repositories';

// Mock repositories and uuid
jest.mock('../../src/repositories');
jest.mock('../../src/utils/logger');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-session-id'),
}));

describe('SessionManagementService', () => {
  let service: SessionManagementService;
  let mockUserSessionsRepository: any;

  const mockSession: UserSession = {
    sessionId: 'test-session-id',
    userId: 'user-1',
    siteId: 'site-1',
    visitStartTime: new Date().toISOString(),
    preferredLanguage: Language.ENGLISH,
    scannedArtifacts: ['artifact-1'],
    contentInteractions: [
      {
        contentId: 'content-1',
        interactionType: InteractionType.PLAY,
        timestamp: new Date().toISOString(),
        duration: 120,
      },
    ],
    conversationHistory: [
      {
        id: 'qa-1',
        question: 'What is this artifact?',
        answer: 'This is a historical pillar.',
        timestamp: new Date().toISOString(),
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

    mockUserSessionsRepository = {
      create: jest.fn(),
      getBySessionId: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      addScannedArtifact: jest.fn(),
      addContentInteraction: jest.fn(),
      addQAInteraction: jest.fn(),
      updatePreferences: jest.fn(),
      getSessionsByUserId: jest.fn(),
      getActiveSessionsBySite: jest.fn(),
      getSessionStatistics: jest.fn(),
      getUserEngagementMetrics: jest.fn(),
      cleanupOldSessions: jest.fn(),
    };

    (RepositoryFactory.getUserSessionsRepository as jest.Mock).mockReturnValue(mockUserSessionsRepository);

    service = new SessionManagementService();
  });

  describe('createSession', () => {
    it('should create a new session with default preferences', async () => {
      mockUserSessionsRepository.create.mockResolvedValue(undefined);

      const result = await service.createSession({
        siteId: 'site-1',
        preferredLanguage: Language.ENGLISH,
      });

      expect(result.sessionId).toBe('test-session-id');
      expect(result.siteId).toBe('site-1');
      expect(result.preferredLanguage).toBe(Language.ENGLISH);
      expect(result.scannedArtifacts).toEqual([]);
      expect(result.contentInteractions).toEqual([]);
      expect(result.conversationHistory).toEqual([]);
      expect(result.preferences).toBeDefined();
      expect(result.preferences.audioSpeed).toBe(1.0);
      expect(mockUserSessionsRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should create session with custom preferences', async () => {
      mockUserSessionsRepository.create.mockResolvedValue(undefined);

      const result = await service.createSession({
        siteId: 'site-1',
        preferredLanguage: Language.HINDI,
        preferences: {
          audioSpeed: 1.5,
          highContrast: true,
        },
      });

      expect(result.preferredLanguage).toBe(Language.HINDI);
      expect(result.preferences.audioSpeed).toBe(1.5);
      expect(result.preferences.highContrast).toBe(true);
    });

    it('should create session with user ID', async () => {
      mockUserSessionsRepository.create.mockResolvedValue(undefined);

      const result = await service.createSession({
        userId: 'user-123',
        siteId: 'site-1',
        preferredLanguage: Language.ENGLISH,
      });

      expect(result.userId).toBe('user-123');
    });
  });

  describe('getSession', () => {
    it('should get session by ID', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.getSession('test-session-id');

      expect(result).toEqual(mockSession);
      expect(mockUserSessionsRepository.getBySessionId).toHaveBeenCalledWith('test-session-id');
    });

    it('should return null when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      const result = await service.getSession('nonexistent');

      expect(result).toBeNull();
    });

    it('should delete and return null for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        visitStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(expiredSession);
      mockUserSessionsRepository.deleteSession.mockResolvedValue(undefined);

      const result = await service.getSession('test-session-id');

      expect(result).toBeNull();
      expect(mockUserSessionsRepository.deleteSession).toHaveBeenCalledWith('test-session-id');
    });
  });

  describe('updateSession', () => {
    it('should update session language', async () => {
      const updatedSession = {
        ...mockSession,
        preferredLanguage: Language.HINDI,
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.updateSession.mockResolvedValue(updatedSession);

      const result = await service.updateSession('test-session-id', {
        preferredLanguage: Language.HINDI,
      });

      expect(result?.preferredLanguage).toBe(Language.HINDI);
    });

    it('should merge preferences when updating', async () => {
      const updatedSession = {
        ...mockSession,
        preferences: {
          ...mockSession.preferences,
          audioSpeed: 1.5,
        },
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.updateSession.mockResolvedValue(updatedSession);

      const result = await service.updateSession('test-session-id', {
        preferences: { audioSpeed: 1.5 },
      });

      expect(result?.preferences.audioSpeed).toBe(1.5);
      expect(result?.preferences.volume).toBe(0.8); // Original value preserved
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.updateSession('nonexistent', { preferredLanguage: Language.HINDI })
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('addScannedArtifact', () => {
    it('should add scanned artifact to session', async () => {
      const updatedSession = {
        ...mockSession,
        scannedArtifacts: ['artifact-1', 'artifact-2'],
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.addScannedArtifact.mockResolvedValue(updatedSession);

      const result = await service.addScannedArtifact('test-session-id', 'artifact-2');

      expect(result?.scannedArtifacts).toContain('artifact-2');
      expect(mockUserSessionsRepository.addScannedArtifact).toHaveBeenCalledWith(
        'test-session-id',
        'artifact-2'
      );
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.addScannedArtifact('nonexistent', 'artifact-1')
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('addContentInteraction', () => {
    it('should add content interaction with timestamp', async () => {
      const interaction = {
        contentId: 'content-2',
        interactionType: InteractionType.PLAY,
        duration: 300,
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.addContentInteraction.mockResolvedValue(mockSession);

      const result = await service.addContentInteraction('test-session-id', interaction);

      expect(result).toBeDefined();
      expect(mockUserSessionsRepository.addContentInteraction).toHaveBeenCalled();
      
      const callArgs = mockUserSessionsRepository.addContentInteraction.mock.calls[0];
      expect(callArgs[1].timestamp).toBeDefined();
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.addContentInteraction('nonexistent', {
          contentId: 'content-1',
          interactionType: InteractionType.PLAY,
        })
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('addQAInteraction', () => {
    it('should add Q&A interaction with timestamp', async () => {
      const interaction = {
        id: 'qa-2',
        question: 'When was this built?',
        answer: 'In the 12th century.',
        language: Language.ENGLISH,
        confidence: 0.92,
        sources: [],
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.addQAInteraction.mockResolvedValue(mockSession);

      const result = await service.addQAInteraction('test-session-id', interaction);

      expect(result).toBeDefined();
      expect(mockUserSessionsRepository.addQAInteraction).toHaveBeenCalled();
      
      const callArgs = mockUserSessionsRepository.addQAInteraction.mock.calls[0];
      expect(callArgs[1].timestamp).toBeDefined();
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.addQAInteraction('nonexistent', {
          id: 'qa-1',
          question: 'Test?',
          answer: 'Answer.',
          language: Language.ENGLISH,
          confidence: 0.9,
          sources: [],
        })
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updatedSession = {
        ...mockSession,
        preferences: {
          ...mockSession.preferences,
          audioSpeed: 1.5,
        },
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.updatePreferences.mockResolvedValue(updatedSession);

      const result = await service.updatePreferences('test-session-id', {
        audioSpeed: 1.5,
      });

      expect(result?.preferences.audioSpeed).toBe(1.5);
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.updatePreferences('nonexistent', { audioSpeed: 1.5 })
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('getUserSessionHistory', () => {
    it('should get user session history', async () => {
      const sessions = [mockSession];

      mockUserSessionsRepository.getSessionsByUserId.mockResolvedValue(sessions);

      const result = await service.getUserSessionHistory('user-1');

      expect(result).toEqual(sessions);
      expect(mockUserSessionsRepository.getSessionsByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should filter out expired sessions', async () => {
      const expiredSession = {
        ...mockSession,
        sessionId: 'expired-session',
        visitStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      };

      mockUserSessionsRepository.getSessionsByUserId.mockResolvedValue([
        mockSession,
        expiredSession,
      ]);

      const result = await service.getUserSessionHistory('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('test-session-id');
    });
  });

  describe('getActiveSessions', () => {
    it('should get active sessions for site', async () => {
      const sessions = [mockSession];

      mockUserSessionsRepository.getActiveSessionsBySite.mockResolvedValue(sessions);

      const result = await service.getActiveSessions('site-1', 24);

      expect(result).toEqual(sessions);
      expect(mockUserSessionsRepository.getActiveSessionsBySite).toHaveBeenCalledWith('site-1', 24);
    });

    it('should use default 24 hours', async () => {
      mockUserSessionsRepository.getActiveSessionsBySite.mockResolvedValue([]);

      await service.getActiveSessions('site-1');

      expect(mockUserSessionsRepository.getActiveSessionsBySite).toHaveBeenCalledWith('site-1', 24);
    });
  });

  describe('getSessionStatistics', () => {
    it('should get session statistics', async () => {
      const stats = {
        totalSessions: 10,
        uniqueUsers: 8,
        languageDistribution: {},
        totalArtifactScans: 25,
        totalContentInteractions: 50,
        totalQAInteractions: 30,
        popularArtifacts: [],
      };

      mockUserSessionsRepository.getSessionStatistics.mockResolvedValue(stats);

      const result = await service.getSessionStatistics('site-1', 24);

      expect(result).toEqual(stats);
    });
  });

  describe('getUserEngagementMetrics', () => {
    it('should get user engagement metrics', async () => {
      const metrics = {
        artifactsScanned: 3,
        contentInteractions: 5,
        qaInteractions: 2,
        engagementScore: 75,
        interactionTypes: {},
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);
      mockUserSessionsRepository.getUserEngagementMetrics.mockResolvedValue(metrics);

      const result = await service.getUserEngagementMetrics('test-session-id');

      expect(result).toEqual(metrics);
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.getUserEngagementMetrics('nonexistent')
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      await service.endSession('test-session-id');

      // Should not throw error
      expect(mockUserSessionsRepository.getBySessionId).toHaveBeenCalled();
    });

    it('should handle non-existent session gracefully', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await service.endSession('nonexistent');

      // Should not throw error
      expect(mockUserSessionsRepository.getBySessionId).toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      mockUserSessionsRepository.deleteSession.mockResolvedValue(undefined);

      await service.deleteSession('test-session-id');

      expect(mockUserSessionsRepository.deleteSession).toHaveBeenCalledWith('test-session-id');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      mockUserSessionsRepository.cleanupOldSessions.mockResolvedValue(5);

      const result = await service.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(mockUserSessionsRepository.cleanupOldSessions).toHaveBeenCalledWith(30);
    });
  });

  describe('getConversationContext', () => {
    it('should get recent conversation history', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.getConversationContext('test-session-id', 10);

      expect(result).toEqual(mockSession.conversationHistory);
    });

    it('should limit conversation history', async () => {
      const sessionWithManyQAs = {
        ...mockSession,
        conversationHistory: Array.from({ length: 20 }, (_, i) => ({
          id: `qa-${i}`,
          question: `Question ${i}`,
          answer: `Answer ${i}`,
          timestamp: new Date().toISOString(),
          language: Language.ENGLISH,
          confidence: 0.9,
          sources: [],
        })),
      };

      mockUserSessionsRepository.getBySessionId.mockResolvedValue(sessionWithManyQAs);

      const result = await service.getConversationContext('test-session-id', 5);

      expect(result).toHaveLength(5);
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.getConversationContext('nonexistent')
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('getScannedArtifacts', () => {
    it('should get scanned artifacts', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.getScannedArtifacts('test-session-id');

      expect(result).toEqual(mockSession.scannedArtifacts);
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.getScannedArtifacts('nonexistent')
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('hasScannedArtifact', () => {
    it('should return true if artifact was scanned', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.hasScannedArtifact('test-session-id', 'artifact-1');

      expect(result).toBe(true);
    });

    it('should return false if artifact was not scanned', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.hasScannedArtifact('test-session-id', 'artifact-999');

      expect(result).toBe(false);
    });

    it('should return false if session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      const result = await service.hasScannedArtifact('nonexistent', 'artifact-1');

      expect(result).toBe(false);
    });
  });

  describe('getSessionSummary', () => {
    it('should get session summary', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.getSessionSummary('test-session-id');

      expect(result.sessionId).toBe('test-session-id');
      expect(result.siteId).toBe('site-1');
      expect(result.artifactsScanned).toBe(1);
      expect(result.contentInteractions).toBe(1);
      expect(result.qaInteractions).toBe(1);
      expect(result.preferredLanguage).toBe(Language.ENGLISH);
      expect(result.isActive).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when session not found', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      await expect(
        service.getSessionSummary('nonexistent')
      ).rejects.toThrow('Session not found: nonexistent');
    });
  });

  describe('validateSession', () => {
    it('should validate existing session', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(mockSession);

      const result = await service.validateSession('test-session-id');

      expect(result.isValid).toBe(true);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty session ID', async () => {
      const result = await service.validateSession('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session ID is required');
    });

    it('should reject non-existent session', async () => {
      mockUserSessionsRepository.getBySessionId.mockResolvedValue(null);

      const result = await service.validateSession('nonexistent');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session not found or expired');
    });
  });
});
