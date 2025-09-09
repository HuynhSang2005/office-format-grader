/**
 * @file criteria.schema.ts
 * @description Zod schemas for criteria data
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod'

/**
 * Schema for a criterion level
 */
export const LevelSchema = z.object({
  points: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string()
})

/**
 * Schema for creating a criterion with strict validation rules
 */
export const CreateCriterionSchema = z.object({
  name: z.string().min(1, 'Name không được rỗng').max(100, 'Name không được quá 100 ký tự'),
  description: z.string().min(1, 'Description không được rỗng').max(500, 'Description không được quá 500 ký tự'),
  detectorKey: z.string(), // Will be validated against DetectorKeySchema on backend
  maxPoints: z.number().min(0.25, 'Max points phải >= 0.25').max(10, 'Max points không được > 10'),
  levels: z.array(LevelSchema).min(2, 'Phải có ít nhất 2 levels').max(10, 'Không được quá 10 levels')
}).refine((data) => {
  // Kiểm tra points của levels không vượt quá maxPoints
  const maxLevelPoints = Math.max(...data.levels.map(l => l.points));
  return maxLevelPoints <= data.maxPoints;
}, {
  message: 'Points của level không được vượt quá maxPoints'
}).refine((data) => {
  // Kiểm tra có level với points = 0 (fail case)
  return data.levels.some(l => l.points === 0);
}, {
  message: 'Phải có ít nhất 1 level với points = 0 (trường hợp không đạt)'
}).refine((data) => {
  // Kiểm tra level codes là duy nhất
  const codes = data.levels.map(l => l.code);
  return new Set(codes).size === codes.length;
}, {
  message: 'Level codes phải là duy nhất'
})

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
export type Level = z.infer<typeof LevelSchema>
export type CreateCriterion = z.infer<typeof CreateCriterionSchema>
export type Criterion = z.infer<typeof CriterionSchema>
export type PreviewCriteriaResponse = z.infer<typeof PreviewCriteriaResponseSchema>