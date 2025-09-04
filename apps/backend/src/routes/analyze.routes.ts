/**
 * @file analyze.routes.ts
 * @description Route xử lý phân tích file PPTX/DOCX để debug
 * @author Nguyễn Huỳnh Sang
 */

import { Hono } from 'hono';
import { analyzeFileController } from '../controllers/analyze.controller';

// Create a regular Hono app for the main app
const regularAnalyzeRoutes = new Hono();

// Route debug phân tích file - chỉ dùng cho dev
// GET /debug/analyze/:fileId?type=PPTX|DOCX
regularAnalyzeRoutes.get('/analyze/:fileId', analyzeFileController);

export default regularAnalyzeRoutes;

// Export an OpenAPIHono version for documentation
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

// Define the schema for the analyze endpoint
const AnalyzeFileQuerySchema = z.object({
  type: z.enum(['PPTX', 'DOCX']).optional()
});

const AnalyzeFileParamsSchema = z.object({
  fileId: z.string()
});

// Define a very generic response schema
const GenericResponseSchema = z.object({}).catchall(z.any());

// Define the route for OpenAPI documentation
export const analyzeFileRoute = createRoute({
  method: 'get',
  path: '/debug/analyze/{fileId}',
  request: {
    query: AnalyzeFileQuerySchema,
    params: AnalyzeFileParamsSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Phân tích file thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Request không hợp lệ'
    },
    500: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
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

export const openApiAnalyzeRoutes = new OpenAPIHono();
// Register the route with the OpenAPI documentation
openApiAnalyzeRoutes.openapi(analyzeFileRoute, createCompatibleHandler(analyzeFileController));