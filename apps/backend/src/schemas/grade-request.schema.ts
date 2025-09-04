/**
 * @file grade-request.schema.ts
 * @description Zod schemas để validate các request liên quan đến grading
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';
import { RubricSchema } from './rubric.schema';

// Schema cho GradeRequest
export const GradeRequestSchema = z.object({
  rubric: RubricSchema.optional(),                    // Rubric tùy chỉnh (optional)
  onlyCriteria: z.array(z.string()).optional(),      // Chỉ chấm những criteria này (optional)
  files: z.array(z.string().min(1, 'File ID không được rỗng'))
    .min(1, 'Phải có ít nhất 1 file')
    .max(60, 'Không được vượt quá 60 files')         // Giới hạn batch size
}).refine((data) => {
  // Nếu có onlyCriteria và rubric, kiểm tra criteria IDs có tồn tại trong rubric
  if (data.onlyCriteria && data.rubric) {
    const rubricCriteriaIds = data.rubric.criteria.map(c => c.id);
    return data.onlyCriteria.every(id => rubricCriteriaIds.includes(id));
  }
  return true;
}, {
  message: 'onlyCriteria chứa ID không tồn tại trong rubric',
  path: ['onlyCriteria']
});

// Schema cho single file grade request (tiện ích)
export const SingleFileGradeRequestSchema = z.object({
  fileId: z.string().min(1, 'File ID không được rỗng'),
  rubric: RubricSchema.optional(),
  onlyCriteria: z.array(z.string()).optional()
});

// Schema cho batch status query
export const BatchStatusQuerySchema = z.object({
  batchId: z.string().min(1, 'Batch ID không được rỗng')
});

// Schema cho grade history query
export const GradeHistoryQuerySchema = z.object({
  userId: z.number().optional(),              // Lọc theo user (optional) - Changed from string to number
  fileType: z.enum(['PPTX', 'DOCX']).optional(), // Lọc theo loại file (optional)
  rubricName: z.string().optional(),          // Lọc theo rubric (optional)
  fromDate: z.string().datetime().optional(), // Từ ngày (ISO string)
  toDate: z.string().datetime().optional(),   // Đến ngày (ISO string)
  limit: z.number().min(1).max(100).default(20), // Giới hạn kết quả
  offset: z.number().min(0).default(0)        // Offset cho pagination
}).refine((data) => {
  // Kiểm tra fromDate <= toDate
  if (data.fromDate && data.toDate) {
    return new Date(data.fromDate) <= new Date(data.toDate);
  }
  return true;
}, {
  message: 'fromDate phải <= toDate',
  path: ['fromDate']
});

// Schema cho regrade request
export const RegradeRequestSchema = z.object({
  resultIds: z.array(z.string().min(1, 'Result ID không được rỗng'))
    .min(1, 'Phải có ít nhất 1 result ID')
    .max(60, 'Không được vượt quá 60 results'),
  newRubric: RubricSchema.optional(),         // Rubric mới (optional, dùng cũ nếu không có)
  onlyCriteria: z.array(z.string()).optional() // Chỉ chấm lại những criteria này
});

// Schema cho compare results request
export const CompareResultsRequestSchema = z.object({
  resultIds: z.array(z.string().min(1, 'Result ID không được rỗng'))
    .min(2, 'Phải có ít nhất 2 results để so sánh')
    .max(10, 'Không được so sánh quá 10 results cùng lúc')
});

// Schema cho export Excel request
export const ExportExcelRequestSchema = z.object({
  resultIds: z.array(z.string().min(1, 'Result ID không được rỗng'))
    .min(1, 'Phải có ít nhất 1 result')
    .max(1000, 'Không được export quá 1000 results'),
  includeDetails: z.boolean().default(true),   // Có include chi tiết từng criterion không
  groupBy: z.enum(['user', 'fileType', 'rubric', 'date', 'none']).default('none'),
  format: z.enum(['xlsx']).default('xlsx')    // Chỉ hỗ trợ xlsx format
});

// Export types từ schemas
export type GradeRequest = z.infer<typeof GradeRequestSchema>;
export type SingleFileGradeRequest = z.infer<typeof SingleFileGradeRequestSchema>;
export type BatchStatusQuery = z.infer<typeof BatchStatusQuerySchema>;
export type GradeHistoryQuery = z.infer<typeof GradeHistoryQuerySchema>;
export type RegradeRequest = z.infer<typeof RegradeRequestSchema>;
export type CompareResultsRequest = z.infer<typeof CompareResultsRequestSchema>;
export type ExportExcelRequest = z.infer<typeof ExportExcelRequestSchema>;