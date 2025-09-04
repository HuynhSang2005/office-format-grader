/**
 * @file auth.types.ts
 * @description Các kiểu dữ liệu cho chức năng xác thực
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Interface cho login request body
 */
export interface LoginBody {
  email: string;
  password: string;
}