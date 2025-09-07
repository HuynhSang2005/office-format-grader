/**
 * @file auth.controller.ts
 * @description Controller xử lý logic xác thực
 * @author Nguyễn Huỳnh Sang
 */

import { APP_CONFIG } from '@config/constants';
import { logger } from '@core/logger';
import { authService } from '@services/auth.service';
import type { LoginBody } from '@/types/auth.types';

export const authController = {
  login: async (c: any) => {
    try {
      // Parse the request body properly
      const body = await c.req.json();
      const { email, password } = body as LoginBody;

      // Xác thực người dùng thông qua auth service
      const user = await authService.authenticateUser(email, password);
      if (!user) {
        return c.json({ 
          error: 'Unauthorized', 
          message: 'Email hoặc mật khẩu không đúng' 
        }, 401);
      }

      // Tạo JWT token thông qua auth service
      const token = await authService.createToken({
        id: user.id,
        email: user.email
      });

      // Set HttpOnly cookie
      c.res.headers.set(
        'Set-Cookie', 
        `token=${token}; HttpOnly; Secure=${APP_CONFIG.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=86400`
      );

      logger.info(`[AUTH] User ${email} đăng nhập thành công`);
      
      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email
        },
        token
      });
    } catch (error) {
      logger.error('[AUTH] Lỗi khi đăng nhập:', error);
      // Log chi tiết lỗi để debug
      console.error('Chi tiết lỗi đăng nhập:', error);
      return c.json({ 
        error: 'Internal Server Error', 
        message: 'Có lỗi xảy ra khi đăng nhập',
        debug: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  },

  logout: async (c: any) => {
    // Xóa cookie bằng cách set expired date
    c.res.headers.set(
      'Set-Cookie', 
      `token=; HttpOnly; Secure=${APP_CONFIG.NODE_ENV === 'production'}; SameSite=Strict; Path=/; Max-Age=0`
    );
    
    logger.info('[AUTH] User đăng xuất thành công');
    return c.json({ success: true, message: 'Đăng xuất thành công' });
  },

  getCurrentUser: async (c: any) => {
    const user = c.get('user');
    console.log('User from context:', user);
    return c.json(user);
  }
};