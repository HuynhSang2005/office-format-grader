/**
 * @file criteria.schema.ts
 * @description Zod schemas để validate các request liên quan đến criteria management
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';
import { RubricSchema, FileTypeSchema, DetectorKeySchema, LevelSchema } from './rubric.schema';

// Schema cho CriteriaListQuery
export const CriteriaListQuerySchema = z.object({
  source: z.enum(['preset', 'custom'], {
    errorMap: () => ({ message: 'Source phải là "preset" hoặc "custom"' })
  }),
  fileType: FileTypeSchema.optional(),
  rubricName: z.string().optional()
}).refine((data) => {
  // Nếu source = 'preset' thì bắt buộc phải có rubricName
  if (data.source === 'preset') {
    return data.rubricName && data.rubricName.length > 0;
  }
  return true;
}, {
  message: 'rubricName là bắt buộc khi source = "preset"',
  path: ['rubricName']
});

// Schema cho CriteriaPreviewBody
export const CriteriaPreviewBodySchema = z.object({
  fileId: z.string().optional(),              // File ID để preview (optional)
  features: z.any().optional(),               // Features đã extract (optional)
  rubric: RubricSchema,                       // Rubric để preview
  onlyCriteria: z.array(z.string()).optional() // Chỉ preview những criteria này (optional)
}).refine((data) => {
  // Nếu có onlyCriteria, kiểm tra criteria IDs có tồn tại trong rubric
  if (data.onlyCriteria) {
    const rubricCriteriaIds = data.rubric.criteria.map(c => c.id);
    return data.onlyCriteria.every(id => rubricCriteriaIds.includes(id));
  }
  return true;
}, {
  message: 'onlyCriteria chứa ID không tồn tại trong rubric',
  path: ['onlyCriteria']
}).refine((data) => {
  // Phải có ít nhất fileId hoặc features
  return data.fileId || data.features;
}, {
  message: 'Phải cung cấp fileId hoặc features để preview',
  path: ['fileId']
});

// Schema cho CriteriaValidateBody
export const CriteriaValidateBodySchema = z.object({
  rubric: RubricSchema
});

// Schema cho SupportedCriteria
export const SupportedCriteriaSchema = z.object({
  detectorKey: DetectorKeySchema,
  name: z.string().min(1, 'Name không được rỗng'),
  description: z.string().min(1, 'Description không được rỗng'),
  fileTypes: z.array(FileTypeSchema).min(1, 'Phải hỗ trợ ít nhất 1 file type'),
  defaultMaxPoints: z.number().min(0, 'Default max points phải >= 0'),
  suggestedLevels: z.array(LevelSchema).min(1, 'Phải có ít nhất 1 suggested level')
});

// Schema cho query supported criteria
export const SupportedCriteriaQuerySchema = z.object({
  fileType: FileTypeSchema.optional(),        // Lọc theo file type (optional)
  detectorKey: DetectorKeySchema.optional()   // Lấy thông tin của 1 detector cụ thể (optional)
});

// Schema cho custom criterion creation
export const CreateCriterionSchema = z.object({
  name: z.string().min(1, 'Name không được rỗng').max(100, 'Name không được quá 100 ký tự'),
  description: z.string().min(1, 'Description không được rỗng').max(500, 'Description không được quá 500 ký tự'),
  detectorKey: DetectorKeySchema,
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
});

// Schema cho custom rubric creation
export const CreateRubricSchema = z.object({
  name: z.string().min(1, 'Name không được rỗng').max(100, 'Name không được quá 100 ký tự'),
  description: z.string().max(500, 'Description không được quá 500 ký tự').optional(),
  fileType: FileTypeSchema,
  rounding: z.enum(['half_up_0.25', 'none']).default('half_up_0.25'),
  criteria: z.array(CreateCriterionSchema).min(1, 'Phải có ít nhất 1 criterion').max(20, 'Không được quá 20 criteria')
}).refine((data) => {
  // Kiểm tra criterion names là duy nhất
  const names = data.criteria.map(c => c.name);
  return new Set(names).size === names.length;
}, {
  message: 'Criterion names phải là duy nhất'
}).refine((data) => {
  // Tính totalMaxPoints tự động
  const totalMaxPoints = data.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  return totalMaxPoints <= 20; // Giới hạn tổng điểm
}, {
  message: 'Tổng maxPoints của criteria không được vượt quá 20'
});

// Schema cho preset rubric query
export const PresetRubricQuerySchema = z.object({
  fileType: FileTypeSchema.optional(),
  name: z.string().optional()
});

// Schema cho rubric comparison
export const RubricComparisonSchema = z.object({
  rubric1: RubricSchema,
  rubric2: RubricSchema
});

// Export types từ schemas
export type CriteriaListQuery = z.infer<typeof CriteriaListQuerySchema>;
export type CriteriaPreviewBody = z.infer<typeof CriteriaPreviewBodySchema>;
export type CriteriaValidateBody = z.infer<typeof CriteriaValidateBodySchema>;
export type SupportedCriteria = z.infer<typeof SupportedCriteriaSchema>;
export type SupportedCriteriaQuery = z.infer<typeof SupportedCriteriaQuerySchema>;
export type CreateCriterion = z.infer<typeof CreateCriterionSchema>;
export type CreateRubric = z.infer<typeof CreateRubricSchema>;
export type PresetRubricQuery = z.infer<typeof PresetRubricQuerySchema>;
export type RubricComparison = z.infer<typeof RubricComparisonSchema>;