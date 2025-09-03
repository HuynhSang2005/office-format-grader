import { Hono } from 'hono';
import { AiController } from '../controllers/ai.controller';
import { validateSchema } from '../middlewares/validation.middleware';
import { FileUploadSchema } from '../schemas/common.schema';

/**
 * AI Routes
 * Handles AI-powered grading endpoints following REST conventions
 */
const aiRoutes = new Hono();

// Initialize controller
const aiController = new AiController();

/**
 * POST /ai/grade/powerpoint
 * Grade PowerPoint document using AI
 */
aiRoutes.post(
  '/grade/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await aiController.gradePowerPoint(c)
);

/**
 * POST /ai/grade/word
 * Grade Word document using AI
 */
aiRoutes.post(
  '/grade/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await aiController.gradeWord(c)
);

/**
 * POST /ai/analyze/powerpoint
 * Analyze PowerPoint document structure without grading
 */
aiRoutes.post(
  '/analyze/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await aiController.analyzePowerPoint(c)
);

/**
 * POST /ai/analyze/word
 * Analyze Word document structure without grading
 */
aiRoutes.post(
  '/analyze/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await aiController.analyzeWord(c)
);

/**
 * GET /ai/status
 * Get AI service status and configuration
 */
aiRoutes.get('/status', async (c) => await aiController.getStatus(c));

export default aiRoutes;