/**
 * @file grade.controller.ts
 * @description Controller xử lý chấm điểm file
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { gradeFileService, batchGradeService, getGradeHistory, getGradeResult, deleteGradeResult } from '@services/grade.service';
import { findCustomRubricById } from '@services/customRubric.service';
import { 
  GradeFileApiSchema, 
  CustomGradeApiSchema, 
  GradeHistoryApiSchema,
  type GradeFileApiRequest,
  type CustomGradeApiRequest,
  type GradeHistoryApiQuery
} from '@/schemas/grade-api.schema';

// POST /grade - Chấm điểm file
export async function gradeFileController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const validation = GradeFileApiSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid grade request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    const gradeRequest = {
      ...validation.data,
      userId
    };
    
    logger.info(`Grading request: fileId=${gradeRequest.fileId}, userId=${gradeRequest.userId}`);
    
    // Chấm điểm file
    const gradeResult = await gradeFileService(gradeRequest);
    
    return c.json({
      success: true,
      message: SUCCESS_MESSAGES.GRADING_COMPLETED,
      data: {
        gradeResult: {
          fileId: gradeResult.fileId,
          filename: gradeResult.filename,
          fileType: gradeResult.fileType,
          totalPoints: gradeResult.totalPoints,
          maxPossiblePoints: gradeResult.maxPossiblePoints,
          percentage: gradeResult.percentage,
          byCriteria: gradeResult.byCriteria,
          gradedAt: gradeResult.gradedAt,
          processingTime: gradeResult.processingTime
        },
        database: {
          saved: gradeResult.saved,
          dbId: gradeResult.dbId
        },
        fileCleanup: {
          originalFileDeleted: true,
          reason: 'File được xóa tự động sau khi chấm điểm hoàn thành'
        }
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong gradeFileController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /grade/custom - Chấm điểm với custom rubric
export async function gradeCustomController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const validation = CustomGradeApiSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid custom grade request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    const { rubricId, rubric: inlineRubric, onlyCriteria, files, concurrency } = validation.data;
    
    // Ưu tiên rubricId → lấy từ CustomRubric; nếu không có → dùng inline
    let customRubric: any = null;
    if (rubricId) {
      logger.info(`Sử dụng custom rubric từ DB: ${rubricId}`);
      const dbRubric = await findCustomRubricById(rubricId);
      if (!dbRubric) {
        return c.json({
          success: false,
          message: 'Không tìm thấy custom rubric với ID đã cho'
        }, HTTP_STATUS.NOT_FOUND);
      }
      customRubric = dbRubric.content;
    } else if (inlineRubric) {
      logger.info('Sử dụng inline custom rubric');
      customRubric = inlineRubric;
    } else {
      return c.json({
        success: false,
        message: 'Phải cung cấp rubricId hoặc rubric trong request body'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Xử lý batch grading
    if (files.length > 1) {
      logger.info(`Custom batch grading request: ${files.length} files`);
      
      const batchResult = await batchGradeService({
        files,
        userId, // Now using userId from JWT context
        customRubric,
        onlyCriteria,
        concurrency
      });
      
      return c.json({
        success: true,
        message: SUCCESS_MESSAGES.GRADING_COMPLETED,
        data: {
          batchResult: {
            results: batchResult.results.map(result => ({
              fileId: result.fileId,
              filename: result.filename,
              fileType: result.fileType,
              totalPoints: result.totalPoints,
              maxPossiblePoints: result.maxPossiblePoints,
              percentage: result.percentage,
              byCriteria: result.byCriteria,
              gradedAt: result.gradedAt,
              processingTime: result.processingTime
            })),
            errors: batchResult.errors,
            summary: batchResult.summary
          },
          database: {
            saved: batchResult.results.length,
            total: batchResult.summary.total
          },
          fileCleanup: {
            originalFilesDeleted: true,
            reason: 'Files được xóa tự động sau khi chấm điểm hoàn thành'
          }
        }
      });
    } else {
      // Xử lý single file
      const fileId = files[0];
      logger.info(`Custom grading request: fileId=${fileId}`);
      
      // Chấm điểm file với custom rubric
      const gradeResult = await gradeFileService({
        fileId,
        userId, // Now using userId from JWT context
        customRubric,
        onlyCriteria
      });
      
      return c.json({
        success: true,
        message: SUCCESS_MESSAGES.GRADING_COMPLETED,
        data: {
          gradeResult: {
            fileId: gradeResult.fileId,
            filename: gradeResult.filename,
            fileType: gradeResult.fileType,
            totalPoints: gradeResult.totalPoints,
            maxPossiblePoints: gradeResult.maxPossiblePoints,
            percentage: gradeResult.percentage,
            byCriteria: gradeResult.byCriteria,
            gradedAt: gradeResult.gradedAt,
            processingTime: gradeResult.processingTime
          },
          database: {
            saved: gradeResult.saved,
            dbId: gradeResult.dbId
          },
          fileCleanup: {
            originalFileDeleted: true,
            reason: 'File được xóa tự động sau khi chấm điểm hoàn thành'
          }
        }
      });
    }
  } catch (error) {
    logger.error('Lỗi trong gradeCustomController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /grade/history - Lấy lịch sử chấm điểm của user
export async function getGradeHistoryController(c: Context) {
  try {
    const queryParams = c.req.query();
    
    // Validate query parameters
    const queryValidation = GradeHistoryApiSchema.safeParse(queryParams);
    if (!queryValidation.success) {
      logger.warn('Invalid grade history query:', queryValidation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: queryValidation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    const query = queryValidation.data;
    
    logger.info(`Getting grade history for user ${userId}`);
    logger.debug(`Query parameters: ${JSON.stringify(query)}`);
    
    // Extract filter parameters
    const { limit, offset, fileType, search, dateFrom, dateTo, scoreMin, scoreMax } = query;
    const filters = {
      fileType,
      search,
      dateFrom,
      dateTo,
      scoreMin,
      scoreMax
    };
    
    // Validate date range
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return c.json({
          success: false,
          message: 'Ngày không hợp lệ'
        }, HTTP_STATUS.BAD_REQUEST);
      }
      
      // Check if from date is after to date
      if (fromDate > toDate) {
        return c.json({
          success: false,
          message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'
        }, HTTP_STATUS.BAD_REQUEST);
      }
    }
    
    const history = await getGradeHistory(userId, limit, offset, filters);
    
    // Check if there are results
    if (history.total === 0) {
      // Check if filters were applied
      const hasFilters = fileType || search || dateFrom || dateTo || scoreMin !== undefined || scoreMax !== undefined;
      if (hasFilters) {
        return c.json({
          success: false,
          message: 'Không có kết quả nào phù hợp với bộ lọc đã chọn'
        }, HTTP_STATUS.BAD_REQUEST);
      }
    }
    
    return c.json({
      success: true,
      message: 'Lấy lịch sử chấm điểm thành công',
      data: {
        results: history.results,
        total: history.total,
        limit: query.limit,
        offset: query.offset
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong getGradeHistoryController:', error);
    // Log the full error object for debugging
    logger.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// GET /grade/:id - Lấy chi tiết kết quả chấm điểm
export async function getGradeResultController(c: Context) {
  try {
    const resultId = c.req.param('id');
    
    if (!resultId) {
      return c.json({
        success: false,
        message: 'Result ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    logger.info(`Getting grade result: ${resultId} for user ${userId}`);
    
    const result = await getGradeResult(resultId, userId);
    
    if (!result) {
      return c.json({
        success: false,
        message: 'Không tìm thấy kết quả chấm điểm'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return c.json({
      success: true,
      message: 'Lấy kết quả chấm điểm thành công',
      data: result
    });
    
  } catch (error) {
    logger.error('Lỗi trong getGradeResultController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// DELETE /grade/:id - Xóa kết quả chấm điểm
export async function deleteGradeResultController(c: Context) {
  try {
    const resultId = c.req.param('id');
    
    if (!resultId) {
      return c.json({
        success: false,
        message: 'Result ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    logger.info(`Deleting grade result: ${resultId} for user ${userId}`);
    
    // Delete grade result
    const deletedResult = await deleteGradeResult(resultId, userId);
    
    if (!deletedResult) {
      return c.json({
        success: false,
        message: 'Không tìm thấy kết quả chấm điểm'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return c.json({
      success: true,
      message: 'Xóa kết quả chấm điểm thành công',
      data: deletedResult
    });
    
  } catch (error) {
    logger.error('Lỗi trong deleteGradeResultController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// POST /grade/custom-selective - Chấm điểm chọn lọc với custom rubric
export async function gradeCustomSelectiveController(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate request body
    const validation = CustomGradeApiSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid custom selective grade request:', validation.error);
      return c.json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: validation.error.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    const { rubricId, rubric: inlineRubric, onlyCriteria, files, concurrency } = validation.data;
    
    // Ưu tiên rubricId → lấy từ CustomRubric; nếu không có → dùng inline
    let customRubric: any = null;
    if (rubricId) {
      logger.info(`Sử dụng custom rubric từ DB: ${rubricId}`);
      const dbRubric = await findCustomRubricById(rubricId);
      if (!dbRubric) {
        return c.json({
          success: false,
          message: 'Không tìm thấy custom rubric với ID đã cho'
        }, HTTP_STATUS.NOT_FOUND);
      }
      customRubric = dbRubric.content;
    } else if (inlineRubric) {
      logger.info('Sử dụng inline custom rubric');
      customRubric = inlineRubric;
    } else {
      return c.json({
        success: false,
        message: 'Phải cung cấp rubricId hoặc rubric trong request body'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Xử lý batch grading
    if (files.length > 1) {
      logger.info(`Custom selective batch grading request: ${files.length} files`);
      
      const batchResult = await batchGradeService({
        files,
        userId, // Now using userId from JWT context
        customRubric,
        onlyCriteria,
        concurrency
      });
      
      return c.json({
        success: true,
        message: SUCCESS_MESSAGES.GRADING_COMPLETED,
        data: {
          batchResult: {
            results: batchResult.results.map(result => ({
              fileId: result.fileId,
              filename: result.filename,
              fileType: result.fileType,
              totalPoints: result.totalPoints,
              maxPossiblePoints: result.maxPossiblePoints,
              percentage: result.percentage,
              byCriteria: result.byCriteria,
              gradedAt: result.gradedAt,
              processingTime: result.processingTime
            })),
            errors: batchResult.errors,
            summary: batchResult.summary
          },
          database: {
            saved: batchResult.results.length,
            total: batchResult.summary.total
          },
          fileCleanup: {
            originalFilesDeleted: true,
            reason: 'Files được xóa tự động sau khi chấm điểm hoàn thành'
          }
        }
      });
    } else {
      // Xử lý single file
      const fileId = files[0];
      logger.info(`Custom selective grading request: fileId=${fileId}`);
      
      // Chấm điểm file với custom rubric
      const gradeResult = await gradeFileService({
        fileId,
        userId, // Now using userId from JWT context
        customRubric,
        onlyCriteria
      });
      
      return c.json({
        success: true,
        message: SUCCESS_MESSAGES.GRADING_COMPLETED,
        data: {
          gradeResult: {
            fileId: gradeResult.fileId,
            filename: gradeResult.filename,
            fileType: gradeResult.fileType,
            totalPoints: gradeResult.totalPoints,
            maxPossiblePoints: gradeResult.maxPossiblePoints,
            percentage: gradeResult.percentage,
            byCriteria: gradeResult.byCriteria,
            gradedAt: gradeResult.gradedAt,
            processingTime: gradeResult.processingTime
          },
          database: {
            saved: gradeResult.saved,
            dbId: gradeResult.dbId
          },
          fileCleanup: {
            originalFileDeleted: true,
            reason: 'File được xóa tự động sau khi chấm điểm hoàn thành'
          }
        }
      });
    }
  } catch (error) {
    logger.error('Lỗi trong gradeCustomSelectiveController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}










