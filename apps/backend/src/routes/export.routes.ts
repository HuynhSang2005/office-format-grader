/**
 * @file export.routes.ts
 * @description Route xử lý export kết quả chấm điểm
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { exportExcelController } from '../controllers/export.controller';
import { 
  ExportRequestSchema,
  ExportSuccessResponseSchema,
  ExportErrorResponseSchema
} from '../schemas';

// Route export kết quả chấm điểm ra Excel
export const exportRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ExportRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ExportSuccessResponseSchema
        }
      },
      description: 'Export kết quả chấm điểm thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: ExportErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    404: {
      content: {
        'application/json': {
          schema: ExportErrorResponseSchema
        }
      },
      description: 'Không tìm thấy kết quả chấm điểm để export'
    },
    500: {
      content: {
        'application/json': {
          schema: ExportErrorResponseSchema
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
export const exportRoutes = new OpenAPIHono();
// Use the actual controller for the OpenAPI documentation
exportRoutes.openapi(exportRoute, createCompatibleHandler(exportExcelController));

// Create a regular Hono app for the main app
const regularExportRoutes = new Hono();
regularExportRoutes.post('/', zValidator('json', ExportRequestSchema), exportExcelController);
export default regularExportRoutes;