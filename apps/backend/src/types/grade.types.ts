/**
 * @file grade.types.ts
 * @description Các kiểu dữ liệu cho chức năng chấm điểm
 * @author Nguyễn Huỳnh Sang
 */

import type { GradeResult, Rubric } from './criteria';

/**
 * Interface cho grade request (supports both single and batch)
 */
export interface GradeFileRequest {
  fileId?: string;
  files?: string[];
  userId: number;
  useHardRubric?: boolean;
  customRubric?: Rubric;
  onlyCriteria?: string[];
  concurrency?: number; // Số lượng file xử lý đồng thời (mặc định: 5)
}

/**
 * Interface cho batch grade request
 */
export interface BatchGradeRequest {
  files: string[];
  userId: number;
  useHardRubric?: boolean;
  customRubric?: Rubric;
  onlyCriteria?: string[];
  concurrency?: number; // Số lượng file xử lý đồng thời (mặc định: 5)
}

/**
 * Interface cho grade result với DB info
 */
export interface GradeResultWithDB extends GradeResult {
  dbId: string;
  saved: boolean;

  // Add warnings field for custom rubric validation
  warnings?: string[];
}