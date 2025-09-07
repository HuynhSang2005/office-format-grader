/**
 * @file ungraded.routes.ts
 * @description Routes cho file chưa chấm điểm APIs
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { logger } from '../core/logger';
import { 
  getUngradedFilesController,
  deleteUngradedFileController
} from '../controllers/ungraded.controller';
import { 
  UngradedFilesResponseSchema,
  UngradedFileDeleteResponseSchema,
  UngradedFileErrorResponseSchema
} from '../schemas';

// GET /ungraded - Lấy danh sách file chưa chấm điểm của user
export const getUngradedFilesRoute = createRoute({
  method: 'get',
  path: '/ungraded',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UngradedFilesResponseSchema
        }
      },
      description: 'Lấy danh sách file chưa chấm điểm thành công'
    },
    500: {
      content: {
        'application/json': {
          schema: UngradedFileErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// DELETE /ungraded/:id - Xóa file chưa chấm điểm
export const deleteUngradedFileRoute = createRoute({
  method: 'delete',
  path: '/ungraded/{id}',
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UngradedFileDeleteResponseSchema
        }
      },
      description: 'Xóa file chưa chấm điểm thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: UngradedFileErrorResponseSchema
        }
      },
      description: 'File ID là bắt buộc'
    },
    500: {
      content: {
        'application/json': {
          schema: UngradedFileErrorResponseSchema
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

// Create an OpenAPIHono app and attach the controllers
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
export const ungradedRoutes = new OpenAPIHono();
// Use the actual controllers for the OpenAPI documentation
ungradedRoutes.openapi(getUngradedFilesRoute, createCompatibleHandler(getUngradedFilesController));
ungradedRoutes.openapi(deleteUngradedFileRoute, createCompatibleHandler(deleteUngradedFileController));

// Create a regular Hono app for the main app
const regularUngradedRoutes = new Hono();
regularUngradedRoutes.get('/', getUngradedFilesController);
regularUngradedRoutes.delete('/:id', deleteUngradedFileController);
export default regularUngradedRoutes;