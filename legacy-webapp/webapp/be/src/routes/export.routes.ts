import { Hono } from 'hono';
import { ExportController } from '../controllers/export.controller';
import { validateSchema } from '../middlewares/validation.middleware';
import { ExportRequestSchema } from '../schemas/common.schema';

/**
 * Export Routes
 * Handles data export and report generation endpoints following REST conventions
 */
const exportRoutes = new Hono();

// Initialize controller
const exportController = new ExportController();

/**
 * POST /exports/excel/manual-grading
 * Export manual grading results to Excel
 */
exportRoutes.post(
  '/excel/manual-grading',
  validateSchema(ExportRequestSchema, 'json'),
  async (c) => await exportController.exportManualGradingToExcel(c)
);

/**
 * POST /exports/excel/ai-grading
 * Export AI grading results to Excel
 */
exportRoutes.post(
  '/excel/ai-grading',
  validateSchema(ExportRequestSchema, 'json'),
  async (c) => await exportController.exportAIGradingToExcel(c)
);

/**
 * POST /exports/excel/detailed-report
 * Generate detailed Excel report with multiple sheets
 */
exportRoutes.post(
  '/excel/detailed-report',
  validateSchema(ExportRequestSchema, 'json'),
  async (c) => await exportController.generateDetailedExcelReport(c)
);

/**
 * POST /exports/csv/grading-summary
 * Export grading summary to CSV
 */
exportRoutes.post(
  '/csv/grading-summary',
  validateSchema(ExportRequestSchema, 'json'),
  async (c) => await exportController.exportGradingSummaryToCSV(c)
);

/**
 * GET /exports/templates/excel
 * Download Excel template for bulk operations
 */
exportRoutes.get('/templates/excel', async (c) => await exportController.downloadExcelTemplate(c));

/**
 * GET /exports/formats
 * Get supported export formats
 */
exportRoutes.get('/formats', async (c) => await exportController.getSupportedFormats(c));

export default exportRoutes;