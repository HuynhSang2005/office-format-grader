/**
 * @file criteria.controller.ts
 * @description Controller xử lý các request liên quan đến criteria và rubric
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { 
  listCriteria, 
  getCriterion, 
  getSupportedCriteria,
  validateRubric, 
  preview,
  loadPresetRubric 
} from '@services/criteria.service';
import { 
  createCriterion as createCriterionService,
  updateCriterion as updateCriterionService,
  deleteCriterion as deleteCriterionService,
  listCriteria as listAllCriteria,
  getCriterionById
} from '@services/criteria-crud.service';
import { 
  CriteriaListQuerySchema, 
  CriteriaPreviewBodySchema, 
  CriteriaValidateBodySchema,
  SupportedCriteriaQuerySchema,
  CreateCriterionSchema
} from '@/schemas/criteria.schema';
import type { Rubric, Criterion, CriterionEvalResult } from '@/types/criteria';

// GET /criteria - List criteria theo query parameters
export async function listCriteriaController(c: Context) {
  try {
    const queryParams = c.req.query();
    
    // If no source is provided, list all criteria (both preset and custom)
    if (!queryParams.source) {
      // Get both preset and custom criteria
      // For preset criteria, if fileType is not provided, we'll get both DOCX and PPTX
      let presetCriteria: Criterion[] = [];
      
      if (queryParams.fileType) {
        // If fileType is provided, get preset criteria for that specific type
        presetCriteria = await listCriteria({ 
          source: 'preset', 
          fileType: queryParams.fileType as any, 
          rubricName: queryParams.rubricName || 'default' 
        });
      } else {
        // If fileType is not provided, get preset criteria for both DOCX and PPTX
        const [docxCriteria, pptxCriteria] = await Promise.all([
          listCriteria({ source: 'preset', fileType: 'DOCX', rubricName: queryParams.rubricName || 'default' }),
          listCriteria({ source: 'preset', fileType: 'PPTX', rubricName: queryParams.rubricName || 'default' })
        ]);
        presetCriteria = [...docxCriteria, ...pptxCriteria];
      }
      
      const customCriteria = await listAllCriteria();
      const allCriteria = [...presetCriteria, ...customCriteria];
      
      return c.json({
        success: true,
        message: `Tìm thấy ${allCriteria.length} criteria`,
        data: {
          criteria: allCriteria,
          query: queryParams,
          total: allCriteria.length
        }
      });
    }
    
    // Handle custom criteria listing - fileType is not required for custom criteria
    if (queryParams.source === 'custom') {
      const customCriteria = await listAllCriteria();
      return c.json({
        success: true,
        message: `Tìm thấy ${customCriteria.length} criteria`,
        data: {
          criteria: customCriteria,
          query: queryParams,
          total: customCriteria.length
        }
      });
    }
    
    // Normalize query parameters when source is 'preset'
    // If source is preset but rubricName is not provided, use 'default'
    const normalizedQueryParams = {
      ...queryParams,
      rubricName: queryParams.source === 'preset' && !queryParams.rubricName ? 'default' : queryParams.rubricName
    };
    
    // Validate query parameters using normalized values
    const queryValidation = CriteriaListQuerySchema.safeParse(normalizedQueryParams);
    if (!queryValidation.success) {
      logger.warn('Invalid criteria list query:', queryValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: queryValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    const query = queryValidation.data;
    logger.info(`Listing criteria: source=${query.source}, fileType=${query.fileType || 'all'}`);
    
    // Convert the query to match the expected type
    const criteria = await listCriteria({
      source: query.source,
      fileType: query.fileType,
      rubricName: query.rubricName
    });
    
    return c.json({
      success: true,
      message: `Tìm thấy ${criteria.length} criteria`,
      data: {
        criteria,
        query,
        total: criteria.length
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong listCriteriaController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /criteria/:id - Get single criterion
export async function getCriterionController(c: Context) {
  try {
    const criterionId = c.req.param('id');
    
    if (!criterionId) {
      return c.json({
        success: false,
        message: 'Criterion ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Getting criterion: ${criterionId}`);
    
    const criterion = await getCriterion(criterionId);
    
    if (!criterion) {
      return c.json({
        success: false,
        message: `Không tìm thấy criterion: ${criterionId}`
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return c.json({
      success: true,
      message: 'Lấy criterion thành công',
      data: criterion
    });
    
  } catch (error) {
    logger.error('Lỗi trong getCriterionController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /criteria/supported - Get supported criteria
export async function getSupportedCriteriaController(c: Context) {
  try {
    const queryParams = c.req.query();
    
    // Validate query parameters
    const queryValidation = SupportedCriteriaQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      logger.warn('Invalid supported criteria query:', queryValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: queryValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    const { fileType, detectorKey } = queryValidation.data;
    logger.info(`Getting supported criteria cho ${fileType || 'all file types'}`);
    
    const supportedCriteria = await getSupportedCriteria(fileType, detectorKey);
    
    return c.json({
      success: true,
      message: `Tìm thấy ${supportedCriteria.length} supported criteria`,
      data: {
        criteria: supportedCriteria,
        fileType,
        detectorKey,
        total: supportedCriteria.length
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong getSupportedCriteriaController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /criteria - Create a new criterion
export async function createCriterionController(c: Context) {
  try {
    const body = await c.req.json();
    
    logger.info('Creating new criterion');
    
    // Validate the request body before creating
    const validation = CreateCriterionSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid create criterion request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Create criterion using the service
    const criterion = await createCriterionService(body);
    
    return c.json({
      success: true,
      message: 'Tạo criterion mới thành công',
      data: criterion
    }, HTTP_STATUS.CREATED);
    
  } catch (error) {
    logger.error('Lỗi trong createCriterionController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// PUT /criteria/:id - Update a criterion
export async function updateCriterionController(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      return c.json({
        success: false,
        message: 'Criterion ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Updating criterion: ${id}`);
    
    // Update criterion using the service
    const criterion = await updateCriterionService(id, body);
    
    return c.json({
      success: true,
      message: 'Cập nhật criterion thành công',
      data: criterion
    });
    
  } catch (error) {
    logger.error('Lỗi trong updateCriterionController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// DELETE /criteria/:id - Delete a criterion
export async function deleteCriterionController(c: Context) {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: 'Criterion ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Deleting criterion: ${id}`);
    
    // Delete criterion using the service
    await deleteCriterionService(id);
    
    return c.json({
      success: true,
      message: 'Xóa criterion thành công'
    });
    
  } catch (error) {
    logger.error('Lỗi trong deleteCriterionController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /criteria/all - List all criteria
export async function listAllCriteriaController(c: Context) {
  try {
    logger.info('Listing all criteria');
    
    // List all criteria using the service
    const criteria = await listAllCriteria();
    
    return c.json({
      success: true,
      message: `Tìm thấy ${criteria.length} criteria`,
      data: {
        criteria,
        total: criteria.length
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong listAllCriteriaController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /criteria/validate - Validate rubric
export async function validateRubricController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const bodyValidation = CriteriaValidateBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      logger.warn('Invalid validate rubric body:', bodyValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: bodyValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    const validateBody = bodyValidation.data;
    
    // Convert the rubric structure to match the expected interface
    const rubric: Rubric = {
      name: validateBody.rubric.title,
      version: validateBody.rubric.version,
      fileType: 'PPTX', // Default, should be determined from context
      totalMaxPoints: validateBody.rubric.totalPoints,
      rounding: validateBody.rubric.scoring.rounding,
      criteria: validateBody.rubric.criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: '', // Not in Zod schema
        detectorKey: criterion.detectorKey as any,
        maxPoints: criterion.maxPoints,
        levels: criterion.levels.map(level => ({
          code: level.code,
          name: level.name,
          points: level.points,
          description: level.description
        }))
      })),
      description: '' // Not in Zod schema
    };
    
    logger.info(`Validating rubric: ${rubric.name}`);
    
    const validationResult = await validateRubric({ rubric });
    
    const statusCode = validationResult.isValid ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
    
    return c.json({
      success: validationResult.isValid,
      message: validationResult.isValid ? 'Rubric hợp lệ' : 'Rubric không hợp lệ',
      data: {
        validation: validationResult,
        rubric: {
          name: rubric.name,
          fileType: rubric.fileType,
          criteriaCount: rubric.criteria.length
        }
      }
    }, statusCode);
    
  } catch (error) {
    logger.error('Lỗi trong validateRubricController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /criteria/preview - Preview criteria evaluation
export async function previewCriteriaController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const bodyValidation = CriteriaPreviewBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      logger.warn('Invalid preview criteria body:', bodyValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: bodyValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    const previewBody = bodyValidation.data;
    
    // Convert the rubric structure to match the expected interface
    const rubric: Rubric = {
      name: previewBody.rubric.title,
      version: previewBody.rubric.version,
      fileType: 'PPTX', // Default, should be determined from context
      totalMaxPoints: previewBody.rubric.totalPoints,
      rounding: previewBody.rubric.scoring.rounding,
      criteria: previewBody.rubric.criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: '', // Not in Zod schema
        detectorKey: criterion.detectorKey as any,
        maxPoints: criterion.maxPoints,
        levels: criterion.levels.map(level => ({
          code: level.code,
          name: level.name,
          points: level.points,
          description: level.description
        }))
      })),
      description: '' // Not in Zod schema
    };
    
    logger.info(`Previewing criteria cho rubric: ${rubric.name}`);
    
    const previewResults: Record<string, CriterionEvalResult> = await preview({
      rubric,
      onlyCriteria: previewBody.onlyCriteria,
      fileId: previewBody.fileId,
      features: previewBody.features
    });
    
    // Tính statistics
    const totalCriteria = Object.keys(previewResults).length;
    const passedCriteria = Object.values(previewResults).filter(r => r.passed).length;
    const totalPoints = Object.values(previewResults).reduce((sum, r) => sum + r.points, 0);
    const maxPossiblePoints = previewBody.onlyCriteria 
      ? rubric.criteria
          .filter(c => previewBody.onlyCriteria!.includes(c.id))
          .reduce((sum, c) => sum + c.maxPoints, 0)
      : rubric.totalMaxPoints;
    
    return c.json({
      success: true,
      message: 'Preview criteria thành công',
      data: {
        results: previewResults,
        statistics: {
          totalCriteria,
          passedCriteria,
          failedCriteria: totalCriteria - passedCriteria,
          totalPoints,
          maxPossiblePoints,
          percentage: maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints * 100).toFixed(1) : '0'
        },
        rubric: {
          name: rubric.name,
          fileType: rubric.fileType
        }
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong previewCriteriaController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}