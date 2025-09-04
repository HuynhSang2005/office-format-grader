/**
 * @file dashboard.controller.ts
 * @description Controller xử lý dashboard statistics
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { 
  totalGraded, 
  totalUngraded, 
  totalCustomRubrics, 
  top5Highest, 
  top5Lowest, 
  ratioByScore, 
  countByFileType, 
  countByUploadDate,
  topHighestWithPagination,
  topLowestWithPagination
} from '@services/dashboard.service';
import type { DashboardStats } from '@/types/dashboard.types';

/**
 * GET /api/dashboard - Lấy thống kê dashboard
 * Query parameters:
 * - gradedDays: 1-14 (mặc định: 14)
 * - ungradedHours: 1-72 (mặc định: 24)
 * - minScore: 5-10 (mặc định: 5)
 * - maxScore: 5-10 (mặc định: 10)
 * - uploadDays: 1-14 (mặc định: 14)
 * - topDays: 1-14 (mặc định: 14)
 * - page: 1+ (mặc định: 1) - cho phân trang
 * - limit: 1-50 (mặc định: 10) - cho phân trang
 */
export async function getDashboardStatsController(c: Context) {
  try {
    // Parse query parameters with defaults
    const gradedDays = Math.min(Math.max(parseInt(c.req.query('gradedDays') || '14'), 1), 14);
    const ungradedHours = Math.min(Math.max(parseInt(c.req.query('ungradedHours') || '24'), 1), 72);
    const minScore = Math.min(Math.max(parseFloat(c.req.query('minScore') || '5'), 5), 10);
    const maxScore = Math.min(Math.max(parseFloat(c.req.query('maxScore') || '10'), 5), 10);
    const uploadDays = Math.min(Math.max(parseInt(c.req.query('uploadDays') || '14'), 1), 14);
    const topDays = Math.min(Math.max(parseInt(c.req.query('topDays') || '14'), 1), 14);
    
    // Parse pagination parameters
    const page = Math.max(parseInt(c.req.query('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '10'), 1), 50);
    const offset = (page - 1) * limit;
    
    // Ensure minScore <= maxScore
    const min = Math.min(minScore, maxScore);
    const max = Math.max(minScore, maxScore);
    
    logger.info('[DASHBOARD] Lấy thống kê dashboard với params:', {
      gradedDays,
      ungradedHours,
      minScore: min,
      maxScore: max,
      uploadDays,
      topDays,
      page,
      limit
    });
    
    // Fetch all dashboard statistics in parallel
    const [
      totalGradedCount,
      totalUngradedCount,
      totalCustomRubricsCount,
      top5HighestResults,
      top5LowestResults,
      ratioByScoreResult,
      countByFileTypeResult,
      countByUploadDateResult,
      topHighestPaginated,
      topLowestPaginated
    ] = await Promise.all([
      totalGraded(gradedDays),
      totalUngraded(ungradedHours),
      totalCustomRubrics(),
      top5Highest(topDays),
      top5Lowest(topDays),
      ratioByScore(min, max),
      countByFileType(),
      countByUploadDate(uploadDays),
      topHighestWithPagination(topDays, limit, offset),
      topLowestWithPagination(topDays, limit, offset)
    ]);
    
    // Return the dashboard statistics
    return c.json({
      success: true,
      data: {
        totalGraded: totalGradedCount,
        totalUngraded: totalUngradedCount,
        totalCustomRubrics: totalCustomRubricsCount,
        top5Highest: top5HighestResults,
        top5Lowest: top5LowestResults,
        topHighestPaginated: {
          data: topHighestPaginated.results,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(topHighestPaginated.totalCount / limit),
            totalCount: topHighestPaginated.totalCount,
            hasNextPage: page * limit < topHighestPaginated.totalCount,
            hasPreviousPage: page > 1
          }
        },
        topLowestPaginated: {
          data: topLowestPaginated.results,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(topLowestPaginated.totalCount / limit),
            totalCount: topLowestPaginated.totalCount,
            hasNextPage: page * limit < topLowestPaginated.totalCount,
            hasPreviousPage: page > 1
          }
        },
        ratioByScore: ratioByScoreResult,
        countByFileType: countByFileTypeResult,
        countByUploadDate: countByUploadDateResult
      } satisfies DashboardStats
    });
    
  } catch (error) {
    logger.error('[DASHBOARD] Lỗi khi lấy thống kê dashboard:', error);
    return c.json({
      success: false,
      message: 'Không thể lấy thống kê dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}