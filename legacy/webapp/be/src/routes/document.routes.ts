import { Hono } from 'hono';
import { DocumentAnalyzerController } from '../controllers/document.controller';
import { validateSchema } from '../middlewares/validation.middleware';
import { FileUploadSchema } from '../schemas/common.schema';

/**
 * Document Routes
 * Handles document parsing and analysis endpoints following REST conventions
 */
const documentRoutes = new Hono();

// Initialize controller
const documentController = new DocumentAnalyzerController();

/**
 * POST /documents/parse/powerpoint
 * Parse PowerPoint document and extract structured data
 */
documentRoutes.post(
  '/parse/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.analyzeDocument(c)
);

/**
 * POST /documents/parse/word
 * Parse Word document and extract structured data
 */
documentRoutes.post(
  '/parse/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.analyzeDocument(c)
);

/**
 * POST /documents/validate/powerpoint
 * Validate PowerPoint document format
 */
documentRoutes.post(
  '/validate/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.validateDocument(c)
);

/**
 * POST /documents/validate/word
 * Validate Word document format
 */
documentRoutes.post(
  '/validate/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.validateDocument(c)
);

/**
 * POST /documents/metadata/powerpoint
 * Extract metadata from PowerPoint document
 */
documentRoutes.post(
  '/metadata/powerpoint',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.getDocumentMetadata(c)
);

/**
 * POST /documents/metadata/word
 * Extract metadata from Word document
 */
documentRoutes.post(
  '/metadata/word',
  validateSchema(FileUploadSchema, 'form'),
  async (c) => await documentController.getDocumentMetadata(c)
);

export default documentRoutes;