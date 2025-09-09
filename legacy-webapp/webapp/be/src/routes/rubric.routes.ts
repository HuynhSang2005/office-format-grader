import { Hono } from 'hono';
import { RubricController } from '../controllers/rubric.controller';
import { validateSchema } from '../middlewares/validation.middleware';
import { RubricParamSchema } from '../schemas/common.schema';

/**
 * Rubric Routes
 * Handles rubric and criteria management endpoints following REST conventions
 */
const rubricRoutes = new Hono();

// Initialize controller
const rubricController = new RubricController();

/**
 * GET /rubrics/powerpoint
 * Get PowerPoint rubric data
 */
rubricRoutes.get('/powerpoint', async (c) => await rubricController.getPowerPointRubric(c));

/**
 * GET /rubrics/word
 * Get Word rubric data
 */
rubricRoutes.get('/word', async (c) => await rubricController.getWordRubric(c));

/**
 * GET /rubrics/powerpoint/criteria/:criterionId
 * Get specific criterion from PowerPoint rubric
 */
rubricRoutes.get(
  '/powerpoint/criteria/:criterionId',
  validateSchema(RubricParamSchema, 'param'),
  async (c) => await rubricController.getPowerPointCriterion(c)
);

/**
 * GET /rubrics/word/criteria/:criterionId
 * Get specific criterion from Word rubric
 */
rubricRoutes.get(
  '/word/criteria/:criterionId',
  validateSchema(RubricParamSchema, 'param'),
  async (c) => await rubricController.getWordCriterion(c)
);

/**
 * GET /rubrics/powerpoint/criteria
 * List all PowerPoint rubric criteria
 */
rubricRoutes.get('/powerpoint/criteria', async (c) => await rubricController.listPowerPointCriteria(c));

/**
 * GET /rubrics/word/criteria
 * List all Word rubric criteria
 */
rubricRoutes.get('/word/criteria', async (c) => await rubricController.listWordCriteria(c));

/**
 * POST /rubrics/validate
 * Validate rubric data structure
 */
rubricRoutes.post('/validate', async (c) => await rubricController.validateRubric(c));

/**
 * DELETE /rubrics/cache
 * Clear rubric cache
 */
rubricRoutes.delete('/cache', async (c) => await rubricController.clearCache(c));

export default rubricRoutes;