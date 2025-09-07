/**
 * @file grade-api.schema.ts
 * @description Zod schemas cho grade API endpoints
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';
import { RubricSchema } from './rubric.schema';

// Schema cho grade request API endpoint
export const GradeFileApiSchema = z.object({
  fileId: z.string().min(1, 'File ID không được rỗng'),
  useHardRubric: z.boolean().default(true),
  onlyCriteria: z.array(z.string()).optional()
});

// Schema cho grade request với custom rubric API endpoint
export const CustomGradeApiSchema = z.object({
  rubricId: z.string().optional(),
  rubric: RubricSchema.optional(), // Custom rubric object
  onlyCriteria: z.array(z.string()).optional(),
  files: z.array(z.string()).min(1, 'Phải có ít nhất 1 file'),
  concurrency: z.number().min(1).max(20).default(5).optional() // Số lượng file xử lý đồng thời
});

// Schema cho grade history query API endpoint
export const GradeHistoryApiSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  fileType: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  scoreMin: z.coerce.number().min(0).max(10).optional(),
  scoreMax: z.coerce.number().min(0).max(10).optional()
}).refine((data) => {
  // Validate date range
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: 'dateFrom phải <= dateTo',
  path: ['dateFrom']
}).refine((data) => {
  // Validate score range
  if (data.scoreMin !== undefined && data.scoreMax !== undefined) {
    return data.scoreMin <= data.scoreMax;
  }
  return true;
}, {
  message: 'scoreMin phải <= scoreMax',
  path: ['scoreMin']
});

// Schema cho grade result response
export const GradeResultResponseSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  fileType: z.enum(['PPTX', 'DOCX']),
  totalPoints: z.number(),
  maxPossiblePoints: z.number(),
  percentage: z.number(),
  byCriteria: z.record(z.string(), z.any()),
  gradedAt: z.string().datetime(),
  processingTime: z.number()
});

// Schema cho grade file response
export const GradeFileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    gradeResult: GradeResultResponseSchema,
    database: z.object({
      saved: z.boolean(),
      dbId: z.string().optional()
    }),
    fileCleanup: z.object({
      originalFileDeleted: z.boolean(),
      reason: z.string()
    })
  })
});

// Schema cho batch grade response
export const BatchGradeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    batchResult: z.object({
      results: z.array(GradeResultResponseSchema),
      errors: z.array(z.object({
        fileId: z.string(),
        error: z.string()
      })),
      summary: z.object({
        total: z.number(),
        success: z.number(),
        failed: z.number()
      })
    }),
    database: z.object({
      saved: z.number(),
      total: z.number()
    }),
    fileCleanup: z.object({
      originalFilesDeleted: z.boolean(),
      reason: z.string()
    })
  })
});

// Schema cho grade history response
export const GradeHistoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    results: z.array(z.object({
      id: z.string(),
      filename: z.string(),
      fileType: z.enum(['PPTX', 'DOCX']),
      totalPoints: z.number(),
      gradedAt: z.string().datetime()
    })),
    total: z.number(),
    limit: z.number(),
    offset: z.number()
  })
});

// Schema cho single grade result response
export const SingleGradeResultResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: GradeResultResponseSchema
});

// Schema cho error response
export const GradeErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.array(z.object({
    path: z.array(z.string()),
    message: z.string()
  })).optional()
});

// Export types từ schemas
export type GradeFileApiRequest = z.infer<typeof GradeFileApiSchema>;
export type CustomGradeApiRequest = z.infer<typeof CustomGradeApiSchema>;
export type GradeHistoryApiQuery = z.infer<typeof GradeHistoryApiSchema>;
export type GradeResultResponse = z.infer<typeof GradeResultResponseSchema>;
export type GradeFileResponse = z.infer<typeof GradeFileResponseSchema>;
export type BatchGradeResponse = z.infer<typeof BatchGradeResponseSchema>;
export type GradeHistoryResponse = z.infer<typeof GradeHistoryResponseSchema>;
export type SingleGradeResultResponse = z.infer<typeof SingleGradeResultResponseSchema>;
export type GradeErrorResponse = z.infer<typeof GradeErrorResponseSchema>;




