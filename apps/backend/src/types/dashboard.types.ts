/**
 * @file dashboard.types.ts
 * @description Các kiểu dữ liệu cho chức năng dashboard
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Interface cho thông tin phân trang
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface cho kết quả chấm điểm trong dashboard
 */
export interface GradeResult {
  id: string;
  filename: string;
  fileType: string;
  totalPoints: number;
  gradedAt: Date;
}

/**
 * Interface cho thống kê dashboard
 */
export interface DashboardStats {
  totalGraded: number;
  totalUngraded: number;
  totalCustomRubrics: number;
  top5Highest: GradeResult[];
  top5Lowest: GradeResult[];
  topHighestPaginated?: {
    data: GradeResult[];
    pagination: PaginationInfo;
  };
  topLowestPaginated?: {
    data: GradeResult[];
    pagination: PaginationInfo;
  };
  ratioByScore: {
    count: number;
    percentage: number;
  };
  countByFileType: {
    PPTX: number;
    DOCX: number;
  };
  countByUploadDate: {
    date: string;
    count: number;
  }[];
}