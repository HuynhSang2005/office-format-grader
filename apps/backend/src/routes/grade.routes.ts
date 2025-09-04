/**
 * @file grade.routes.ts
 * @description Routes cho grading APIs
 * @author Nguyễn Huỳnh Sang
 */

import { createRoute } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { logger } from '../core/logger';
import { 
  gradeFileController,
  gradeCustomController,
  gradeCustomSelectiveController,
  getGradeHistoryController,
  getGradeResultController
} from '../controllers/grade.controller';
import { 
  GradeFileApiSchema,
  CustomGradeApiSchema,
  GradeHistoryApiSchema,
  GradeFileResponseSchema,
  BatchGradeResponseSchema,
  GradeHistoryResponseSchema,
  SingleGradeResultResponseSchema,
  GradeErrorResponseSchema
} from '../schemas';

// POST /grade - Chấm điểm file
// Body: { fileId: string, userId: number, useHardRubric?: boolean, onlyCriteria?: string[] }
export const gradeFileRoute = createRoute({
  method: 'post',
  path: '/grade',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GradeFileApiSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GradeFileResponseSchema
        }
      },
      description: 'Chấm điểm file thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    500: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// POST /grade/custom - Chấm điểm với custom rubric
// Body: { rubricId?, rubric?, onlyCriteria?, files[] }
export const gradeCustomRoute = createRoute({
  method: 'post',
  path: '/grade/custom',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CustomGradeApiSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GradeFileResponseSchema.or(BatchGradeResponseSchema)
        }
      },
      description: 'Chấm điểm với custom rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    404: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Không tìm thấy custom rubric'
    },
    500: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// POST /grade/custom-selective - Chấm điểm chọn lọc với custom rubric
// Body: { rubricId?, rubric?, onlyCriteria?, files[] }
export const gradeCustomSelectiveRoute = createRoute({
  method: 'post',
  path: '/grade/custom-selective',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CustomGradeApiSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GradeFileResponseSchema.or(BatchGradeResponseSchema)
        }
      },
      description: 'Chấm điểm chọn lọc với custom rubric thành công'
    },
    400: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Dữ liệu request không hợp lệ'
    },
    404: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Không tìm thấy custom rubric'
    },
    500: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// GET /grade/history - Lấy lịch sử chấm điểm của user
// Query params: limit? (number), offset? (number)
// User ID được lấy từ JWT token
export const gradeHistoryRoute = createRoute({
  method: 'get',
  path: '/grade/history',
  request: {
    query: GradeHistoryApiSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GradeHistoryResponseSchema
        }
      },
      description: 'Lấy lịch sử chấm điểm thành công'
    },
    500: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Lỗi server'
    }
  }
});

// GET /grade/:id - Lấy chi tiết kết quả chấm điểm
// Params: id (string - result ID)
// User ID được lấy từ JWT token
export const gradeResultRoute = createRoute({
  method: 'get',
  path: '/grade/{id}',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SingleGradeResultResponseSchema
        }
      },
      description: 'Lấy chi tiết kết quả chấm điểm thành công'
    },
    404: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
        }
      },
      description: 'Không tìm thấy kết quả chấm điểm'
    },
    500: {
      content: {
        'application/json': {
          schema: GradeErrorResponseSchema
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
export const gradeRoutes = new OpenAPIHono();
// Use the actual controllers for the OpenAPI documentation
gradeRoutes.openapi(gradeFileRoute, createCompatibleHandler(gradeFileController));
gradeRoutes.openapi(gradeCustomRoute, createCompatibleHandler(gradeCustomController));
gradeRoutes.openapi(gradeCustomSelectiveRoute, createCompatibleHandler(gradeCustomSelectiveController));
gradeRoutes.openapi(gradeHistoryRoute, createCompatibleHandler(getGradeHistoryController));
gradeRoutes.openapi(gradeResultRoute, createCompatibleHandler(getGradeResultController));

// Create a regular Hono app for the main app
const regularGradeRoutes = new Hono();
regularGradeRoutes.post('/', gradeFileController);
regularGradeRoutes.post('/custom', gradeCustomController);
regularGradeRoutes.post('/custom-selective', gradeCustomSelectiveController);
regularGradeRoutes.get('/history', getGradeHistoryController);
regularGradeRoutes.get('/:id', getGradeResultController);
export default regularGradeRoutes;