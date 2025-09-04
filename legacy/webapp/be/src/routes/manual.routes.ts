import { Hono } from 'hono';
import { ManualController } from '../controllers/manual.controller';
import { validateSchema } from '../middlewares/validation.middleware';
import { FileUploadSchema, CriterionParamSchema } from '../schemas/common.schema';

/**
 * Manual Grading Routes
 * Handles manual rule-based grading endpoints following REST conventions
 */
const manualRoutes = new Hono();

// Initialize controller
const manualController = new ManualController();

/**
 * POST /manual/grade/powerpoint
 * Grade PowerPoint document using manual rubric criteria
 */
manualRoutes.post(
  '/grade/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.gradePowerPoint(c)
);

/**
 * POST /manual/grade/word
 * Grade Word document using manual rubric criteria
 */
manualRoutes.post(
  '/grade/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.gradeWord(c)
);

/**
 * POST /manual/check/powerpoint/:criterionId
 * Check specific criterion for PowerPoint document
 */
manualRoutes.post(
  '/check/powerpoint/:criterionId',
  validateSchema(CriterionParamSchema, 'param'),
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.checkPowerPointCriterion(c)
);

/**
 * POST /manual/check/word/:criterionId
 * Check specific criterion for Word document
 */
manualRoutes.post(
  '/check/word/:criterionId',
  validateSchema(CriterionParamSchema, 'param'),
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.checkWordCriterion(c)
);

/**
 * POST /manual/analyze/powerpoint
 * Analyze PowerPoint document without grading
 */
manualRoutes.post(
  '/analyze/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.analyzePowerPoint(c)
);

/**
 * POST /manual/analyze/word
 * Analyze Word document without grading
 */
manualRoutes.post(
  '/analyze/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await manualController.analyzeWord(c)
);

export default manualRoutes;