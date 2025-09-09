/**
 * @file export.schema.ts
 * @description Zod schemas for export functionality
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod'

/**
 * Schema for export request
 */
export const ExportRequestSchema = z.object({
  resultIds: z.array(z.string().min(1, 'Result ID không được rỗng'))
    .min(1, 'Phải có ít nhất 1 result')
    .max(60, 'Không được export quá 60 results'),
  includeDetails: z.boolean().default(true),
  groupBy: z.enum(['user', 'fileType', 'rubric', 'date', 'none']).default('none'),
  format: z.enum(['xlsx']).default('xlsx')
})

/**
 * Schema for export response
 */
export const ExportSuccessResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  resultCount: z.number()
})

/**
 * Schema for export error response
 */
export const ExportErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string()
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type ExportRequest = z.infer<typeof ExportRequestSchema>
export type ExportSuccessResponse = z.infer<typeof ExportSuccessResponseSchema>
export type ExportErrorResponse = z.infer<typeof ExportErrorResponseSchema>