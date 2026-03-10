/**
 * Mock Routes for Local Development
 * Provides mock data for all API endpoints
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Load temples from verified seed data (manually verified, high quality)
let templesData: any[] = [];
try {
  // When using ts-node, __dirname is src/local-server
  // When compiled, __dirname is src/local-server/dist
  // So we try both paths
  let templesFilePath = path.resolve(__dirname, '../../data/verified-temples-seed.json');
  if (!fs.existsSync(templesFilePath)) {
    templesFilePath = path.resolve(__dirname, '../../../data/verified-temples-seed.json');
  }
  console.log('Loading temples from:', templesFilePath);
  const templesFileContent = fs.readFileSync(templesFilePath, 'utf-8');
  
  templesData = JSON.parse(templesFileContent);
  
  console.log(`✅ Loaded ${templesData.length} verified temples`);
  console.log(`📝 Data Source: Manually verified, high quality`);
} catch (error) {
  console.error('❌ Error loading temples data:', error);
  // Fallback to sample data
  templesData = [
    {
      templeId: 'temple-1',
      name: 'Lepakshi Temple',
      description: 'Famous for its hanging pillar and Nandi statue',
      location: {
        state: 'Andhra Pradesh',
        city: 'Lepakshi',
        district: 'Anantapur',
        address: 'Lepakshi, Anantapur District, Andhra Pradesh'
      },
      accessMode: 'PAID',
      status: 'active',
      activeArtifactCount: 5,
      qrCodeCount: 5,
      imageUrl: '',
      dataSource: 'Manual Entry',
      dataSourceUrl: '',
      dataLicense: '',
      createdAt: new Date().toISOString(),
      createdBy: 'admin@local',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@local',
      version: 1
    },
    {
      templeId: 'temple-2',
      name: 'Tirumala Temple',
      description: 'One of the richest temples in the world',
      location: {
        state: 'Andhra Pradesh',
        city: 'Tirupati',
        district: 'Tirupati',
        address: 'Tirumala, Tirupati, Andhra Pradesh'
      },
      accessMode: 'FREE',
      status: 'active',
      activeArtifactCount: 10,
      qrCodeCount: 10,
      imageUrl: '',
      dataSource: 'Manual Entry',
      dataSourceUrl: '',
      dataLicense: '',
      createdAt: new Date().toISOString(),
      createdBy: 'admin@local',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@local',
      version: 1
    }
  ];
}

// In-memory storage for mock data
const mockData = {
  temples: templesData, // Use loaded temples data
  artifacts: [
    {
      artifactId: 'artifact-1',
      templeId: 'temple-1',
      name: 'Hanging Pillar',
      description: 'A pillar that doesn\'t touch the ground',
      qrCodeId: 'QR-LEPAKSHI-001',
      qrCodeImageUrl: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin@local',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@local'
    }
  ],
  users: [
    {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  pricingFormulas: [] as any[],
  contentJobs: [] as any[],
  defects: [] as any[]
};

// ============================================================================
// TEMPLES
// ============================================================================

router.get('/temples', (req: Request, res: Response) => {
  res.json({
    items: mockData.temples,
    total: mockData.temples.length
  });
});

router.get('/temples/:id', (req: Request, res: Response) => {
  const temple = mockData.temples.find(t => t.templeId === req.params.id);
  if (!temple) {
    return res.status(404).json({ error: 'Temple not found' });
  }
  res.json(temple);
});

router.post('/temples', (req: Request, res: Response) => {
  const newTemple = {
    templeId: `temple-${Date.now()}`,
    ...req.body,
    imageUrl: req.body.imageUrl || '', // Preserve imageUrl from request
    status: 'active',
    activeArtifactCount: 0,
    qrCodeCount: 0,
    createdAt: new Date().toISOString(),
    createdBy: 'admin@local',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@local',
    version: 1
  };
  mockData.temples.push(newTemple);
  res.status(201).json(newTemple);
});

router.put('/temples/:id', (req: Request, res: Response) => {
  const index = mockData.temples.findIndex(t => t.templeId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Temple not found' });
  }
  mockData.temples[index] = {
    ...mockData.temples[index],
    ...req.body,
    imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : mockData.temples[index].imageUrl, // Preserve imageUrl
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@local',
    version: mockData.temples[index].version + 1
  };
  res.json(mockData.temples[index]);
});

router.delete('/temples/:id', (req: Request, res: Response) => {
  const index = mockData.temples.findIndex(t => t.templeId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Temple not found' });
  }
  mockData.temples.splice(index, 1);
  res.status(204).send();
});

// ============================================================================
// ARTIFACTS
// ============================================================================

router.get('/artifacts', (req: Request, res: Response) => {
  const { templeId } = req.query;
  let artifacts = mockData.artifacts;
  if (templeId) {
    artifacts = artifacts.filter(a => a.templeId === templeId);
  }
  res.json({
    items: artifacts,
    total: artifacts.length
  });
});

router.post('/artifacts', (req: Request, res: Response) => {
  const newArtifact = {
    artifactId: `artifact-${Date.now()}`,
    ...req.body,
    qrCodeId: `QR-${Date.now()}`,
    qrCodeImageUrl: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'admin@local',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@local'
  };
  mockData.artifacts.push(newArtifact);
  res.status(201).json(newArtifact);
});

router.put('/artifacts/:id', (req: Request, res: Response) => {
  const index = mockData.artifacts.findIndex(a => a.artifactId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  mockData.artifacts[index] = {
    ...mockData.artifacts[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@local'
  };
  res.json(mockData.artifacts[index]);
});

router.delete('/artifacts/:id', (req: Request, res: Response) => {
  const index = mockData.artifacts.findIndex(a => a.artifactId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Artifact not found' });
  }
  mockData.artifacts.splice(index, 1);
  res.status(204).send();
});

// ============================================================================
// PRICING
// ============================================================================

router.get('/pricing/suggestions', (req: Request, res: Response) => {
  res.json({
    items: [
      { 
        entityId: 'temple-1',
        entityName: 'Lepakshi Temple',
        entityType: 'TEMPLE',
        qrCodeCount: 5,
        currentPrice: 100,
        suggestedPrice: 120,
        difference: -20
      },
      { 
        entityId: 'temple-2',
        entityName: 'Tirumala Temple',
        entityType: 'TEMPLE',
        qrCodeCount: 10,
        currentPrice: null,
        suggestedPrice: 150,
        difference: null
      }
    ]
  });
});

router.get('/pricing/formulas', (req: Request, res: Response) => {
  res.json(mockData.pricingFormulas);
});

router.get('/pricing/formula', (req: Request, res: Response) => {
  res.json({
    basePrice: 50,
    perQRCodePrice: 10,
    roundingRule: 'nearest10',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'admin@example.com'
  });
});

// ============================================================================
// CONTENT GENERATION
// ============================================================================

router.get('/content/jobs', (req: Request, res: Response) => {
  res.json({
    items: mockData.contentJobs,
    total: mockData.contentJobs.length
  });
});

router.post('/content/generate', (req: Request, res: Response) => {
  const newJob = {
    jobId: `job-${Date.now()}`,
    ...req.body,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    createdBy: 'admin@local',
    updatedAt: new Date().toISOString()
  };
  mockData.contentJobs.push(newJob);
  res.status(201).json(newJob);
});

// ============================================================================
// USERS
// ============================================================================

router.get('/users', (req: Request, res: Response) => {
  res.json(mockData.users);
});

// ============================================================================
// DEFECTS
// ============================================================================

router.get('/defects', (req: Request, res: Response) => {
  res.json({
    items: mockData.defects,
    total: mockData.defects.length
  });
});

router.post('/defects', (req: Request, res: Response) => {
  const newDefect = {
    defectId: `defect-${Date.now()}`,
    ...req.body,
    status: 'open',
    assignedTo: null,
    comments: [] as any[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null
  };
  mockData.defects.push(newDefect);
  res.status(201).json(newDefect);
});

router.put('/defects/:id', (req: Request, res: Response) => {
  const index = mockData.defects.findIndex((d: any) => d.defectId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Defect not found' });
  }
  mockData.defects[index] = {
    ...mockData.defects[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(mockData.defects[index]);
});

router.delete('/defects/:id', (req: Request, res: Response) => {
  const index = mockData.defects.findIndex((d: any) => d.defectId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Defect not found' });
  }
  mockData.defects.splice(index, 1);
  res.status(204).send();
});

router.post('/defects/:id/comments', (req: Request, res: Response) => {
  const defect = mockData.defects.find((d: any) => d.defectId === req.params.id);
  if (!defect) {
    return res.status(404).json({ error: 'Defect not found' });
  }
  const newComment = {
    commentId: `comment-${Date.now()}`,
    comment: req.body.comment,
    author: req.body.author || 'admin@local',
    createdAt: new Date().toISOString()
  };
  (defect as any).comments.push(newComment);
  res.status(201).json(newComment);
});

// ============================================================================
// STATES
// ============================================================================

router.get('/states', (req: Request, res: Response) => {
  res.json([
    { id: 'AP', name: 'Andhra Pradesh', visible: true, templeCount: 2 },
    { id: 'TN', name: 'Tamil Nadu', visible: true, templeCount: 0 },
    { id: 'KA', name: 'Karnataka', visible: true, templeCount: 0 }
  ]);
});

export default router;
