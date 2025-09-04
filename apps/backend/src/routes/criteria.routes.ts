/**
 * @file criteria.routes.ts
 * @description Routes cho criteria management APIs
 * @author Nguyễn Huỳnh Sang
 */

import { Hono } from 'hono';
import { logger } from '../core/logger';
import {
  listCriteriaController,
  getCriterionController,
  getSupportedCriteriaController,
  validateRubricController,
  previewCriteriaController
} from '../controllers/criteria.controller';

// Create a regular Hono app for the main app
const regularCriteriaRoutes = new Hono();

// Middleware để log tất cả requests
regularCriteriaRoutes.use('*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  logger.info(`${method} ${path} - Criteria API request`);
  
  await next();
  
  const status = c.res.status;
  logger.info(`${method} ${path} - Response: ${status}`);
});

// GET /criteria - List criteria theo query parameters
// Query params: source (preset|custom), fileType (PPTX|DOCX), rubricName? (string)
regularCriteriaRoutes.get('/', listCriteriaController);

// GET /criteria/supported - Get supported criteria cho file type
// Query params: fileType? (PPTX|DOCX), detectorKey? (string)
regularCriteriaRoutes.get('/supported', getSupportedCriteriaController);

// GET /criteria/:id - Get single criterion by ID
regularCriteriaRoutes.get('/:id', getCriterionController);

// POST /criteria/validate - Validate rubric structure
// Body: { rubric: Rubric }
regularCriteriaRoutes.post('/validate', validateRubricController);

// POST /criteria/preview - Preview criteria evaluation
// Body: { fileId?: string, features?: object, rubric: Rubric, onlyCriteria?: string[] }
regularCriteriaRoutes.post('/preview', previewCriteriaController);

export default regularCriteriaRoutes;

// Export an OpenAPIHono version for documentation
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

// Define schemas for criteria endpoints
const ListCriteriaQuerySchema = z.object({
  source: z.enum(['preset', 'custom']).optional(),
  fileType: z.enum(['PPTX', 'DOCX']).optional(),
  rubricName: z.string().optional()
});

const GetSupportedCriteriaQuerySchema = z.object({
  fileType: z.enum(['PPTX', 'DOCX']).optional(),
  detectorKey: z.string().optional()
});

const ValidateRubricRequestSchema = z.object({
  rubric: z.any()
});

const PreviewCriteriaRequestSchema = z.object({
  fileId: z.string().optional(),
  features: z.any().optional(),
  rubric: z.any(),
  onlyCriteria: z.array(z.string()).optional()
});

const CriteriaParamsSchema = z.object({
  id: z.string()
});

// Define a very generic response schema
const GenericResponseSchema = z.object({}).catchall(z.any());

// Define routes for OpenAPI documentation
export const listCriteriaRoute = createRoute({
  method: 'get',
  path: '/criteria',
  request: {
    query: ListCriteriaQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'List criteria thành công'
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

export const getSupportedCriteriaRoute = createRoute({
  method: 'get',
  path: '/criteria/supported',
  request: {
    query: GetSupportedCriteriaQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Get supported criteria thành công'
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

export const getCriterionRoute = createRoute({
  method: 'get',
  path: '/criteria/{id}',
  request: {
    params: CriteriaParamsSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Get single criterion thành công'
    },
    404: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Không tìm thấy criterion'
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

export const validateRubricRoute = createRoute({
  method: 'post',
  path: '/criteria/validate',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ValidateRubricRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Validate rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
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

export const previewCriteriaRoute = createRoute({
  method: 'post',
  path: '/criteria/preview',
  request: {
    body: {
      content: {
        'application/json': {
          schema: PreviewCriteriaRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Preview criteria evaluation thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
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

export const openApiCriteriaRoutes = new OpenAPIHono();
// Register the routes with the OpenAPI documentation
openApiCriteriaRoutes.openapi(listCriteriaRoute, createCompatibleHandler(listCriteriaController));
openApiCriteriaRoutes.openapi(getSupportedCriteriaRoute, createCompatibleHandler(getSupportedCriteriaController));
openApiCriteriaRoutes.openapi(getCriterionRoute, createCompatibleHandler(getCriterionController));
openApiCriteriaRoutes.openapi(validateRubricRoute, createCompatibleHandler(validateRubricController));
openApiCriteriaRoutes.openapi(previewCriteriaRoute, createCompatibleHandler(previewCriteriaController));