import { Hono } from 'hono';
import aiRoutes from './ai.routes';
import manualRoutes from './manual.routes';
import documentRoutes from './document.routes';
import rubricRoutes from './rubric.routes';
import exportRoutes from './export.routes';
import healthRoutes from './health.routes';

/**
 * Main Routes Index
 * Centralized route management following REST API conventions
 * 
 * Route Structure:
 * - /api/v1/ai/*           - AI-powered grading and analysis
 * - /api/v1/manual/*       - Manual rule-based grading
 * - /api/v1/documents/*    - Document parsing and analysis
 * - /api/v1/rubrics/*      - Rubric and criteria management
 * - /api/v1/exports/*      - Data export and report generation
 * - /api/v1/health/*       - Health checks and monitoring
 */

// Create main API router
const apiRoutes = new Hono();

// Register route modules with proper prefixes
apiRoutes.route('/ai', aiRoutes);
apiRoutes.route('/manual', manualRoutes);
apiRoutes.route('/documents', documentRoutes);
apiRoutes.route('/rubrics', rubricRoutes);
apiRoutes.route('/exports', exportRoutes);
apiRoutes.route('/health', healthRoutes);

// API version routes
const v1Routes = new Hono();
v1Routes.route('/v1', apiRoutes);

// Root routes handler
const routes = new Hono();
routes.route('/api', v1Routes);

// Add a root health check endpoint
routes.get('/', async (c) => {
  return c.json({
    success: true,
    message: 'Office Format Grader API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default routes;