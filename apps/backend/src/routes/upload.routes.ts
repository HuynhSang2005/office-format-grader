/**
 * @file upload.routes.ts
 * @description Routes cho file upload APIs
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute, z } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { logger } from '../core/logger';
import { uploadFileController } from '../controllers/upload.controller';
import { 
  UploadRequestSchema,
  UploadSuccessResponseSchema,
  UploadErrorResponseSchema,
  UploadFileNotFoundResponseSchema
} from '../schemas';

// Upload file route
export const uploadRoute = createRoute({
  method: 'post',
  path: '/upload',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: UploadRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UploadSuccessResponseSchema
        }
      },
      description: 'Upload file thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: UploadErrorResponseSchema.or(UploadFileNotFoundResponseSchema)
        }
      },
      description: 'Upload thất bại do dữ liệu không hợp lệ hoặc thiếu file'
    },
    500: {
      content: {
        'application/json': {
          schema: UploadErrorResponseSchema
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
export const uploadRoutes = new OpenAPIHono();
// Use the actual controller for the OpenAPI documentation
uploadRoutes.openapi(uploadRoute, createCompatibleHandler(uploadFileController));

// Create a regular Hono app for the main app
const regularUploadRoutes = new Hono();
regularUploadRoutes.post('/', uploadFileController);
export default regularUploadRoutes;