// Local Development Routes for Trusted Sources
// In-memory storage for testing without AWS deployment

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Load seed data from JSON file
function loadSeedData(): any[] {
  try {
    const seedFilePath = path.join(__dirname, '../../data/trusted-sources-seed.json');
    const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    
    // Transform seed data to match our internal format
    return seedData.sources.map((source: any, index: number) => ({
      sourceId: `source_${String(index + 1).padStart(3, '0')}`,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      verificationStatus: 'verified',
      verifiedBy: seedData.verifiedBy,
      verifiedDate: seedData.lastUpdated,
      applicableStates: source.applicableStates || [],
      applicableTemples: source.applicableTemples || [],
      trustScore: source.trustScore,
      isActive: true,
      addedBy: seedData.verifiedBy,
      addedDate: seedData.lastUpdated,
      metadata: source.metadata,
    }));
  } catch (error) {
    console.error('Failed to load seed data, using minimal defaults:', error);
    // Fallback to minimal sample data if seed file not found
    return [
      {
        sourceId: 'source_001',
        sourceName: 'Sri Kalahasteeswara Swamy Temple Official',
        sourceUrl: 'https://www.srikalahasti.org',
        sourceType: 'temple_official',
        verificationStatus: 'verified',
        verifiedBy: 'admin@example.com',
        verifiedDate: '2026-03-03T10:00:00Z',
        applicableTemples: ['AP_CHI_SRI_sri-kalahasteeswara-swamy-temple'],
        trustScore: 10,
        isActive: true,
        addedBy: 'admin@example.com',
        addedDate: '2026-03-01T09:00:00Z',
        metadata: {
          description: 'Official website of Sri Kalahasteeswara Swamy Temple',
          managementBody: 'Sri Kalahasteeswara Swamy Devasthanam',
          contactEmail: 'info@srikalahasti.org',
        },
      },
    ];
  }
}

// In-memory storage (resets when server restarts)
let trustedSources: any[] = loadSeedData();

let templeSourceMappings: any[] = [];

// List all trusted sources
router.get('/admin/trusted-sources', (req: Request, res: Response) => {
  const { sourceType, verificationStatus, isActive } = req.query;

  let filtered = [...trustedSources];

  if (sourceType) {
    filtered = filtered.filter((s) => s.sourceType === sourceType);
  }

  if (verificationStatus) {
    filtered = filtered.filter((s) => s.verificationStatus === verificationStatus);
  }

  if (isActive !== undefined) {
    filtered = filtered.filter((s) => s.isActive === (isActive === 'true'));
  }

  // Sort by trust score (descending)
  filtered.sort((a, b) => b.trustScore - a.trustScore);

  res.json({
    success: true,
    data: {
      sources: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
    },
  });
});

// Get single trusted source
router.get('/admin/trusted-sources/:sourceId', (req: Request, res: Response) => {
  const { sourceId } = req.params;
  const source = trustedSources.find((s) => s.sourceId === sourceId);

  if (!source) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  res.json({
    success: true,
    data: source,
  });
});

// Create new trusted source
router.post('/admin/trusted-sources', (req: Request, res: Response) => {
  const { sourceName, sourceUrl, sourceType, applicableStates, applicableTemples, trustScore, metadata } = req.body;

  if (!sourceName || !sourceUrl || !sourceType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: sourceName, sourceUrl, sourceType',
    });
  }

  const newSource = {
    sourceId: `source_${Date.now()}`,
    sourceName,
    sourceUrl,
    sourceType,
    verificationStatus: 'pending',
    applicableStates: applicableStates || [],
    applicableTemples: applicableTemples || [],
    trustScore: trustScore || 5,
    isActive: true,
    addedBy: 'admin@example.com',
    addedDate: new Date().toISOString(),
    metadata: metadata || {},
  };

  trustedSources.push(newSource);

  res.status(201).json({
    success: true,
    data: newSource,
    message: 'Trusted source created successfully',
  });
});

// Update trusted source
router.put('/admin/trusted-sources/:sourceId', (req: Request, res: Response) => {
  const { sourceId } = req.params;
  const index = trustedSources.findIndex((s) => s.sourceId === sourceId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  trustedSources[index] = {
    ...trustedSources[index],
    ...req.body,
    updatedBy: 'admin@example.com',
    updatedDate: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: trustedSources[index],
    message: 'Trusted source updated successfully',
  });
});

// Delete trusted source
router.delete('/admin/trusted-sources/:sourceId', (req: Request, res: Response) => {
  const { sourceId } = req.params;
  const index = trustedSources.findIndex((s) => s.sourceId === sourceId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  trustedSources.splice(index, 1);

  res.json({
    success: true,
    message: 'Trusted source deleted successfully',
  });
});

// Verify trusted source
router.post('/admin/trusted-sources/:sourceId/verify', (req: Request, res: Response) => {
  const { sourceId } = req.params;
  const index = trustedSources.findIndex((s) => s.sourceId === sourceId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  trustedSources[index].verificationStatus = 'verified';
  trustedSources[index].verifiedBy = 'admin@example.com';
  trustedSources[index].verifiedDate = new Date().toISOString();

  res.json({
    success: true,
    data: trustedSources[index],
    message: 'Source verified successfully',
  });
});

// Unverify trusted source
router.post('/admin/trusted-sources/:sourceId/unverify', (req: Request, res: Response) => {
  const { sourceId } = req.params;
  const index = trustedSources.findIndex((s) => s.sourceId === sourceId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  trustedSources[index].verificationStatus = 'unverified';

  res.json({
    success: true,
    data: trustedSources[index],
    message: 'Source unverified',
  });
});

// Get sources for a temple
router.get('/admin/temples/:templeId/sources', (req: Request, res: Response) => {
  const { templeId } = req.params;
  const mappings = templeSourceMappings.filter((m) => m.templeId === templeId);

  const templeSources = mappings.map((mapping) => {
    const source = trustedSources.find((s) => s.sourceId === mapping.sourceId);
    return {
      ...source,
      mapping,
    };
  });

  res.json({
    success: true,
    data: {
      templeSources,
      total: templeSources.length,
    },
  });
});

// Add source to temple
router.post('/admin/temples/:templeId/sources', (req: Request, res: Response) => {
  const { templeId } = req.params;
  const { sourceId, isPrimary, priority, usedForContentGeneration } = req.body;

  if (!sourceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: sourceId',
    });
  }

  // Check if source exists
  const source = trustedSources.find((s) => s.sourceId === sourceId);
  if (!source) {
    return res.status(404).json({
      success: false,
      error: `Source not found: ${sourceId}`,
    });
  }

  // Check if mapping already exists
  const existingMapping = templeSourceMappings.find(
    (m) => m.templeId === templeId && m.sourceId === sourceId
  );

  if (existingMapping) {
    return res.status(409).json({
      success: false,
      error: 'Source already mapped to this temple',
    });
  }

  // If this is primary, unset other primary sources
  if (isPrimary) {
    templeSourceMappings.forEach((m) => {
      if (m.templeId === templeId && m.isPrimary) {
        m.isPrimary = false;
      }
    });
  }

  const newMapping = {
    mappingId: `mapping_${Date.now()}`,
    templeId,
    sourceId,
    isPrimary: isPrimary || false,
    priority: priority || 999,
    usedForContentGeneration: usedForContentGeneration !== false,
    addedBy: 'admin@example.com',
    addedDate: new Date().toISOString(),
  };

  templeSourceMappings.push(newMapping);

  res.status(201).json({
    success: true,
    data: newMapping,
    message: 'Source added to temple successfully',
  });
});

// Remove source from temple
router.delete('/admin/temples/:templeId/sources/:sourceId', (req: Request, res: Response) => {
  const { templeId, sourceId } = req.params;
  const index = templeSourceMappings.findIndex(
    (m) => m.templeId === templeId && m.sourceId === sourceId
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Mapping not found',
    });
  }

  templeSourceMappings.splice(index, 1);

  res.json({
    success: true,
    message: 'Source removed from temple successfully',
  });
});

export default router;
