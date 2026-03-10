/**
 * Local Development Server - Simplified for Trusted Sources Testing
 * Only includes trusted sources routes
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '.env.local') });

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import trustedSourcesRoutes from './trustedSourcesRoutes';
import mockRoutes from './mockRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
morgan.token('user-id', (req: Request) => {
  return req.headers['x-user-id'] as string || 'anonymous';
});

app.use(morgan(':method :url :status :response-time ms - User: :user-id', {
  skip: (req) => req.url === '/health'
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    environment: 'local',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// TRUSTED SOURCES ROUTES
// ============================================================================
app.use('/api', trustedSourcesRoutes);

// ============================================================================
// MOCK ROUTES (Temples, Artifacts, Pricing, etc.)
// ============================================================================
app.use('/api', mockRoutes);

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
      'GET /api/admin/trusted-sources',
      'POST /api/admin/trusted-sources',
      'GET /api/admin/trusted-sources/:sourceId',
      'PUT /api/admin/trusted-sources/:sourceId',
      'DELETE /api/admin/trusted-sources/:sourceId'
    ]
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('❌ Error:', err.message);
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
  console.clear();
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('   Local Backend Server Started Successfully!');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Server Information:');
  console.log(`   Server URL:        http://localhost:${PORT}`);
  console.log(`   Admin Portal:      http://localhost:5173`);
  console.log(`   Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('   Health Check:');
  console.log('     GET    /health');
  console.log('');
  console.log('   Trusted Sources:');
  console.log('     GET    /api/admin/trusted-sources');
  console.log('     POST   /api/admin/trusted-sources');
  console.log('     GET    /api/admin/trusted-sources/:sourceId');
  console.log('     PUT    /api/admin/trusted-sources/:sourceId');
  console.log('     DELETE /api/admin/trusted-sources/:sourceId');
  console.log('     POST   /api/admin/trusted-sources/:sourceId/verify');
  console.log('     POST   /api/admin/trusted-sources/:sourceId/unverify');
  console.log('     GET    /api/admin/temples/:templeId/sources');
  console.log('     POST   /api/admin/temples/:templeId/sources');
  console.log('     DELETE /api/admin/temples/:templeId/sources/:sourceId');
  console.log('');
  console.log('Tips:');
  console.log('   • 45+ verified sources pre-loaded!');
  console.log('   • Open http://localhost:5173/trusted-sources to test');
  console.log('   • Press Ctrl+C to stop the server');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Request Logs:');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
});
