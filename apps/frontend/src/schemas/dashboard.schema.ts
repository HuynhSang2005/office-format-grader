/**
 * @file dashboard.schema.ts
 * @description Zod schemas for dashboard data
 * @author Your Name
 */

import { z } from 'zod'

/**
 * Schema for dashboard statistics
 */
export const DashboardStatsSchema = z.object({
  success: z.boolean(),
  data: z.object({
    totalGraded: z.number().nonnegative(),
    totalUngraded: z.number().nonnegative(),
    totalCustomRubrics: z.number().nonnegative(),
    top5Highest: z.array(
      z.object({
        id: z.string(),
        filename: z.string(),
        fileType: z.string(),
        totalPoints: z.number(),
        gradedAt: z.string(), // ISO date string
      })
    ),
    top5Lowest: z.array(
      z.object({
        id: z.string(),
        filename: z.string(),
        fileType: z.string(),
        totalPoints: z.number(),
        gradedAt: z.string(), // ISO date string
      })
    ),
    topHighestPaginated: z.object({
      data: z.array(
        z.object({
          id: z.string(),
          filename: z.string(),
          fileType: z.string(),
          totalPoints: z.number(),
          gradedAt: z.string(), // ISO date string
        })
      ),
      pagination: z.object({
        currentPage: z.number(),
        totalPages: z.number(),
        totalCount: z.number(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean()
      })
    }),
    topLowestPaginated: z.object({
      data: z.array(
        z.object({
          id: z.string(),
          filename: z.string(),
          fileType: z.string(),
          totalPoints: z.number(),
          gradedAt: z.string(), // ISO date string
        })
      ),
      pagination: z.object({
        currentPage: z.number(),
        totalPages: z.number(),
        totalCount: z.number(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean()
      })
    }),
    ratioByScore: z.object({
      count: z.number().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
    countByFileType: z.object({
      PPTX: z.number().nonnegative(),
      DOCX: z.number().nonnegative(),
    }),
    countByUploadDate: z.array(
      z.object({
        date: z.string(), // ISO date string
        count: z.number().nonnegative(),
      })
    ),
  }),
})

/**
 * Schema for grade results
 */
export const GradeResultSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileType: z.enum(['docx', 'pptx']),
  score: z.number().min(0).max(10),
  gradedAt: z.string(), // ISO date string
  status: z.enum(['passed', 'failed', 'pending']),
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type DashboardStats = z.infer<typeof DashboardStatsSchema>
export type GradeResult = z.infer<typeof GradeResultSchema>