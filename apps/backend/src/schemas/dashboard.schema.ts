/**
 * @file dashboard.schema.ts
 * @description Zod schemas cho dashboard API endpoints
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';

// Schema cho dashboard query parameters
export const DashboardQuerySchema = z.object({
  gradedDays: z.coerce.number().min(1).max(14).default(14),
  ungradedHours: z.coerce.number().min(1).max(72).default(24),
  minScore: z.coerce.number().min(5).max(10).default(5),
  maxScore: z.coerce.number().min(5).max(10).default(10),
  uploadDays: z.coerce.number().min(1).max(14).default(14),
  topDays: z.coerce.number().min(1).max(14).default(14),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
}).refine((data) => {
  // Ensure minScore <= maxScore
  return data.minScore <= data.maxScore;
}, {
  message: 'minScore phải nhỏ hơn hoặc bằng maxScore',
  path: ['minScore']
});

// Schema cho GradeResult trong dashboard
export const DashboardGradeResultSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileType: z.string(),
  totalPoints: z.number(),
  gradedAt: z.string().datetime()
});

// Schema cho thông tin phân trang
export const PaginationInfoSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalCount: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
});

// Schema cho thống kê dashboard response
export const DashboardStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalGraded: z.number(),
    totalUngraded: z.number(),
    totalCustomRubrics: z.number(),
    top5Highest: z.array(DashboardGradeResultSchema),
    top5Lowest: z.array(DashboardGradeResultSchema),
    topHighestPaginated: z.object({
      data: z.array(DashboardGradeResultSchema),
      pagination: PaginationInfoSchema
    }),
    topLowestPaginated: z.object({
      data: z.array(DashboardGradeResultSchema),
      pagination: PaginationInfoSchema
    }),
    ratioByScore: z.object({
      count: z.number(),
      percentage: z.number()
    }),
    countByFileType: z.object({
      PPTX: z.number(),
      DOCX: z.number()
    }),
    countByUploadDate: z.array(z.object({
      date: z.string(),
      count: z.number()
    }))
  })
});

// Schema cho error response
export const DashboardErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional()
});

// Export types từ schemas
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
export type DashboardGradeResult = z.infer<typeof DashboardGradeResultSchema>;
export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type DashboardErrorResponse = z.infer<typeof DashboardErrorResponseSchema>;