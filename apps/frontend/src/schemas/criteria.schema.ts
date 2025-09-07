/**
 * @file criteria.schema.ts
 * @description Zod schemas for criteria data
 * @author Your Name
 */

import { z } from 'zod'

/**
 * Schema for a criterion
 */
export const CriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  detectorKey: z.string(),
  description: z.string().optional(),
  maxPoints: z.number().optional(),
  levels: z.array(z.object({
    points: z.number(),
    code: z.string(),
    name: z.string(),
    description: z.string()
  })).optional()
})

/**
 * Schema for preview criteria response
 */
export const PreviewCriteriaResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    results: z.record(z.string(), z.object({
      passed: z.boolean(),
      points: z.number(),
      level: z.string(),
      reason: z.string()
    })),
    statistics: z.object({
      totalCriteria: z.number(),
      passedCriteria: z.number(),
      failedCriteria: z.number(),
      totalPoints: z.number(),
      maxPossiblePoints: z.number(),
      percentage: z.string()
    }),
    rubric: z.object({
      name: z.string(),
      fileType: z.enum(['PPTX', 'DOCX'])
    })
  })
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type Criterion = z.infer<typeof CriterionSchema>
export type PreviewCriteriaResponse = z.infer<typeof PreviewCriteriaResponseSchema>