/**
 * @file ungraded.schema.ts
 * @description Zod schemas for ungraded files functionality
 * @author Your Name
 */

import { z } from 'zod'

/**
 * Schema for ungraded file
 */
export const UngradedFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(), // ISO string date
  userId: z.number()
})

/**
 * Schema for get ungraded files response
 */
export const UngradedFilesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    files: z.array(UngradedFileSchema)
  })
})

/**
 * Schema for delete ungraded file response
 */
export const UngradedFileDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    deletedFile: UngradedFileSchema
  })
})

/**
 * Schema for ungraded file error response
 */
export const UngradedFileErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type UngradedFile = z.infer<typeof UngradedFileSchema>
export type UngradedFilesResponse = z.infer<typeof UngradedFilesResponseSchema>
export type UngradedFileDeleteResponse = z.infer<typeof UngradedFileDeleteResponseSchema>
export type UngradedFileErrorResponse = z.infer<typeof UngradedFileErrorResponseSchema>