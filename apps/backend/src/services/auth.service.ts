/**
 * @file auth.service.ts
 * @description Dịch vụ xử lý logic xác thực người dùng
 * @author Nguyễn Huỳnh Sang
 */

import { SignJWT } from 'jose';
import { APP_CONFIG } from '@config/constants';
import { logger } from '@core/logger';
import { userService } from '@services/user.service';

export const authService = {
  /**
   * Xác thực thông tin đăng nhập của người dùng
   * @param email Email của người dùng
   * @param password Mật khẩu của người dùng
   * @returns Thông tin user nếu xác thực thành công, null nếu thất bại
   */
  authenticateUser: async (email: string, password: string) => {
    try {
      // Kiểm tra user trong DB
      const user = await userService.findByEmail(email);
      if (!user) {
        logger.warn(`[AUTH] Đăng nhập thất bại: User ${email} không tồn tại`);
        return null;
      }

      // Kiểm tra password
      const isValidPassword = await userService.validatePassword(
        password, 
        user.password
      );
      
      if (!isValidPassword) {
        logger.warn(`[AUTH] Đăng nhập thất bại: Sai mật khẩu cho user ${email}`);
        return null;
      }

      return user;
    } catch (error) {
      logger.error('[AUTH] Lỗi khi xác thực người dùng:', error);
      return null;
    }
  },

  /**
   * Tạo JWT token cho người dùng
   * @param user Thông tin người dùng
   * @returns JWT token
   */
  createToken: async (user: { id: number; email: string }) => {
    try {
      const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
      const iat = Math.floor(Date.now() / 1000);
      
      // Xử lý thời gian hết hạn
      let exp: number;
      if (APP_CONFIG.JWT_EXPIRES_IN.endsWith('h')) {
        const hours = parseInt(APP_CONFIG.JWT_EXPIRES_IN.replace('h', ''));
        exp = iat + (hours * 60 * 60);
      } else if (APP_CONFIG.JWT_EXPIRES_IN.endsWith('d')) {
        const days = parseInt(APP_CONFIG.JWT_EXPIRES_IN.replace('d', ''));
        exp = iat + (days * 24 * 60 * 60);
      } else {
        // Mặc định 24 giờ
        exp = iat + (24 * 60 * 60);
      }

      const token = await new SignJWT({ email: user.email })
        .setProtectedHeader({ alg: APP_CONFIG.JWT_ALGORITHM })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .setSubject(user.id.toString())
        .sign(secret);

      logger.info(`[AUTH] Tạo token thành công cho user ${user.email}`);
      return token;
    } catch (error) {
      logger.error('[AUTH] Lỗi khi tạo token:', error);
      throw error;
    }
  }
};