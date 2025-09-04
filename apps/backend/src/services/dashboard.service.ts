/**
 * @file dashboard.service.ts
 * @description Dịch vụ cung cấp dữ liệu thống kê dashboard
 * @author Nguyễn Huỳnh Sang
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import type { DashboardStats, GradeResult } from '@/types/dashboard.types';

const prisma = new PrismaClient();

/**
 * Đếm tổng số bài đã chấm trong khoảng thời gian
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @returns Số lượng bài đã chấm
 */
export async function totalGraded(days: number = 14): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const count = await prisma.gradeResult.count({
    where: {
      gradedAt: {
        gte: startDate
      }
    }
  });
  
  logger.debug(`[DASHBOARD] Tổng số bài đã chấm (${days} ngày): ${count}`);
  return count;
}

/**
 * Đếm tổng số bài chưa chấm trong khoảng thời gian
 * @param hours Số giờ tính từ hiện tại (mặc định: 24)
 * @returns Số lượng bài chưa chấm
 */
export async function totalUngraded(hours: number = 24): Promise<number> {
  // Trong thực tế, cần có bảng lưu trữ file chưa chấm
  // Ở đây giả định là 0 vì chưa có hệ thống queue
  logger.debug(`[DASHBOARD] Tổng số bài chưa chấm (${hours} giờ): 0`);
  return 0;
}

/**
 * Đếm tổng số rubric tùy chỉnh
 * @returns Số lượng rubric tùy chỉnh
 */
export async function totalCustomRubrics(): Promise<number> {
  const count = await prisma.customRubric.count();
  logger.debug(`[DASHBOARD] Tổng số custom rubrics: ${count}`);
  return count;
}

/**
 * Lấy 5 bài có điểm cao nhất trong khoảng thời gian
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @returns Danh sách 5 bài điểm cao nhất
 */
export async function top5Highest(days: number = 14): Promise<GradeResult[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await prisma.gradeResult.findMany({
    where: {
      gradedAt: {
        gte: startDate
      }
    },
    orderBy: {
      totalPoints: 'desc'
    },
    take: 5,
    select: {
      id: true,
      filename: true,
      fileType: true,
      totalPoints: true,
      gradedAt: true
    }
  });
  
  logger.debug(`[DASHBOARD] Top 5 bài điểm cao nhất (${days} ngày): ${results.length} items`);
  return results;
}

/**
 * Lấy 5 bài có điểm thấp nhất trong khoảng thời gian
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @returns Danh sách 5 bài điểm thấp nhất
 */
export async function top5Lowest(days: number = 14): Promise<GradeResult[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await prisma.gradeResult.findMany({
    where: {
      gradedAt: {
        gte: startDate
      }
    },
    orderBy: {
      totalPoints: 'asc'
    },
    take: 5,
    select: {
      id: true,
      filename: true,
      fileType: true,
      totalPoints: true,
      gradedAt: true
    }
  });
  
  logger.debug(`[DASHBOARD] Top 5 bài điểm thấp nhất (${days} ngày): ${results.length} items`);
  return results;
}

/**
 * Lấy các bài có điểm cao nhất trong khoảng thời gian với hỗ trợ phân trang
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @param limit Số lượng kết quả trả về (mặc định: 10)
 * @param offset Vị trí bắt đầu (mặc định: 0)
 * @returns Danh sách bài điểm cao nhất và tổng số lượng
 */
export async function topHighestWithPagination(
  days: number = 14, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ results: GradeResult[], totalCount: number }> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Ensure offset is not negative
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  
  const [results, totalCount] = await Promise.all([
    prisma.gradeResult.findMany({
      where: {
        gradedAt: {
          gte: startDate
        }
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        filename: true,
        fileType: true,
        totalPoints: true,
        gradedAt: true
      }
    }),
    prisma.gradeResult.count({
      where: {
        gradedAt: {
          gte: startDate
        }
      }
    })
  ]);
  
  logger.debug(`[DASHBOARD] Top bài điểm cao nhất (${days} ngày): ${results.length} items`);
  return { results, totalCount };
}

/**
 * Lấy các bài có điểm thấp nhất trong khoảng thời gian với hỗ trợ phân trang
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @param limit Số lượng kết quả trả về (mặc định: 10)
 * @param offset Vị trí bắt đầu (mặc định: 0)
 * @returns Danh sách bài điểm thấp nhất và tổng số lượng
 */
export async function topLowestWithPagination(
  days: number = 14, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ results: GradeResult[], totalCount: number }> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Ensure offset is not negative
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  
  const [results, totalCount] = await Promise.all([
    prisma.gradeResult.findMany({
      where: {
        gradedAt: {
          gte: startDate
        }
      },
      orderBy: {
        totalPoints: 'asc'
      },
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        filename: true,
        fileType: true,
        totalPoints: true,
        gradedAt: true
      }
    }),
    prisma.gradeResult.count({
      where: {
        gradedAt: {
          gte: startDate
        }
      }
    })
  ]);
  
  logger.debug(`[DASHBOARD] Top bài điểm thấp nhất (${days} ngày): ${results.length} items`);
  return { results, totalCount };
}

/**
 * Tính tỷ lệ bài có điểm trong khoảng
 * @param min Điểm tối thiểu (mặc định: 5)
 * @param max Điểm tối đa (mặc định: 10)
 * @returns Số lượng và tỷ lệ phần trăm
 */
export async function ratioByScore(min: number = 5, max: number = 10): Promise<{
  count: number;
  percentage: number;
}> {
  const total = await prisma.gradeResult.count();
  
  const count = await prisma.gradeResult.count({
    where: {
      totalPoints: {
        gte: min,
        lte: max
      }
    }
  });
  
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  logger.debug(`[DASHBOARD] Tỷ lệ bài điểm ${min}-${max}: ${count}/${total} (${percentage.toFixed(2)}%)`);
  return { count, percentage };
}

/**
 * Đếm số lượng theo loại file
 * @returns Số lượng theo loại file
 */
export async function countByFileType(): Promise<{
  PPTX: number;
  DOCX: number;
}> {
  const pptxCount = await prisma.gradeResult.count({
    where: {
      fileType: 'PPTX'
    }
  });
  
  const docxCount = await prisma.gradeResult.count({
    where: {
      fileType: 'DOCX'
    }
  });
  
  logger.debug(`[DASHBOARD] Số lượng theo loại file: PPTX=${pptxCount}, DOCX=${docxCount}`);
  return { PPTX: pptxCount, DOCX: docxCount };
}

/**
 * Đếm số lượng theo ngày upload
 * @param days Số ngày tính từ hiện tại (mặc định: 14)
 * @returns Số lượng theo ngày
 */
export async function countByUploadDate(days: number = 14): Promise<{
  date: string;
  count: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Group by date and count (SQLite compatible)
  const allResults = await prisma.gradeResult.findMany({
    where: {
      gradedAt: {
        gte: startDate
      }
    },
    select: {
      gradedAt: true
    },
    orderBy: {
      gradedAt: 'asc'
    }
  });
  
  // Group results by date manually
  const grouped: Record<string, number> = {};
  
  allResults.forEach(result => {
    const dateStr = result.gradedAt.toISOString().split('T')[0];
    if (!grouped[dateStr]) {
      grouped[dateStr] = 0;
    }
    grouped[dateStr]++;
  });
  
  // Convert to array and sort by date descending
  const results = Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
  
  logger.debug(`[DASHBOARD] Số lượng theo ngày upload (${days} ngày): ${results.length} days`);
  return results;
}