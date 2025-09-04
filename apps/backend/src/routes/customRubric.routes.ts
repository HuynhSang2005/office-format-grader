/**
 * @file customRubric.routes.ts
 * @description Routes cho Custom Rubric APIs
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { logger } from '../core/logger';
import { 
  createCustomRubricController,
  updateCustomRubricController,
  deleteCustomRubricController,
  getCustomRubricController,
  listCustomRubricsController,
  validateCustomRubricController
} from '../controllers/customRubric.controller';
import { 
  CreateCustomRubricSchema,
  UpdateCustomRubricSchema,
  ListCustomRubricsQuerySchema,
  CreateCustomRubricResponseSchema,
  UpdateCustomRubricResponseSchema,
  DeleteCustomRubricResponseSchema,
  GetCustomRubricResponseSchema,
  ListCustomRubricsResponseSchema,
  ValidateCustomRubricResponseSchema,
  CustomRubricErrorResponseSchema
} from '../schemas';

// POST /custom-rubrics - Tạo mới custom rubric
export const createCustomRubricRoute = createRoute({
  method: 'post',
  path: '/custom-rubrics',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCustomRubricSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CreateCustomRubricResponseSchema
        }
      },
      description: 'Tạo mới custom rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// PUT /custom-rubrics/:id - Cập nhật custom rubric
export const updateCustomRubricRoute = createRoute({
  method: 'put',
  path: '/custom-rubrics/{id}',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateCustomRubricSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UpdateCustomRubricResponseSchema
        }
      },
      description: 'Cập nhật custom rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    404: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Không tìm thấy custom rubric'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// DELETE /custom-rubrics/:id - Xóa custom rubric
export const deleteCustomRubricRoute = createRoute({
  method: 'delete',
  path: '/custom-rubrics/{id}',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DeleteCustomRubricResponseSchema
        }
      },
      description: 'Xóa custom rubric thành công'
    },
    404: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Không tìm thấy custom rubric'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// GET /custom-rubrics - Liệt kê custom rubrics của user
// Query params: ownerId (string)
export const listCustomRubricsRoute = createRoute({
  method: 'get',
  path: '/custom-rubrics',
  request: {
    query: ListCustomRubricsQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ListCustomRubricsResponseSchema
        }
      },
      description: 'Liệt kê custom rubrics thành công'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// GET /custom-rubrics/:id - Lấy chi tiết custom rubric
export const getCustomRubricRoute = createRoute({
  method: 'get',
  path: '/custom-rubrics/{id}',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GetCustomRubricResponseSchema
        }
      },
      description: 'Lấy chi tiết custom rubric thành công'
    },
    404: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Không tìm thấy custom rubric'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// POST /custom-rubrics/:id/validate - Validate custom rubric
export const validateCustomRubricRoute = createRoute({
  method: 'post',
  path: '/custom-rubrics/{id}/validate',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateCustomRubricSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ValidateCustomRubricResponseSchema
        }
      },
      description: 'Validate custom rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: ValidateCustomRubricResponseSchema
        }
      },
      description: 'Rubric không hợp lệ'
    },
    500: {
      content: {
        'application/json': {
          schema: CustomRubricErrorResponseSchema
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
export const customRubricRoutes = new OpenAPIHono();
// Use the actual controllers for the OpenAPI documentation
customRubricRoutes.openapi(createCustomRubricRoute, createCompatibleHandler(createCustomRubricController));
customRubricRoutes.openapi(updateCustomRubricRoute, createCompatibleHandler(updateCustomRubricController));
customRubricRoutes.openapi(deleteCustomRubricRoute, createCompatibleHandler(deleteCustomRubricController));
customRubricRoutes.openapi(listCustomRubricsRoute, createCompatibleHandler(listCustomRubricsController));
customRubricRoutes.openapi(getCustomRubricRoute, createCompatibleHandler(getCustomRubricController));
customRubricRoutes.openapi(validateCustomRubricRoute, createCompatibleHandler(validateCustomRubricController));

// Create a regular Hono app for the main app
const regularCustomRubricRoutes = new Hono();
regularCustomRubricRoutes.post('/', createCustomRubricController);
regularCustomRubricRoutes.put('/:id', updateCustomRubricController);
regularCustomRubricRoutes.delete('/:id', deleteCustomRubricController);
regularCustomRubricRoutes.get('/', listCustomRubricsController);
regularCustomRubricRoutes.get('/:id', getCustomRubricController);
regularCustomRubricRoutes.post('/:id/validate', validateCustomRubricController);
export default regularCustomRubricRoutes;