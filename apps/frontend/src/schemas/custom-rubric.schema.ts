/**
 * @file custom-rubric.schema.ts
 * @description Zod schemas for custom rubric functionality
 * @author Your Name
 * @reference https://github.com/colinhacks/zod
 */

import { z } from 'zod'

// Schema cho Level
export const LevelSchema = z.object({
  points: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string()
})

// Schema cho Criterion
export const CriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  detectorKey: z.string(),
  maxPoints: z.number().positive(),
  levels: z.array(LevelSchema).min(1)
})

// Schema cho Rubric
export const RubricSchema = z.object({
  title: z.string(),
  version: z.string(),
  locale: z.string(),
  totalPoints: z.number().positive(),
  scoring: z.object({
    method: z.enum(['sum']),
    rounding: z.enum(['half_up_0.25', 'none'])
  }),
  criteria: z.array(CriterionSchema).min(1)
})

// Schema cho create custom rubric request
export const CreateCustomRubricSchema = z.object({
  ownerId: z.number(),
  name: z.string().min(1, 'Tên rubric không được rỗng').max(100, 'Tên rubric quá dài'),
  content: RubricSchema,
  isPublic: z.boolean().optional()
})

// Schema cho update custom rubric request
export const UpdateCustomRubricSchema = z.object({
  name: z.string().min(1, 'Tên rubric không được rỗng').max(100, 'Tên rubric quá dài').optional(),
  content: RubricSchema.optional(),
  isPublic: z.boolean().optional()
})

// Schema cho list custom rubrics query
export const ListCustomRubricsQuerySchema = z.object({
  ownerId: z.number()
})

// Schema cho custom rubric response
export const CustomRubricResponseSchema = z.object({
  id: z.string(),
  ownerId: z.number(),
  name: z.string(),
  content: RubricSchema,
  total: z.number(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// Schema cho create custom rubric response
export const CreateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
})

// Schema cho update custom rubric response
export const UpdateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
})

// Schema cho delete custom rubric response
export const DeleteCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

// Schema cho get custom rubric response
export const GetCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
})

// Schema cho list custom rubrics response
export const ListCustomRubricsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CustomRubricResponseSchema)
})

// Schema cho validate custom rubric response
export const ValidateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  })
})

// Schema cho error response
export const CustomRubricErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.array(z.object({
    path: z.array(z.string()),
    message: z.string()
  })).optional()
})

// Schema cho custom grade API request
export const CustomGradeApiSchema = z.object({
  rubricId: z.string().optional(),
  rubric: RubricSchema.optional(),
  onlyCriteria: z.array(z.string()).optional(),
  files: z.array(z.string()).min(1, 'Phải có ít nhất 1 file'),
  concurrency: z.number().min(1).max(20).default(5).optional()
})

// Schema cho custom grade API response
export const CustomGradeApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    gradeResult: z.object({
      fileId: z.string(),
      filename: z.string(),
      fileType: z.enum(['PPTX', 'DOCX']),
      totalPoints: z.number(),
      maxPossiblePoints: z.number(),
      percentage: z.number(),
      byCriteria: z.record(z.string(), z.any()),
      gradedAt: z.string(),
      processingTime: z.number()
    })
  })
})

// Export types từ schemas
export type Level = z.infer<typeof LevelSchema>
export type Criterion = z.infer<typeof CriterionSchema>
export type Rubric = z.infer<typeof RubricSchema>
export type CreateCustomRubricRequest = z.infer<typeof CreateCustomRubricSchema>
export type UpdateCustomRubricRequest = z.infer<typeof UpdateCustomRubricSchema>
export type ListCustomRubricsQuery = z.infer<typeof ListCustomRubricsQuerySchema>
export type CustomRubricResponse = z.infer<typeof CustomRubricResponseSchema>
export type CreateCustomRubricResponse = z.infer<typeof CreateCustomRubricResponseSchema>
export type UpdateCustomRubricResponse = z.infer<typeof UpdateCustomRubricResponseSchema>
export type DeleteCustomRubricResponse = z.infer<typeof DeleteCustomRubricResponseSchema>
export type GetCustomRubricResponse = z.infer<typeof GetCustomRubricResponseSchema>
export type ListCustomRubricsResponse = z.infer<typeof ListCustomRubricsResponseSchema>
export type ValidateCustomRubricResponse = z.infer<typeof ValidateCustomRubricResponseSchema>
export type CustomRubricErrorResponse = z.infer<typeof CustomRubricErrorResponseSchema>
export type CustomGradeApiRequest = z.infer<typeof CustomGradeApiSchema>
export type CustomGradeApiResponse = z.infer<typeof CustomGradeApiResponseSchema>