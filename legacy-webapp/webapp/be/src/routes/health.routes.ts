import { Hono } from 'hono';
import { HealthController } from '../controllers/health.controller';

/**
 * Health Routes
 * Handles application health check and monitoring endpoints
 */
const healthRoutes = new Hono();

// Initialize controller
const healthController = new HealthController();

/**
 * GET /health
 * Basic health check endpoint
 */
healthRoutes.get('/', async (c) => await healthController.basic(c));

/**
 * GET /health/detailed
 * Detailed health check with service status
 */
healthRoutes.get('/detailed', async (c) => await healthController.detailed(c));

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/container deployments
 */
healthRoutes.get('/ready', async (c) => await healthController.ready(c));

/**
 * GET /health/live
 * Liveness probe for Kubernetes/container deployments
 */
healthRoutes.get('/live', async (c) => await healthController.live(c));

export default healthRoutes;