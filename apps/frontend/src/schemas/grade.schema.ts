/**
 * @file grade.schema.ts
 * @description Zod schemas for grade result data
 * @author Your Name
 * @reference https://github.com/colinhacks/zod
 */

import { z } from 'zod'

/**
 * Schema for criterion evaluation result
 */
export const CriterionEvalResultSchema = z.object({
  passed: z.boolean(),
  points: z.number().min(0, 'Points phải >= 0'),
  level: z.string().min(1, 'Level không được rỗng'),
  reason: z.string().min(1, 'Reason không được rỗng'),
  details: z.any().optional()
})

/**
 * Schema for grade result
 */
export const GradeResultSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  fileType: z.enum(['PPTX', 'DOCX']),
  rubricName: z.string(), // Add rubricName field
  totalPoints: z.number(),
  maxPossiblePoints: z.number(),
  percentage: z.number(),
  byCriteria: z.record(z.string(), CriterionEvalResultSchema),
  gradedAt: z.string().datetime(),
  processingTime: z.number()
})

/**
 * Schema for grade history item
 */
export const GradeHistoryItemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileType: z.enum(['PPTX', 'DOCX']),
  totalPoints: z.number(),
  gradedAt: z.string()
})

/**
 * Schema for grade history response
 */
export const GradeHistoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    results: z.array(GradeHistoryItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number()
  })
})

/**
 * Schema for grade history query parameters
 */
export const GradeHistoryQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  fileType: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  scoreMin: z.number().optional(),
  scoreMax: z.number().optional()
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type CriterionEvalResult = z.infer<typeof CriterionEvalResultSchema>
export type GradeResult = z.infer<typeof GradeResultSchema>
export type GradeHistoryItem = z.infer<typeof GradeHistoryItemSchema>
export type GradeHistoryResponse = z.infer<typeof GradeHistoryResponseSchema>
export type GradeHistoryQuery = z.infer<typeof GradeHistoryQuerySchema>