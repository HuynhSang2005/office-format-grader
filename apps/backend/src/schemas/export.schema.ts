/**
 * @file export.schema.ts
 * @description Zod schemas cho export API endpoints
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';
import { ExportExcelRequestSchema } from './grade-request.schema';

// Schema cho export request (reuse from grade-request.schema.ts)
export const ExportRequestSchema = ExportExcelRequestSchema;

// Schema cho export success response
export const ExportSuccessResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  resultCount: z.number()
});

// Schema cho export error response
export const ExportErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string()
});

// Export types từ schemas
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type ExportSuccessResponse = z.infer<typeof ExportSuccessResponseSchema>;
export type ExportErrorResponse = z.infer<typeof ExportErrorResponseSchema>;