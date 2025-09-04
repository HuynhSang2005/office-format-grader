/**
 * @file auth.middleware.ts
 * @description Xác thực JWT middleware cho các route được bảo vệ
 * @author Nguyễn Huỳnh Sang
 */

import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { APP_CONFIG } from '@config/constants';
import { logger } from '@core/logger';
import type { UserContext } from '@/types/middleware.types';
import type { HonoContextExtension } from '@/types/hono-context.types';

// Interface mở rộng context Hono
declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext;
  }
}

export const authGuard = createMiddleware(async (c, next) => {
  // Lấy token từ cookie
  const cookieHeader = c.req.header('Cookie');
  let token: string | null = null;
  
  if (cookieHeader) {
    // Parse cookies properly
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
    if (tokenCookie) {
      // Extract token value correctly by splitting on '=' and taking the second part
      const tokenParts = tokenCookie.split('=');
      if (tokenParts.length >= 2) {
        token = tokenParts[1].split(';')[0]; // Take only the token value, not other cookie attributes
      }
    }
  }
  
  // Nếu không có token trong cookie, thử lấy từ Authorization header
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    logger.warn('[AUTH] Thiếu token xác thực');
    return c.json({ 
      error: 'Unauthorized', 
      message: 'Token không hợp lệ' 
    }, 401);
  }

  try {
    const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Gắn user vào context
    c.set('user', {
      id: Number(payload.sub),
      email: payload.email as string
    });
    
    await next();
  } catch (error) {
    logger.warn('[AUTH] Xác thực token thất bại:', error);
    return c.json({ 
      error: 'Unauthorized', 
      message: 'Token không hợp lệ hoặc đã hết hạn' 
    }, 401);
  }
});