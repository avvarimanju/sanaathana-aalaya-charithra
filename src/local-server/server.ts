/**
 * Local Development Server
 * Wraps Lambda functions for local testing with LocalStack
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '.env.local') });

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as templeService from '../temple-pricing/lambdas/temple-management/templeService';
import * as pricingService from '../temple-pricing/lambdas/pricing-service/pricingService';
import * as priceCalculator from '../temple-pricing/lambdas/price-calculator/priceCalculatorService';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware - colorful request logs
morgan.token('user-id', (req: Request) => {
  return req.headers['x-user-id'] as string || 'anonymous';
});

// Custom format with colors and user tracking
app.use(morgan(':method :url :status :response-time ms - :res[content-length] bytes - User: :user-id', {
  skip: (req) => req.url === '/health' // Skip health check logs to reduce noise
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    environment: 'local',
    localstack: 'http://localhost:4566',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// TEMPLE MANAGEMENT ROUTES
// ============================================================================

// Create temple
app.post('/api/temples', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    console.log(`📝 Creating temple: ${req.body.name} (User: ${userId})`);
    const temple = await templeService.createTemple(req.body, userId);
    console.log(`✅ Temple created: ${temple.templeId}`);
    res.status(201).json(temple);
  } catch (error: any) {
    console.error(`❌ Error creating temple:`, error.message);
    res.status(error.statusCode || 500).json({ error: error.message, details: error.stack });
  }
});

// Get temple
app.get('/api/temples/:id', async (req: Request, res: Response) => {
  try {
    const temple = await templeService.getTemple(req.params.id);
    res.json(temple);
  } catch (error: any) {
    res.status(error.statusCode || 404).json({ error: error.message });
  }
});

// List temples
app.get('/api/temples', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const accessMode = req.query.accessMode as any;
    const status = req.query.status as 'active' | 'inactive';
    
    const result = await templeService.listTemples({
      limit,
      accessMode,
      status
    });
    console.log(`📋 Listed ${result.items.length} temples (Total: ${result.total})`);
    res.json(result);
  } catch (error: any) {
    console.error(`❌ Error listing temples:`, error.message);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Update temple
app.put('/api/temples/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    const temple = await templeService.updateTemple(req.params.id, req.body, userId);
    res.json(temple);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Delete temple
app.delete('/api/temples/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    await templeService.deleteTemple(req.params.id, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// ============================================================================
// TEMPLE GROUP ROUTES
// ============================================================================

// Create temple group
app.post('/api/temple-groups', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    const group = await templeService.createTempleGroup(req.body, userId);
    res.status(201).json(group);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get temple group
app.get('/api/temple-groups/:id', async (req: Request, res: Response) => {
  try {
    const group = await templeService.getTempleGroup(req.params.id);
    res.json(group);
  } catch (error: any) {
    res.status(error.statusCode || 404).json({ error: error.message });
  }
});

// List temple groups
app.get('/api/temple-groups', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as 'active' | 'inactive';
    
    const result = await templeService.listTempleGroups({
      limit,
      status
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ARTIFACT ROUTES
// ============================================================================

// Create artifact
app.post('/api/artifacts', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    const artifact = await templeService.createArtifact(req.body, userId);
    res.status(201).json(artifact);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get artifact
app.get('/api/artifacts/:id', async (req: Request, res: Response) => {
  try {
    const artifact = await templeService.getArtifact(req.params.id);
    res.json(artifact);
  } catch (error: any) {
    res.status(error.statusCode || 404).json({ error: error.message });
  }
});

// List artifacts
app.get('/api/artifacts', async (req: Request, res: Response) => {
  try {
    const templeId = req.query.templeId as string;
    const status = req.query.status as 'active' | 'inactive' | undefined;
    
    if (templeId) {
      const result = await templeService.listArtifacts(templeId, status);
      res.json(result);
    } else {
      res.status(400).json({ error: 'templeId query parameter is required' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PRICING ROUTES
// ============================================================================

// Set price configuration
app.post('/api/pricing/configure', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    const { entityId, entityType, priceAmount, overrideReason } = req.body;
    const priceConfig = await pricingService.setPriceConfiguration(
      { entityId, entityType, priceAmount, overrideReason },
      userId
    );
    res.status(201).json(priceConfig);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Get price configuration
app.get('/api/pricing/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const entityType = req.query.entityType as any;
    if (!entityType) {
      res.status(400).json({ error: 'entityType query parameter is required' });
      return;
    }
    const priceConfig = await pricingService.getPriceConfiguration(entityType, entityId);
    res.json(priceConfig || { entityId, entityType, message: 'No price configuration found' });
  } catch (error: any) {
    res.status(error.statusCode || 404).json({ error: error.message });
  }
});

// Get price history
app.get('/api/pricing/:entityId/history', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const entityType = req.query.entityType as any;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    if (!entityType) {
      res.status(400).json({ error: 'entityType query parameter is required' });
      return;
    }
    
    const history = await pricingService.getPriceHistory(entityType, entityId, {
      startDate,
      endDate,
      limit
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PRICE CALCULATOR ROUTES
// ============================================================================

// Set pricing formula
app.post('/api/calculator/formula', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'local-admin';
    const { category, basePrice, perQRCodePrice, roundingRule, discountFactor } = req.body;
    const formula = await priceCalculator.setPricingFormula(
      category,
      basePrice,
      perQRCodePrice,
      roundingRule,
      discountFactor,
      userId
    );
    res.status(201).json(formula);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Calculate suggested price
app.post('/api/calculator/suggest', async (req: Request, res: Response) => {
  try {
    const { entityId, entityType, qrCodeCount } = req.body;
    const result = await priceCalculator.calculateSuggestedPrice(entityId, entityType, qrCodeCount);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate formula change
app.post('/api/calculator/simulate', async (req: Request, res: Response) => {
  try {
    const { basePrice, perQRCodePrice, roundingRule, discountFactor, entities } = req.body;
    const simulation = await priceCalculator.simulateFormulaChange(
      basePrice,
      perQRCodePrice,
      roundingRule,
      discountFactor,
      entities
    );
    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTENT GENERATION ROUTES (In-memory for now, migrate to DynamoDB later)
// ============================================================================

const contentJobs: any[] = [];
let nextJobId = 1;

app.get('/api/content/jobs', (req: Request, res: Response) => {
  const { status, artifactId, limit } = req.query;
  let filtered = [...contentJobs];
  
  if (status) filtered = filtered.filter(j => j.status === status);
  if (artifactId) filtered = filtered.filter(j => j.artifactId === artifactId);
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  
  res.json({ items: filtered, total: filtered.length });
});

app.get('/api/content/jobs/:id', (req: Request, res: Response) => {
  const job = contentJobs.find(j => j.jobId === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/api/content/generate', (req: Request, res: Response) => {
  const { artifactId, contentType, language, sources, customPrompt } = req.body;
  
  const newJob = {
    jobId: `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    artifactId,
    contentType,
    language,
    sources: sources || [],
    customPrompt: customPrompt || '',
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    createdBy: req.headers['x-user-id'] || 'admin',
    updatedAt: new Date().toISOString()
  };
  
  contentJobs.push(newJob);
  res.status(201).json(newJob);
});

app.put('/api/content/jobs/:id', (req: Request, res: Response) => {
  const index = contentJobs.findIndex(j => j.jobId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });
  
  contentJobs[index] = {
    ...contentJobs[index],
    ...req.body,
    jobId: contentJobs[index].jobId,
    updatedAt: new Date().toISOString()
  };
  
  res.json(contentJobs[index]);
});

app.delete('/api/content/jobs/:id', (req: Request, res: Response) => {
  const index = contentJobs.findIndex(j => j.jobId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });
  
  contentJobs.splice(index, 1);
  res.status(204).send();
});

app.get('/api/content', (req: Request, res: Response) => {
  const { artifactId, language } = req.query;
  // Placeholder - return empty for now
  res.json({ items: [] });
});

// ============================================================================
// USER MANAGEMENT ROUTES (In-memory for now, migrate to DynamoDB later)
// ============================================================================

const adminUsers: any[] = [
  {
    userId: 'admin-1',
    name: 'System Administrator',
    email: 'admin@sanaathana.org',
    role: 'admin',
    status: 'active',
    lastLogin: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system'
  }
];
const mobileUsers: any[] = [];
let nextAdminId = 2;

app.get('/api/admin/users', (req: Request, res: Response) => {
  const { role, status, search, limit } = req.query;
  let filtered = [...adminUsers];
  
  if (role) filtered = filtered.filter(u => u.role === role);
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  
  res.json({ items: filtered, total: filtered.length });
});

app.get('/api/admin/users/:id', (req: Request, res: Response) => {
  const user = adminUsers.find(u => u.userId === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/admin/users', (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  
  if (adminUsers.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    userId: `admin-${nextAdminId++}`,
    name,
    email,
    role,
    status: 'active',
    lastLogin: null,
    createdAt: new Date().toISOString(),
    createdBy: req.headers['x-user-id'] || 'admin'
  };
  
  adminUsers.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', (req: Request, res: Response) => {
  const index = adminUsers.findIndex(u => u.userId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  adminUsers[index] = {
    ...adminUsers[index],
    ...req.body,
    userId: adminUsers[index].userId,
    updatedAt: new Date().toISOString()
  };
  
  res.json(adminUsers[index]);
});

app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const index = adminUsers.findIndex(u => u.userId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  adminUsers.splice(index, 1);
  res.status(204).send();
});

app.get('/api/mobile/users', (req: Request, res: Response) => {
  const { status, search, limit } = req.query;
  let filtered = [...mobileUsers];
  
  if (status) filtered = filtered.filter(u => u.status === status);
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  
  res.json({ items: filtered, total: filtered.length });
});

app.put('/api/mobile/users/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const index = mobileUsers.findIndex(u => u.userId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  mobileUsers[index].status = status;
  mobileUsers[index].updatedAt = new Date().toISOString();
  
  res.json(mobileUsers[index]);
});

// ============================================================================
// DEFECT TRACKING ROUTES (In-memory for now, migrate to DynamoDB later)
// ============================================================================

const defects: any[] = [];
let nextDefectId = 1;

app.get('/api/defects', (req: Request, res: Response) => {
  const { status, priority, type, assignedTo, limit } = req.query;
  let filtered = [...defects];
  
  if (status) filtered = filtered.filter(d => d.status === status);
  if (priority) filtered = filtered.filter(d => d.priority === priority);
  if (type) filtered = filtered.filter(d => d.type === type);
  if (assignedTo) filtered = filtered.filter(d => d.assignedTo === assignedTo);
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  
  res.json({ items: filtered, total: filtered.length });
});

app.get('/api/defects/:id', (req: Request, res: Response) => {
  const defect = defects.find(d => d.defectId === req.params.id);
  if (!defect) return res.status(404).json({ error: 'Defect not found' });
  res.json(defect);
});

app.post('/api/defects', (req: Request, res: Response) => {
  const { title, description, type, priority, reportedBy } = req.body;
  
  const newDefect = {
    defectId: `defect-${nextDefectId++}`,
    title,
    description,
    type,
    priority: priority || 'medium',
    status: 'open',
    reportedBy: reportedBy || 'anonymous',
    assignedTo: null,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null
  };
  
  defects.push(newDefect);
  res.status(201).json(newDefect);
});

app.put('/api/defects/:id', (req: Request, res: Response) => {
  const index = defects.findIndex(d => d.defectId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Defect not found' });
  
  const currentDefect = defects[index];
  defects[index] = {
    ...currentDefect,
    ...req.body,
    defectId: currentDefect.defectId,
    updatedAt: new Date().toISOString()
  };
  
  if (defects[index].status === 'resolved' && currentDefect.status !== 'resolved') {
    defects[index].resolvedAt = new Date().toISOString();
  }
  
  res.json(defects[index]);
});

app.delete('/api/defects/:id', (req: Request, res: Response) => {
  const index = defects.findIndex(d => d.defectId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Defect not found' });
  
  defects.splice(index, 1);
  res.status(204).send();
});

app.post('/api/defects/:id/comments', (req: Request, res: Response) => {
  const { comment, author } = req.body;
  const defect = defects.find(d => d.defectId === req.params.id);
  if (!defect) return res.status(404).json({ error: 'Defect not found' });
  
  const newComment = {
    commentId: `comment-${Date.now()}`,
    comment,
    author: author || req.headers['x-user-id'] || 'admin',
    createdAt: new Date().toISOString()
  };
  
  defect.comments.push(newComment);
  defect.updatedAt = new Date().toISOString();
  
  res.status(201).json(newComment);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  console.error(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: [
      'GET /health',
      'POST /api/temples',
      'GET /api/temples',
      'POST /api/pricing/configure',
      'POST /api/calculator/suggest'
    ]
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('');
  console.error('❌ ============================================');
  console.error('❌ UNHANDLED ERROR');
  console.error('❌ ============================================');
  console.error(`❌ URL: ${req.method} ${req.url}`);
  console.error(`❌ Error: ${err.message}`);
  console.error(`❌ Stack: ${err.stack}`);
  console.error('❌ ============================================');
  console.error('');
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.clear(); // Clear console for clean startup
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   🚀 Local Backend Server Started Successfully!           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📍 Server Information:');
  console.log(`   • Server URL:        http://localhost:${PORT}`);
  console.log(`   • LocalStack:        http://localhost:4566`);
  console.log(`   • Admin Portal:      http://localhost:5173`);
  console.log(`   • Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📊 Monitoring:');
  console.log('   • Request logging:   ✅ Enabled (Morgan)');
  console.log('   • Error tracking:    ✅ Enabled');
  console.log('   • User tracking:     ✅ Enabled (x-user-id header)');
  console.log('');
  console.log('🔗 Available Endpoints:');
  console.log('   Health Check:');
  console.log('     GET    /health');
  console.log('');
  console.log('   Temple Management:');
  console.log('     POST   /api/temples');
  console.log('     GET    /api/temples');
  console.log('     GET    /api/temples/:id');
  console.log('     PUT    /api/temples/:id');
  console.log('     DELETE /api/temples/:id');
  console.log('');
  console.log('   Temple Groups:');
  console.log('     POST   /api/temple-groups');
  console.log('     GET    /api/temple-groups');
  console.log('     GET    /api/temple-groups/:id');
  console.log('');
  console.log('   Artifacts:');
  console.log('     POST   /api/artifacts');
  console.log('     GET    /api/artifacts?templeId=xxx');
  console.log('     GET    /api/artifacts/:id');
  console.log('');
  console.log('   Pricing:');
  console.log('     POST   /api/pricing/configure');
  console.log('     GET    /api/pricing/:entityId?entityType=TEMPLE');
  console.log('     GET    /api/pricing/:entityId/history');
  console.log('');
  console.log('   Price Calculator:');
  console.log('     POST   /api/calculator/formula');
  console.log('     POST   /api/calculator/suggest');
  console.log('     POST   /api/calculator/simulate');
  console.log('');
  console.log('   Content Generation:');
  console.log('     GET    /api/content/jobs');
  console.log('     POST   /api/content/generate');
  console.log('     PUT    /api/content/jobs/:id');
  console.log('     DELETE /api/content/jobs/:id');
  console.log('');
  console.log('   User Management:');
  console.log('     GET    /api/admin/users');
  console.log('     POST   /api/admin/users');
  console.log('     PUT    /api/admin/users/:id');
  console.log('     DELETE /api/admin/users/:id');
  console.log('     GET    /api/mobile/users');
  console.log('');
  console.log('   Defect Tracking:');
  console.log('     GET    /api/defects');
  console.log('     POST   /api/defects');
  console.log('     PUT    /api/defects/:id');
  console.log('     DELETE /api/defects/:id');
  console.log('     POST   /api/defects/:id/comments');
  console.log('');
  console.log('💡 Tips:');
  console.log('   • All requests are logged below with response times');
  console.log('   • Add x-user-id header to track admin actions');
  console.log('   • Health check logs are hidden to reduce noise');
  console.log('   • Press Ctrl+C to stop the server');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('📝 Request Logs:');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
});
