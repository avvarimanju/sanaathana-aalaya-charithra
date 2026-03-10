// Unit tests for InfographicService
import { InfographicService } from '../../src/services/infographic-service';
import { Language } from '../../src/models/common';

// Mock dependencies
jest.mock('../../src/utils/logger');

describe('InfographicService', () => {
  let service: InfographicService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InfographicService();
  });

  describe('generateInfographic', () => {
    it('should generate timeline infographic successfully', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        data: {
          title: 'Historical Timeline',
          timelineData: [
            {
              id: 'event-1',
              date: '1200 CE',
              title: 'Construction began',
              description: 'Temple construction started',
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.infographicUrl).toBeDefined();
      expect(result.thumbnailUrl).toBeDefined();
      expect(result.format).toBe('svg');
      expect(result.metadata?.type).toBe('timeline');
    });

    it('should generate map infographic successfully', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'map',
        language: Language.ENGLISH,
        data: {
          title: 'Heritage Sites Map',
          mapData: [
            {
              id: 'loc-1',
              name: 'Temple',
              latitude: 12.9716,
              longitude: 77.5946,
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.type).toBe('map');
    });

    it('should generate diagram infographic successfully', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'diagram',
        language: Language.ENGLISH,
        data: {
          title: 'Architectural Diagram',
          diagramData: [
            {
              id: 'node-1',
              label: 'Main Structure',
              description: 'Central building',
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.type).toBe('diagram');
    });

    it('should generate architectural infographic successfully', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'architectural',
        language: Language.ENGLISH,
        data: {
          title: 'Architectural Elements',
          architecturalData: [
            {
              id: 'elem-1',
              name: 'Pillar',
              type: 'structure',
              description: 'Stone pillar',
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.type).toBe('architectural');
    });

    it('should generate cultural context infographic successfully', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'cultural-context',
        language: Language.ENGLISH,
        data: {
          title: 'Cultural Context',
        },
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.type).toBe('cultural-context');
    });

    it('should handle missing artifact ID', async () => {
      const result = await service.generateInfographic({
        artifactId: '',
        siteId: 'site-456',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        data: { title: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Artifact ID and Site ID are required');
    });

    it('should handle missing site ID', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: '',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        data: { title: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Artifact ID and Site ID are required');
    });

    it('should handle missing title', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        data: {} as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Infographic data with title is required');
    });

    it('should generate interactive HTML format when requested', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        interactive: true,
        data: {
          title: 'Interactive Timeline',
          timelineData: [
            {
              id: 'event-1',
              date: '1200 CE',
              title: 'Event',
              description: 'Description',
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('interactive-html');
      expect(result.interactive).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate timeline data', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'timeline',
        language: Language.ENGLISH,
        data: {
          title: 'Timeline',
          timelineData: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeline data is required for timeline infographics');
    });

    it('should validate map data', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'map',
        language: Language.ENGLISH,
        data: {
          title: 'Map',
          mapData: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Map data is required for map infographics');
    });

    it('should validate diagram data', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'diagram',
        language: Language.ENGLISH,
        data: {
          title: 'Diagram',
          diagramData: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Diagram data is required for diagram infographics');
    });

    it('should validate architectural data', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'architectural',
        language: Language.ENGLISH,
        data: {
          title: 'Architecture',
          architecturalData: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Architectural data is required for architectural infographics');
    });

    it('should validate latitude range', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'map',
        language: Language.ENGLISH,
        data: {
          title: 'Map',
          mapData: [
            {
              id: 'loc-1',
              name: 'Invalid Location',
              latitude: 100, // Invalid
              longitude: 77.5946,
            },
          ],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid latitude');
    });

    it('should validate longitude range', async () => {
      const result = await service.generateInfographic({
        artifactId: 'artifact-123',
        siteId: 'site-456',
        infographicType: 'map',
        language: Language.ENGLISH,
        data: {
          title: 'Map',
          mapData: [
            {
              id: 'loc-1',
              name: 'Invalid Location',
              latitude: 12.9716,
              longitude: 200, // Invalid
            },
          ],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid longitude');
    });
  });

  describe('addInteractiveElements', () => {
    it('should add interactive elements successfully', () => {
      const result = service.addInteractiveElements('infographic-123', [
        {
          id: 'elem-1',
          type: 'hotspot',
          targetId: 'node-1',
          action: 'show-details',
        },
      ]);

      expect(result.success).toBe(true);
    });

    it('should handle empty elements array', () => {
      const result = service.addInteractiveElements('infographic-123', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('At least one interactive element is required');
    });
  });

  describe('optimizeForMobile', () => {
    it('should optimize for mobile successfully', () => {
      const result = service.optimizeForMobile(
        'https://cdn.avvari.com/infographics/test.svg',
        'timeline'
      );

      expect(result.success).toBe(true);
      expect(result.mobileUrl).toContain('-mobile');
    });

    it('should handle HTML format', () => {
      const result = service.optimizeForMobile(
        'https://cdn.avvari.com/infographics/test.html',
        'map'
      );

      expect(result.success).toBe(true);
      expect(result.mobileUrl).toContain('-mobile.html');
    });
  });

  describe('getDimensions', () => {
    it('should return dimensions for timeline', () => {
      const dims = service.getDimensions('timeline');

      expect(dims.width).toBe(1200);
      expect(dims.height).toBe(600);
    });

    it('should return dimensions for map', () => {
      const dims = service.getDimensions('map');

      expect(dims.width).toBe(1000);
      expect(dims.height).toBe(800);
    });

    it('should return dimensions for diagram', () => {
      const dims = service.getDimensions('diagram');

      expect(dims.width).toBe(1000);
      expect(dims.height).toBe(1000);
    });

    it('should return dimensions for architectural', () => {
      const dims = service.getDimensions('architectural');

      expect(dims.width).toBe(1200);
      expect(dims.height).toBe(900);
    });

    it('should return dimensions for cultural-context', () => {
      const dims = service.getDimensions('cultural-context');

      expect(dims.width).toBe(1000);
      expect(dims.height).toBe(700);
    });
  });

  describe('Utility Methods', () => {
    it('should return supported types', () => {
      const types = service.getSupportedTypes();

      expect(types).toContain('timeline');
      expect(types).toContain('map');
      expect(types).toContain('diagram');
      expect(types).toContain('architectural');
      expect(types).toContain('cultural-context');
      expect(types.length).toBe(5);
    });

    it('should return supported formats', () => {
      const formats = service.getSupportedFormats();

      expect(formats).toContain('svg');
      expect(formats).toContain('png');
      expect(formats).toContain('interactive-html');
      expect(formats.length).toBe(3);
    });

    it('should validate type support', () => {
      expect(service.isTypeSupported('timeline')).toBe(true);
      expect(service.isTypeSupported('map')).toBe(true);
      expect(service.isTypeSupported('invalid')).toBe(false);
    });

    it('should validate format support', () => {
      expect(service.isFormatSupported('svg')).toBe(true);
      expect(service.isFormatSupported('png')).toBe(true);
      expect(service.isFormatSupported('interactive-html')).toBe(true);
      expect(service.isFormatSupported('jpg')).toBe(false);
    });
  });

  describe('extractArchitecturalInfo', () => {
    it('should extract architectural info from artifact data', () => {
      const artifactData = {
        architecture: [
          {
            id: 'elem-1',
            name: 'Pillar',
            type: 'structure',
            description: 'Stone pillar',
          },
        ],
      };

      const elements = service.extractArchitecturalInfo(artifactData);

      expect(elements.length).toBe(1);
      expect(elements[0].name).toBe('Pillar');
    });

    it('should return empty array when no architecture data', () => {
      const elements = service.extractArchitecturalInfo({});

      expect(elements).toEqual([]);
    });
  });

  describe('generateTimelineFromEvents', () => {
    it('should generate timeline from events', () => {
      const events = [
        {
          date: '1200 CE',
          title: 'Event 1',
          description: 'Description 1',
        },
        {
          year: '1300 CE',
          name: 'Event 2',
          description: 'Description 2',
        },
      ];

      const timeline = service.generateTimelineFromEvents(events);

      expect(timeline.length).toBe(2);
      expect(timeline[0].title).toBe('Event 1');
      expect(timeline[1].title).toBe('Event 2');
      expect(timeline[1].date).toBe('1300 CE');
    });

    it('should handle missing fields', () => {
      const events = [{}];

      const timeline = service.generateTimelineFromEvents(events);

      expect(timeline.length).toBe(1);
      expect(timeline[0].date).toBe('Unknown');
      expect(timeline[0].title).toBe('Untitled Event');
    });
  });

  describe('calculateMapBounds', () => {
    it('should calculate bounds from locations', () => {
      const locations = [
        { id: '1', name: 'Loc1', latitude: 10, longitude: 20 },
        { id: '2', name: 'Loc2', latitude: 15, longitude: 25 },
        { id: '3', name: 'Loc3', latitude: 12, longitude: 22 },
      ];

      const bounds = service.calculateMapBounds(locations);

      expect(bounds.minLat).toBe(10);
      expect(bounds.maxLat).toBe(15);
      expect(bounds.minLng).toBe(20);
      expect(bounds.maxLng).toBe(25);
    });

    it('should handle empty locations array', () => {
      const bounds = service.calculateMapBounds([]);

      expect(bounds.minLat).toBe(0);
      expect(bounds.maxLat).toBe(0);
      expect(bounds.minLng).toBe(0);
      expect(bounds.maxLng).toBe(0);
    });

    it('should handle single location', () => {
      const locations = [{ id: '1', name: 'Loc1', latitude: 10, longitude: 20 }];

      const bounds = service.calculateMapBounds(locations);

      expect(bounds.minLat).toBe(10);
      expect(bounds.maxLat).toBe(10);
      expect(bounds.minLng).toBe(20);
      expect(bounds.maxLng).toBe(20);
    });
  });
});
