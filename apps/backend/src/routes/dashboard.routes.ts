/**
 * @file dashboard.routes.ts
 * @description Routes cho dashboard APIs
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { getDashboardStatsController } from '../controllers/dashboard.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { 
  DashboardQuerySchema,
  DashboardStatsResponseSchema,
  DashboardErrorResponseSchema
} from '../schemas';

// GET /api/dashboard - Lấy thống kê dashboard
// Query params: gradedDays?, ungradedHours?, minScore?, maxScore?, uploadDays?, topDays?
// Cần xác thực người dùng
export const dashboardRoute = createRoute({
  method: 'get',
  path: '/dashboard',
  request: {
    query: DashboardQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DashboardStatsResponseSchema
        }
      },
      description: 'Lấy thống kê dashboard thành công'
    },
    500: {
      content: {
        'application/json': {
          schema: DashboardErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// Create a compatible wrapper function
function createCompatibleHandler(handler: Function) {
  return (c: any) => {
    // @ts-ignore - Ignore type checking due to version conflicts
    return handler(c);
  };
}

// Create an OpenAPIHono app and attach the controller
import { OpenAPIHono } from '@hono/zod-openapi';
export const dashboardRoutes = new OpenAPIHono();
// Use the actual controller for the OpenAPI documentation
dashboardRoutes.openapi(dashboardRoute, createCompatibleHandler(getDashboardStatsController));

// Create a regular Hono app for the main app
const regularDashboardRoutes = new Hono();
regularDashboardRoutes.get('/', getDashboardStatsController);
export default regularDashboardRoutes;