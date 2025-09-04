/**
 * @file custom-rubric.types.ts
 * @description Các kiểu dữ liệu cho chức năng custom rubric
 * @author Nguyễn Huỳnh Sang
 */

import type { Rubric } from './criteria';

/**
 * Interface cho Custom Rubric
 */
export interface CustomRubric {
  id: string;
  ownerId: number;  // Changed from string to number to match Prisma schema
  name: string;
  content: Rubric;
  total: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface cho Create Custom Rubric request
 */
export interface CreateCustomRubricRequest {
  ownerId: number;  // Changed from string to number to match Prisma schema
  name: string;
  content: Rubric;
  isPublic?: boolean;
}

/**
 * Interface cho Update Custom Rubric request
 */
export interface UpdateCustomRubricRequest {
  name?: string;
  content?: Rubric;
  isPublic?: boolean;
}