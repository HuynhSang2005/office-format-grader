/**
 * @file middleware.types.ts
 * @description Các kiểu dữ liệu cho middleware
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Interface cho user context trong auth middleware
 */
export interface UserContext {
  id: number;
  email: string;
}