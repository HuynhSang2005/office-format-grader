/**
 * @file upload.schema.ts
 * @description Zod schemas for upload functionality with custom rubric support
 * @author Your Name
 * @reference https://github.com/colinhacks/zod
 */

import { z } from 'zod'

/**
 * Schema for grade result in upload response
 */
export const GradeResultSchema = z.object({
  totalPoints: z.number(),
  percentage: z.number(),
  processingTime: z.number(),
  dbId: z.string().optional() // Add database ID
})

/**
 * Schema for upload response
 */
export const UploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    fileId: z.string(),
    originalName: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.enum(['PPTX', 'DOCX']).optional(),
    uploadedAt: z.string(), // ISO string date
    gradeResult: GradeResultSchema.optional()
  })
})

/**
 * Schema for upload error response
 */
export const UploadErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.array(z.string()).optional()
})

/**
 * Schema for file not found error response
 */
export const UploadFileNotFoundResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type UploadResponse = z.infer<typeof UploadResponseSchema>
export type UploadErrorResponse = z.infer<typeof UploadErrorResponseSchema>
export type UploadFileNotFoundResponse = z.infer<typeof UploadFileNotFoundResponseSchema>
export type GradeResult = z.infer<typeof GradeResultSchema>