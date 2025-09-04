/**
 * @file auth.routes.ts
 * @description Route xác thực người dùng
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { authController } from '../controllers/auth.controller';
import { 
  LoginRequestSchema,
  LoginResponseSchema,
  AuthErrorResponseSchema,
  LogoutResponseSchema,
  CurrentUserResponseSchema
} from '../schemas';

// Login route
export const loginRoute = createRoute({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LoginResponseSchema
        }
      },
      description: 'Đăng nhập thành công'
    },
    401: {
      content: {
        'application/json': {
          schema: AuthErrorResponseSchema
        }
      },
      description: 'Xác thực thất bại'
    },
    500: {
      content: {
        'application/json': {
          schema: AuthErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// Logout route
export const logoutRoute = createRoute({
  method: 'post',
  path: '/auth/logout',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LogoutResponseSchema
        }
      },
      description: 'Đăng xuất thành công'
    }
  }
});

// Get current user route
export const meRoute = createRoute({
  method: 'get',
  path: '/auth/me',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CurrentUserResponseSchema
        }
      },
      description: 'Lấy thông tin user hiện tại thành công'
    }
  }
});

// Create an OpenAPIHono app and attach the controllers
import { OpenAPIHono } from '@hono/zod-openapi';
export const authRoutes = new OpenAPIHono();
authRoutes.openapi(loginRoute, authController.login);
authRoutes.openapi(logoutRoute, authController.logout);
authRoutes.openapi(meRoute, authController.getCurrentUser);

// Create a regular Hono app for the main app
const regularAuthRoutes = new Hono();
regularAuthRoutes.post('/login', authController.login);
regularAuthRoutes.post('/logout', authController.logout);
regularAuthRoutes.get('/me', authController.getCurrentUser);
export default regularAuthRoutes;