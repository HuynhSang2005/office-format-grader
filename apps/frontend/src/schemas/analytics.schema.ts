/**
 * @file analytics.schema.ts
 * @description Zod schemas for analytics dashboard data
 * @author Your Name
 * @link https://github.com/recharts/recharts
 * @link https://www.tremor.so/
 */

import { z } from 'zod'

/**
 * Schema for dashboard grade result
 */
export const DashboardGradeResultSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileType: z.string(),
  totalPoints: z.number(),
  gradedAt: z.string(), // ISO date string
})

/**
 * Schema for analytics dashboard statistics response
 */
export const AnalyticsStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalGraded: z.number(),
    totalUngraded: z.number(),
    totalCustomRubrics: z.number(),
    top5Highest: z.array(DashboardGradeResultSchema),
    top5Lowest: z.array(DashboardGradeResultSchema),
    topHighestPaginated: z.object({
      data: z.array(DashboardGradeResultSchema),
      pagination: z.object({
        currentPage: z.number(),
        totalPages: z.number(),
        totalCount: z.number(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean(),
      }),
    }),
    topLowestPaginated: z.object({
      data: z.array(DashboardGradeResultSchema),
      pagination: z.object({
        currentPage: z.number(),
        totalPages: z.number(),
        totalCount: z.number(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean(),
      }),
    }),
    ratioByScore: z.object({
      count: z.number(),
      percentage: z.number(),
    }),
    countByFileType: z.object({
      PPTX: z.number(),
      DOCX: z.number(),
    }),
    countByUploadDate: z.array(
      z.object({
        date: z.string(), // ISO date string
        count: z.number(),
      }),
    ),
  }),
})

/**
 * Schema for dashboard query parameters
 */
export const DashboardQuerySchema = z.object({
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type DashboardGradeResult = z.infer<typeof DashboardGradeResultSchema>
export type AnalyticsStatsResponse = z.infer<typeof AnalyticsStatsResponseSchema>
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>