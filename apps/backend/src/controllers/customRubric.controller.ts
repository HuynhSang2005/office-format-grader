/**
 * @file customRubric.controller.ts
 * @description Controller xử lý Custom Rubric APIs
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { 
  createCustomRubric, 
  updateCustomRubric, 
  deleteCustomRubric, 
  findCustomRubricById, 
  listCustomRubrics,
  validateRubric
} from '@services/customRubric.service';
import { 
  CreateCustomRubricSchema, 
  UpdateCustomRubricSchema, 
  ListCustomRubricsQuerySchema,
  type ListCustomRubricsQuery
} from '@/schemas/custom-rubric.schema';
import type { 
  CreateCustomRubricRequest, 
  UpdateCustomRubricRequest
} from '@/types/custom-rubric.types';
import type { Rubric } from '@/types/criteria';

// Helper function to convert Zod schema structure to Rubric interface
function convertZodRubricToRubric(zodRubric: any): Rubric {
  return {
    name: zodRubric.title,
    version: zodRubric.version,
    description: zodRubric.description,
    fileType: zodRubric.fileType,
    totalMaxPoints: zodRubric.totalPoints,
    rounding: zodRubric.scoring?.rounding || 'half_up_0.25',
    criteria: zodRubric.criteria?.map((criterion: any) => ({
      id: criterion.id,
      name: criterion.name,
      description: criterion.description || '',
      detectorKey: criterion.detectorKey,
      maxPoints: criterion.maxPoints,
      levels: criterion.levels?.map((level: any) => ({
        code: level.code,
        name: level.name,
        points: level.points,
        description: level.description
      })) || []
    })) || []
  };
}

// Helper function to convert Rubric interface to Zod schema structure
function convertRubricToZodRubric(rubric: Rubric): any {
  return {
    title: rubric.name,
    version: rubric.version,
    description: rubric.description,
    fileType: rubric.fileType,
    totalPoints: rubric.totalMaxPoints,
    locale: 'vi-VN', // Default locale
    scoring: {
      method: 'sum',
      rounding: rubric.rounding
    },
    criteria: rubric.criteria?.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      detectorKey: criterion.detectorKey,
      maxPoints: criterion.maxPoints,
      levels: criterion.levels?.map((level) => ({
        code: level.code,
        name: level.name,
        points: level.points,
        description: level.description
      })) || []
    })) || []
  };
}

// POST /custom-rubrics - Tạo mới custom rubric
export async function createCustomRubricController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const validation = CreateCustomRubricSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid create custom rubric request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Convert the Zod schema structure to the TypeScript interface structure
    const createRequest: CreateCustomRubricRequest = {
      ownerId: validation.data.ownerId,
      name: validation.data.name,
      content: convertZodRubricToRubric(validation.data.content),
      isPublic: validation.data.isPublic
    };
    
    logger.info(`Create custom rubric request: name=${createRequest.name}, ownerId=${createRequest.ownerId}`);
    
    // Tạo custom rubric
    const customRubric = await createCustomRubric(createRequest);
    
    // Convert back to Zod schema structure for response
    const responseRubric = {
      ...customRubric,
      content: convertRubricToZodRubric(customRubric.content)
    };
    
    return c.json({
      success: true,
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      data: responseRubric
    }, HTTP_STATUS.CREATED);
    
  } catch (error) {
    logger.error('Lỗi trong createCustomRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// PUT /custom-rubrics/:id - Cập nhật custom rubric
export async function updateCustomRubricController(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      return c.json({
        success: false,
        message: 'Custom Rubric ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Validate request body
    const validation = UpdateCustomRubricSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid update custom rubric request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Convert the Zod schema structure to the TypeScript interface structure
    const updateRequest: UpdateCustomRubricRequest = {
      name: validation.data.name,
      content: validation.data.content ? convertZodRubricToRubric(validation.data.content) : undefined,
      isPublic: validation.data.isPublic
    };
    
    logger.info(`Update custom rubric request: id=${id}`);
    
    // Cập nhật custom rubric
    const customRubric = await updateCustomRubric(id, updateRequest);
    
    // Convert back to Zod schema structure for response
    const responseRubric = {
      ...customRubric,
      content: convertRubricToZodRubric(customRubric.content)
    };
    
    return c.json({
      success: true,
      message: 'Cập nhật custom rubric thành công',
      data: responseRubric
    });
    
  } catch (error) {
    logger.error('Lỗi trong updateCustomRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// DELETE /custom-rubrics/:id - Xóa custom rubric
export async function deleteCustomRubricController(c: Context) {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: 'Custom Rubric ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Delete custom rubric request: id=${id}`);
    
    // Xóa custom rubric
    await deleteCustomRubric(id);
    
    return c.json({
      success: true,
      message: 'Xóa custom rubric thành công'
    });
    
  } catch (error) {
    logger.error('Lỗi trong deleteCustomRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /custom-rubrics/:id - Lấy chi tiết custom rubric
export async function getCustomRubricController(c: Context) {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: 'Custom Rubric ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Get custom rubric request: id=${id}`);
    
    // Tìm custom rubric
    const customRubric = await findCustomRubricById(id);
    
    if (!customRubric) {
      return c.json({
        success: false,
        message: 'Không tìm thấy custom rubric'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    // Convert Rubric interface to Zod schema structure for response
    const responseRubric = {
      ...customRubric,
      content: convertRubricToZodRubric(customRubric.content)
    };
    
    return c.json({
      success: true,
      message: 'Lấy custom rubric thành công',
      data: responseRubric
    });
    
  } catch (error) {
    logger.error('Lỗi trong getCustomRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /custom-rubrics - Liệt kê custom rubrics của user
export async function listCustomRubricsController(c: Context) {
  try {
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id; // Now correctly typed as number
    
    // Validate query parameters
    const queryValidation = ListCustomRubricsQuerySchema.safeParse({ ownerId: userId });
    if (!queryValidation.success) {
      logger.warn('Invalid list custom rubrics query:', queryValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: queryValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    const query = queryValidation.data as ListCustomRubricsQuery;
    logger.info(`List custom rubrics request: ownerId=${query.ownerId}`);
    
    // Liệt kê custom rubrics
    const customRubrics = await listCustomRubrics(query.ownerId);
    
    // Convert Rubric interface to Zod schema structure for response
    const responseRubrics = customRubrics.map(rubric => ({
      ...rubric,
      content: convertRubricToZodRubric(rubric.content)
    }));
    
    return c.json({
      success: true,
      message: `Tìm thấy ${customRubrics.length} custom rubrics`,
      data: responseRubrics
    });
    
  } catch (error) {
    logger.error('Lỗi trong listCustomRubricsController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /custom-rubrics/validate - Validate custom rubric
export async function validateCustomRubricController(c: Context) {
  try {
    const body = await c.req.json();
    
    if (!body.content) {
      return c.json({
        success: false,
        message: 'Content là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info('Validate custom rubric request');
    
    // Convert Zod schema to Rubric interface for validation
    const rubricContent = convertZodRubricToRubric(body.content);
    
    // Validate rubric
    const validationResult = await validateRubric(rubricContent);
    
    const statusCode = validationResult.isValid ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
    
    return c.json({
      success: validationResult.isValid,
      message: validationResult.isValid ? 'Rubric hợp lệ' : 'Rubric không hợp lệ',
      data: validationResult
    }, statusCode);
    
  } catch (error) {
    logger.error('Lỗi trong validateCustomRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}