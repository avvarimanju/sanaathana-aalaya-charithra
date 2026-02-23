// Unit tests for VideoService
import { VideoService } from '../../src/services/video-service';
import { Language } from '../../src/models/common';
import { TranslationService } from '../../src/services/translation-service';

// Mock dependencies
jest.mock('../../src/services/translation-service');
jest.mock('../../src/utils/logger');

describe('VideoService', () => {
  let service: VideoService;
  let mockTranslationService: jest.Mocked<TranslationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock TranslationService
    mockTranslationService = {
      translateText: jest.fn(),
    } as any;

    service = new VideoService(mockTranslationService);
  });

  describe('generateVideo', () => {
    it('should generate video successfully', async () => {
      const result = await service.generateVideo({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        contentType: 'historical-reconstruction',
        language: Language.ENGLISH,
      });

      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
      expect(result.thumbnailUrl).toBeDefined();
      expect(result.duration).toBe(120); // Default duration
      expect(result.format).toBe('mp4');
      expect(result.quality).toBe('medium'); // Default quality
    });

    it('should handle missing artifact ID', async () => {
      const result = await service.generateVideo({
        artifactId: '',
        siteId: 'site-456',
        contentType: 'artifact-showcase',
        language: Language.ENGLISH,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Artifact ID and Site ID are required');
    });

    it('should handle missing site ID', async () => {
      const result = await service.generateVideo({
        artifactId: 'artifact-123',
        siteId: '',
        contentType: 'site-tour',
        language: Language.ENGLISH,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Artifact ID and Site ID are required');
    });

    it('should use custom duration', async () => {
      const result = await service.generateVideo({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        contentType: 'cultural-context',
        language: Language.ENGLISH,
        duration: 180,
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBe(180);
    });

    it('should use custom quality', async () => {
      const result = await service.generateVideo({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        contentType: 'historical-reconstruction',
        language: Language.ENGLISH,
        quality: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.quality).toBe('high');
    });

    it('should generate subtitles when requested', async () => {
      mockTranslationService.translateText.mockResolvedValue({
        success: true,
        translatedText: 'नमस्ते',
      });

      const result = await service.generateVideo({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        contentType: 'artifact-showcase',
        language: Language.ENGLISH,
        includeSubtitles: true,
        subtitleLanguages: [Language.HINDI, Language.TAMIL],
      });

      expect(result.success).toBe(true);
      expect(result.subtitles).toBeDefined();
      expect(result.subtitles?.length).toBe(2);
    });
  });

  describe('processVideo', () => {
    it('should process video successfully', async () => {
      const result = await service.processVideo({
        sourceVideoUrl: 'https://example.com/video.mp4',
        targetQuality: 'high',
        targetFormat: 'mp4',
      });

      expect(result.success).toBe(true);
      expect(result.processedVideoUrl).toBeDefined();
      expect(result.format).toBe('mp4');
      expect(result.quality).toBe('high');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should handle missing source URL', async () => {
      const result = await service.processVideo({
        sourceVideoUrl: '',
        targetQuality: 'medium',
        targetFormat: 'mp4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source video URL is required');
    });

    it('should generate thumbnail when requested', async () => {
      const result = await service.processVideo({
        sourceVideoUrl: 'https://example.com/video.mp4',
        targetQuality: 'medium',
        targetFormat: 'mp4',
        generateThumbnail: true,
      });

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBeDefined();
    });

    it('should extract audio when requested', async () => {
      const result = await service.processVideo({
        sourceVideoUrl: 'https://example.com/video.mp4',
        targetQuality: 'medium',
        targetFormat: 'mp4',
        extractAudio: true,
      });

      expect(result.success).toBe(true);
      expect(result.audioUrl).toBeDefined();
    });

    it('should handle different formats', async () => {
      const formats = ['mp4', 'webm', 'hls'] as const;

      for (const format of formats) {
        const result = await service.processVideo({
          sourceVideoUrl: 'https://example.com/video.mp4',
          targetQuality: 'medium',
          targetFormat: format,
        });

        expect(result.success).toBe(true);
        expect(result.format).toBe(format);
      }
    });
  });

  describe('generateSubtitles', () => {
    it('should generate subtitles successfully', async () => {
      mockTranslationService.translateText.mockResolvedValue({
        success: true,
        translatedText: 'नमस्ते',
      });

      const result = await service.generateSubtitles({
        videoId: 'video-123',
        transcript: 'Hello world',
        sourceLanguage: Language.ENGLISH,
        targetLanguages: [Language.HINDI],
      });

      expect(result.success).toBe(true);
      expect(result.subtitles).toBeDefined();
      expect(result.subtitles?.length).toBe(1);
    });

    it('should handle empty transcript', async () => {
      const result = await service.generateSubtitles({
        videoId: 'video-123',
        transcript: '',
        sourceLanguage: Language.ENGLISH,
        targetLanguages: [Language.HINDI],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transcript is required');
    });

    it('should generate subtitles for multiple languages', async () => {
      mockTranslationService.translateText.mockResolvedValue({
        success: true,
        translatedText: 'Translated text',
      });

      const result = await service.generateSubtitles({
        videoId: 'video-123',
        transcript: 'Test transcript',
        sourceLanguage: Language.ENGLISH,
        targetLanguages: [Language.HINDI, Language.TAMIL, Language.TELUGU],
      });

      expect(result.success).toBe(true);
      expect(result.subtitles?.length).toBe(3);
    });

    it('should not translate when source and target are same', async () => {
      const result = await service.generateSubtitles({
        videoId: 'video-123',
        transcript: 'Test transcript',
        sourceLanguage: Language.ENGLISH,
        targetLanguages: [Language.ENGLISH],
      });

      expect(result.success).toBe(true);
      expect(mockTranslationService.translateText).not.toHaveBeenCalled();
    });
  });

  describe('generateSRTContent', () => {
    it('should generate SRT content correctly', () => {
      const timecodes = [
        { startTime: 0, endTime: 2.5, text: 'First subtitle' },
        { startTime: 3, endTime: 5.5, text: 'Second subtitle' },
      ];

      const srt = service.generateSRTContent(timecodes);

      expect(srt).toContain('1\n');
      expect(srt).toContain('00:00:00,000 --> 00:00:02,500');
      expect(srt).toContain('First subtitle');
      expect(srt).toContain('2\n');
      expect(srt).toContain('00:00:03,000 --> 00:00:05,500');
      expect(srt).toContain('Second subtitle');
    });

    it('should format time correctly', () => {
      const timecodes = [
        { startTime: 3661.5, endTime: 3665.25, text: 'Test' }, // 1:01:01.500 to 1:01:05.250
      ];

      const srt = service.generateSRTContent(timecodes);

      expect(srt).toContain('01:01:01,500 --> 01:01:05,250');
    });
  });

  describe('getOptimalQuality', () => {
    it('should return low quality for slow network', () => {
      expect(service.getOptimalQuality('slow')).toBe('low');
    });

    it('should return medium quality for medium network', () => {
      expect(service.getOptimalQuality('medium')).toBe('medium');
    });

    it('should return high quality for fast network', () => {
      expect(service.getOptimalQuality('fast')).toBe('high');
    });
  });

  describe('getQualityConfig', () => {
    it('should return config for low quality', () => {
      const config = service.getQualityConfig('low');

      expect(config.resolution).toBe('480p');
      expect(config.bitrate).toBe('500k');
      expect(config.fps).toBe(24);
    });

    it('should return config for high quality', () => {
      const config = service.getQualityConfig('high');

      expect(config.resolution).toBe('1080p');
      expect(config.bitrate).toBe('3000k');
      expect(config.fps).toBe(30);
    });

    it('should return config for ultra quality', () => {
      const config = service.getQualityConfig('ultra');

      expect(config.resolution).toBe('4k');
      expect(config.bitrate).toBe('8000k');
      expect(config.fps).toBe(60);
    });
  });

  describe('getFormatConfig', () => {
    it('should return config for mp4', () => {
      const config = service.getFormatConfig('mp4');

      expect(config.container).toBe('mp4');
      expect(config.videoCodec).toBe('h264');
      expect(config.audioCodec).toBe('aac');
      expect(config.extension).toBe('.mp4');
    });

    it('should return config for webm', () => {
      const config = service.getFormatConfig('webm');

      expect(config.container).toBe('webm');
      expect(config.videoCodec).toBe('vp9');
      expect(config.audioCodec).toBe('opus');
    });

    it('should return config for hls', () => {
      const config = service.getFormatConfig('hls');

      expect(config.container).toBe('m3u8');
      expect(config.videoCodec).toBe('h264');
      expect(config.audioCodec).toBe('aac');
    });
  });

  describe('estimateFileSize', () => {
    it('should estimate file size for low quality', () => {
      const size = service.estimateFileSize(120, 'low'); // 2 minutes

      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(10); // Should be less than 10 MB
    });

    it('should estimate file size for high quality', () => {
      const size = service.estimateFileSize(120, 'high');

      expect(size).toBeGreaterThan(0);
      expect(size).toBeGreaterThan(service.estimateFileSize(120, 'low'));
    });

    it('should scale with duration', () => {
      const size60 = service.estimateFileSize(60, 'medium');
      const size120 = service.estimateFileSize(120, 'medium');

      expect(size120).toBeCloseTo(size60 * 2, 1);
    });
  });

  describe('Validation Methods', () => {
    it('should validate supported formats', () => {
      expect(service.isFormatSupported('mp4')).toBe(true);
      expect(service.isFormatSupported('webm')).toBe(true);
      expect(service.isFormatSupported('hls')).toBe(true);
      expect(service.isFormatSupported('avi')).toBe(false);
    });

    it('should validate supported qualities', () => {
      expect(service.isQualitySupported('low')).toBe(true);
      expect(service.isQualitySupported('medium')).toBe(true);
      expect(service.isQualitySupported('high')).toBe(true);
      expect(service.isQualitySupported('ultra')).toBe(true);
      expect(service.isQualitySupported('extreme')).toBe(false);
    });

    it('should return supported formats', () => {
      const formats = service.getSupportedFormats();

      expect(formats).toContain('mp4');
      expect(formats).toContain('webm');
      expect(formats).toContain('hls');
      expect(formats.length).toBe(3);
    });

    it('should return supported qualities', () => {
      const qualities = service.getSupportedQualities();

      expect(qualities).toContain('low');
      expect(qualities).toContain('medium');
      expect(qualities).toContain('high');
      expect(qualities).toContain('ultra');
      expect(qualities.length).toBe(4);
    });
  });
});
