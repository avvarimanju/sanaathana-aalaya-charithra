// Unit tests for QRProcessingService
import { QRProcessingService } from '../../src/services/qr-processing-service';
import { QRScanRequest, Language } from '../../src/models/common';
import { RepositoryFactory } from '../../src/repositories';

// Mock repositories
jest.mock('../../src/repositories');
jest.mock('../../src/utils/logger');

describe('QRProcessingService', () => {
  let service: QRProcessingService;
  let mockArtifactsRepository: any;
  let mockHeritageSitesRepository: any;

  const mockArtifact = {
    artifactId: 'artifact-1',
    siteId: 'site-1',
    name: 'Test Artifact',
    type: 'pillar',
    description: 'A test artifact',
    historicalContext: 'Built in 12th century',
    culturalSignificance: 'Important monument',
    lastUpdated: '2024-01-01T00:00:00.000Z',
  };

  const mockSite = {
    siteId: 'site-1',
    name: 'Test Heritage Site',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
    description: 'A test heritage site',
    historicalPeriod: '12th Century',
    culturalSignificance: 'Important site',
    artifacts: [],
    supportedLanguages: [Language.ENGLISH],
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: '1.0',
      curator: 'Test Curator',
      tags: ['heritage'],
      status: 'active' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockArtifactsRepository = {
      getByArtifactId: jest.fn(),
    };

    mockHeritageSitesRepository = {
      getBySiteId: jest.fn(),
    };

    (RepositoryFactory.getArtifactsRepository as jest.Mock).mockReturnValue(mockArtifactsRepository);
    (RepositoryFactory.getHeritageSitesRepository as jest.Mock).mockReturnValue(mockHeritageSitesRepository);

    service = new QRProcessingService();
  });

  describe('processQRScan', () => {
    it('should successfully process valid JSON QR code', async () => {
      const request: QRScanRequest = {
        qrData: JSON.stringify({
          siteId: 'site-1',
          artifactId: 'artifact-1',
          timestamp: '2024-01-01T00:00:00.000Z',
        }),
        sessionId: 'session-1',
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(mockArtifact);
      mockHeritageSitesRepository.getBySiteId.mockResolvedValue(mockSite);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(true);
      expect(result.artifactIdentifier).toBeDefined();
      expect(result.artifactIdentifier?.siteId).toBe('site-1');
      expect(result.artifactIdentifier?.artifactId).toBe('artifact-1');
      expect(result.artifactMetadata).toEqual(mockArtifact);
      expect(result.siteMetadata).toEqual(mockSite);
    });

    it('should successfully process valid URI QR code', async () => {
      const request: QRScanRequest = {
        qrData: 'avvari://site-1/artifact-1?timestamp=2024-01-01T00:00:00.000Z',
        sessionId: 'session-1',
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(mockArtifact);
      mockHeritageSitesRepository.getBySiteId.mockResolvedValue(mockSite);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(true);
      expect(result.artifactIdentifier?.siteId).toBe('site-1');
      expect(result.artifactIdentifier?.artifactId).toBe('artifact-1');
    });

    it('should successfully process simple format QR code', async () => {
      const request: QRScanRequest = {
        qrData: 'site-1:artifact-1',
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(mockArtifact);
      mockHeritageSitesRepository.getBySiteId.mockResolvedValue(mockSite);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(true);
      expect(result.artifactIdentifier?.siteId).toBe('site-1');
      expect(result.artifactIdentifier?.artifactId).toBe('artifact-1');
    });

    it('should fail with invalid QR data format', async () => {
      const request: QRScanRequest = {
        qrData: 'invalid-format',
      };

      const result = await service.processQRScan(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid QR code format');
    });

    it('should fail when artifact not found', async () => {
      const request: QRScanRequest = {
        qrData: 'site-1:artifact-1',
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(null);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Artifact not found in database');
    });

    it('should fail when site not found', async () => {
      const request: QRScanRequest = {
        qrData: 'site-1:artifact-1',
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(mockArtifact);
      mockHeritageSitesRepository.getBySiteId.mockResolvedValue(null);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Heritage site not found in database');
    });

    it('should verify location when provided', async () => {
      const request: QRScanRequest = {
        qrData: 'site-1:artifact-1',
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
        },
      };

      mockArtifactsRepository.getByArtifactId.mockResolvedValue(mockArtifact);
      mockHeritageSitesRepository.getBySiteId.mockResolvedValue(mockSite);

      const result = await service.processQRScan(request);

      expect(result.success).toBe(true);
      // Location verification doesn't fail the request, just logs warning
    });

    it('should handle repository errors gracefully', async () => {
      const request: QRScanRequest = {
        qrData: 'site-1:artifact-1',
      };

      mockArtifactsRepository.getByArtifactId.mockRejectedValue(new Error('Database error'));

      const result = await service.processQRScan(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal error processing QR code');
    });
  });

  describe('validateQRCodeFormat', () => {
    it('should validate JSON format', () => {
      const qrData = JSON.stringify({
        siteId: 'site-1',
        artifactId: 'artifact-1',
      });

      const result = service.validateQRCodeFormat(qrData);

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('json');
    });

    it('should validate URI format', () => {
      const qrData = 'avvari://site-1/artifact-1';

      const result = service.validateQRCodeFormat(qrData);

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('uri');
    });

    it('should validate simple format', () => {
      const qrData = 'site-1:artifact-1';

      const result = service.validateQRCodeFormat(qrData);

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('simple');
    });

    it('should reject empty QR data', () => {
      const result = service.validateQRCodeFormat('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('QR data is empty');
    });

    it('should reject invalid JSON', () => {
      const result = service.validateQRCodeFormat('{invalid json}');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should reject JSON missing required fields', () => {
      const qrData = JSON.stringify({ siteId: 'site-1' });

      const result = service.validateQRCodeFormat(qrData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('JSON missing required fields');
    });

    it('should reject invalid URI', () => {
      const result = service.validateQRCodeFormat('avvari://');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URI missing required path components');
    });

    it('should reject invalid simple format', () => {
      const result = service.validateQRCodeFormat('site-1:');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Simple format missing required components');
    });

    it('should reject unrecognized format', () => {
      const result = service.validateQRCodeFormat('random-text');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unrecognized QR code format');
    });
  });

  describe('isQRCodeCorrupted', () => {
    it('should detect null bytes', () => {
      const result = service.isQRCodeCorrupted('site-1\0artifact-1');

      expect(result).toBe(true);
    });

    it('should detect replacement character', () => {
      const result = service.isQRCodeCorrupted('site-1�artifact-1');

      expect(result).toBe(true);
    });

    it('should detect too short data', () => {
      const result = service.isQRCodeCorrupted('short');

      expect(result).toBe(true);
    });

    it('should detect too long data', () => {
      const longData = 'a'.repeat(1001);
      const result = service.isQRCodeCorrupted(longData);

      expect(result).toBe(true);
    });

    it('should not flag valid data as corrupted', () => {
      const result = service.isQRCodeCorrupted('site-1:artifact-1');

      expect(result).toBe(false);
    });

    it('should not flag valid JSON as corrupted', () => {
      const qrData = JSON.stringify({
        siteId: 'site-1',
        artifactId: 'artifact-1',
      });

      const result = service.isQRCodeCorrupted(qrData);

      expect(result).toBe(false);
    });
  });

  describe('generateQRCodeData', () => {
    it('should generate JSON format', () => {
      const result = service.generateQRCodeData('site-1', 'artifact-1', 'json');

      const parsed = JSON.parse(result);
      expect(parsed.siteId).toBe('site-1');
      expect(parsed.artifactId).toBe('artifact-1');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should generate URI format', () => {
      const result = service.generateQRCodeData('site-1', 'artifact-1', 'uri');

      expect(result).toMatch(/^avvari:\/\/site-1\/artifact-1\?timestamp=/);
    });

    it('should generate simple format', () => {
      const result = service.generateQRCodeData('site-1', 'artifact-1', 'simple');

      expect(result).toBe('site-1:artifact-1');
    });

    it('should default to URI format', () => {
      const result = service.generateQRCodeData('site-1', 'artifact-1');

      expect(result).toMatch(/^avvari:\/\//);
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        service.generateQRCodeData('site-1', 'artifact-1', 'invalid' as any);
      }).toThrow('Unsupported QR code format');
    });
  });
});
