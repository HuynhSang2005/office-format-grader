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
  previewCriteriaController,
  getRubricController
} from '../controllers/criteria.controller';
// Add the new CRUD controllers
import {
  createCriterionController,
  updateCriterionController,
  deleteCriterionController,
  listAllCriteriaController
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

// GET /criteria/all - List all criteria
regularCriteriaRoutes.get('/all', listAllCriteriaController);

// GET /criteria/supported - Get supported criteria cho file type
// Query params: fileType? (PPTX|DOCX), detectorKey? (string)
regularCriteriaRoutes.get('/supported', getSupportedCriteriaController);

// GET /criteria/:id - Get single criterion by ID
regularCriteriaRoutes.get('/:id', getCriterionController);

// POST /criteria - Create a new criterion
regularCriteriaRoutes.post('/', createCriterionController);

// PUT /criteria/:id - Update a criterion
regularCriteriaRoutes.put('/:id', updateCriterionController);

// DELETE /criteria/:id - Delete a criterion
regularCriteriaRoutes.delete('/:id', deleteCriterionController);

// POST /criteria/validate - Validate rubric structure
// Body: { rubric: Rubric }
regularCriteriaRoutes.post('/validate', validateRubricController);

// POST /criteria/preview - Preview criteria evaluation
// Body: { fileId?: string, features?: object, rubric: Rubric, onlyCriteria?: string[] }
regularCriteriaRoutes.post('/preview', previewCriteriaController);

// GET /criteria/rubric - Get rubric data for frontend
// Query params: fileType (PPTX|DOCX)
regularCriteriaRoutes.get('/rubric', getRubricController);

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

const GetRubricQuerySchema = z.object({
  fileType: z.enum(['PPTX', 'DOCX'])
});

const CriteriaParamsSchema = z.object({
  id: z.string()
});

// Define schema for create criterion
const CreateCriterionSchema = z.object({
  name: z.string().min(1, 'Name không được rỗng').max(100, 'Name không được quá 100 ký tự'),
  description: z.string().min(1, 'Description không được rỗng').max(500, 'Description không được quá 500 ký tự'),
  detectorKey: z.string(),
  maxPoints: z.number().min(0.25, 'Max points phải >= 0.25').max(10, 'Max points không được > 10'),
  levels: z.array(z.object({
    points: z.number(),
    code: z.string(),
    name: z.string(),
    description: z.string()
  })).min(2, 'Phải có ít nhất 2 levels').max(10, 'Không được quá 10 levels')
});

// Define schema for update criterion
const UpdateCriterionSchema = z.object({
  name: z.string().min(1, 'Name không được rỗng').max(100, 'Name không được quá 100 ký tự').optional(),
  description: z.string().min(1, 'Description không được rỗng').max(500, 'Description không được quá 500 ký tự').optional(),
  detectorKey: z.string().optional(),
  maxPoints: z.number().min(0.25, 'Max points phải >= 0.25').max(10, 'Max points không được > 10').optional(),
  levels: z.array(z.object({
    points: z.number(),
    code: z.string(),
    name: z.string(),
    description: z.string()
  })).min(2, 'Phải có ít nhất 2 levels').max(10, 'Không được quá 10 levels').optional()
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

export const listAllCriteriaRoute = createRoute({
  method: 'get',
  path: '/criteria/all',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'List all criteria thành công'
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

export const createCriterionRoute = createRoute({
  method: 'post',
  path: '/criteria',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCriterionSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Tạo criterion mới thành công'
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

export const updateCriterionRoute = createRoute({
  method: 'put',
  path: '/criteria/{id}',
  request: {
    params: CriteriaParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateCriterionSchema
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
      description: 'Cập nhật criterion thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
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

export const deleteCriterionRoute = createRoute({
  method: 'delete',
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
      description: 'Xóa criterion thành công'
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

export const getRubricRoute = createRoute({
  method: 'get',
  path: '/criteria/rubric',
  request: {
    query: GetRubricQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Lấy rubric data thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GenericResponseSchema
        }
      },
      description: 'Thiếu hoặc sai fileType parameter'
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
// Register the new routes with the OpenAPI documentation
openApiCriteriaRoutes.openapi(listCriteriaRoute, createCompatibleHandler(listCriteriaController));
openApiCriteriaRoutes.openapi(listAllCriteriaRoute, createCompatibleHandler(listAllCriteriaController));
openApiCriteriaRoutes.openapi(getSupportedCriteriaRoute, createCompatibleHandler(getSupportedCriteriaController));
openApiCriteriaRoutes.openapi(getCriterionRoute, createCompatibleHandler(getCriterionController));
openApiCriteriaRoutes.openapi(createCriterionRoute, createCompatibleHandler(createCriterionController));
openApiCriteriaRoutes.openapi(updateCriterionRoute, createCompatibleHandler(updateCriterionController));
openApiCriteriaRoutes.openapi(deleteCriterionRoute, createCompatibleHandler(deleteCriterionController));
openApiCriteriaRoutes.openapi(validateRubricRoute, createCompatibleHandler(validateRubricController));
openApiCriteriaRoutes.openapi(previewCriteriaRoute, createCompatibleHandler(previewCriteriaController));
openApiCriteriaRoutes.openapi(getRubricRoute, createCompatibleHandler(getRubricController));