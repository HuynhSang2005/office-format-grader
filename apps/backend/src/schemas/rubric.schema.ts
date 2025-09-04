/**
 * @file rubric.schema.ts
 * @description Zod schemas để validate rubric và các thành phần liên quan
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';

// Schema cho DetectorKey
export const DetectorKeySchema = z.enum([
  // DOCX detectors
  'docx.toc',
  'docx.headerFooter', 
  'docx.layoutArt',
  'docx.table',
  'docx.equation',
  'docx.tabs',
  'docx.smartArt',
  'docx.hyperlinks',
  // PPTX detectors
  'pptx.save',
  'pptx.slidesFromOutline',
  'pptx.theme',
  'pptx.slideMaster',
  'pptx.headerFooter',
  'pptx.hyperlinks',
  'pptx.transitions',
  'pptx.animations',
  'pptx.objects',
  'pptx.artistic',
  'pptx.exportPdf',
  // Common detectors
  'common.filenameConvention',
  'common.exportPdf'
]);

// Schema cho FileType
export const FileTypeSchema = z.enum(['PPTX', 'DOCX']);

// Schema cho Level - theo yêu cầu mới
export const LevelSchema = z.object({
  points: z.number(),
  code: z.string(),
  name: z.string(), // Adding the missing name property
  description: z.string()
});

// Schema cho Criterion - theo yêu cầu mới 
export const CriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  detectorKey: z.string(), // DetectorKey sẽ refine sau
  maxPoints: z.number().positive(),
  levels: z.array(LevelSchema).min(1)
});

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
});

// Schema cho RoundingMethod (giữ lại cho tương thích)
export const RoundingMethodSchema = z.enum(['half_up_0.25', 'none']);

// Schema cho CriterionEvalResult
export const CriterionEvalResultSchema = z.object({
  passed: z.boolean(),
  points: z.number().min(0, 'Points phải >= 0'),
  level: z.string().min(1, 'Level không được rỗng'),
  reason: z.string().min(1, 'Reason không được rỗng'),
  details: z.any().optional()
});

// Schema cho GradeResult
export const GradeResultSchema = z.object({
  fileId: z.string().min(1, 'File ID không được rỗng'),
  filename: z.string().min(1, 'Filename không được rỗng'),
  fileType: FileTypeSchema,
  rubricName: z.string().min(1, 'Rubric name không được rỗng'),
  totalPoints: z.number().min(0, 'Total points phải >= 0'),
  maxPossiblePoints: z.number().min(0, 'Max possible points phải >= 0'),
  percentage: z.number().min(0).max(100, 'Percentage phải trong khoảng 0-100'),
  byCriteria: z.record(z.string(), CriterionEvalResultSchema),
  gradedAt: z.date(),
  processingTime: z.number().min(0, 'Processing time phải >= 0')
});

// Schema cho ValidationResult
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

// Export types từ schemas
export type DetectorKey = z.infer<typeof DetectorKeySchema>;
export type FileType = z.infer<typeof FileTypeSchema>;
export type RoundingMethod = z.infer<typeof RoundingMethodSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type Rubric = z.infer<typeof RubricSchema>;
export type CriterionEvalResult = z.infer<typeof CriterionEvalResultSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;