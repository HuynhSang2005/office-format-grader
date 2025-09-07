/**
 * @file upload.controller.ts
 * @description Controller xử lý upload file với hỗ trợ custom rubric và chấm điểm tự động
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { saveTempUploadedFile, validateFile } from '@services/storage.service';
import { gradeFileService } from '@services/grade.service';
import { findCustomRubricById } from '@services/customRubric.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /upload - Upload single file với hỗ trợ custom rubric
export async function uploadFileController(c: Context) {
  try {
    logger.info('Upload request received');
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const customRubricId = formData.get('customRubricId') as string | null;
    
    if (!file) {
      return c.json({
        success: false,
        message: 'Không tìm thấy file trong request'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    logger.info(`Processing upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Validate file
    const validation = await validateFile(buffer, file.name);
    if (!validation.isValid) {
      logger.warn(`File validation failed: ${validation.errors.join(', ')}`);
      return c.json({
        success: false,
        message: 'File validation thất bại',
        errors: validation.errors
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Save file temporarily for grading
    const uploadedFile = await saveTempUploadedFile(buffer, file.name, file.type);
    
    logger.info(`Upload tạm thời thành công: ${uploadedFile.fileName} (ID: ${uploadedFile.id})`);
    
    // Get user ID from JWT context (only if authenticated)
    const user = c.get('user');
    if (!user) {
      logger.warn('Upload yêu cầu xác thực người dùng');
      return c.json({
        success: false,
        message: 'Yêu cầu đăng nhập để upload file',
      }, HTTP_STATUS.UNAUTHORIZED);
    }
    
    const userId = user.id;
    
    // Nếu có custom rubric ID, thực hiện chấm điểm tự động
    if (customRubricId) {
      try {
        logger.info(`Tự động chấm điểm với custom rubric: ${customRubricId}`);
        
        // Lấy custom rubric từ DB
        const customRubric = await findCustomRubricById(customRubricId);
        if (!customRubric) {
          logger.warn(`Không tìm thấy custom rubric: ${customRubricId}`);
          // Trả về response upload thành công nhưng không chấm điểm
          return c.json({
            success: true,
            message: SUCCESS_MESSAGES.FILE_UPLOADED + ' (Không tìm thấy rubric để chấm điểm)',
            data: {
              fileId: uploadedFile.id,
              originalName: uploadedFile.originalName,
              fileName: uploadedFile.fileName,
              fileSize: uploadedFile.fileSize,
              fileType: validation.fileType,
              uploadedAt: uploadedFile.uploadedAt
            }
          });
        }
        
        // Chấm điểm với custom rubric
        const gradeResult = await gradeFileService({
          fileId: uploadedFile.id,
          userId,
          customRubric: customRubric.content
        });
        
        logger.info(`Chấm điểm tự động thành công: ${gradeResult.filename}`);
        
        return c.json({
          success: true,
          message: SUCCESS_MESSAGES.GRADING_COMPLETED,
          data: {
            fileId: gradeResult.fileId,
            originalName: uploadedFile.originalName,
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            fileType: validation.fileType,
            uploadedAt: uploadedFile.uploadedAt,
            gradeResult: {
              totalPoints: gradeResult.totalPoints,
              percentage: gradeResult.percentage,
              processingTime: gradeResult.processingTime,
              dbId: gradeResult.dbId // Add database ID
            }
          }
        });
        
      } catch (gradingError) {
        logger.error('Lỗi khi chấm điểm tự động:', gradingError);
        // Trả về response upload thành công nhưng có lỗi khi chấm điểm
        return c.json({
          success: true,
          message: SUCCESS_MESSAGES.FILE_UPLOADED + ' (Lỗi khi chấm điểm tự động)',
          data: {
            fileId: uploadedFile.id,
            originalName: uploadedFile.originalName,
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            fileType: validation.fileType,
            uploadedAt: uploadedFile.uploadedAt
          }
        });
      }
    }
    
    // Upload thông thường không có chấm điểm tự động
    // Save to database as ungraded file
    const ungradedFile = await prisma.ungradedFile.create({
      data: {
        id: uploadedFile.id,
        filename: uploadedFile.originalName,
        fileType: validation.fileType || 'UNKNOWN',
        fileSize: uploadedFile.fileSize,
        uploadedAt: new Date(uploadedFile.uploadedAt),
        userId: userId
      }
    });
    
    logger.info(`Saved ungraded file to database: ${ungradedFile.id}`);
    
    return c.json({
      success: true,
      message: SUCCESS_MESSAGES.FILE_UPLOADED,
      data: {
        fileId: uploadedFile.id,
        originalName: uploadedFile.originalName,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileType: validation.fileType,
        uploadedAt: uploadedFile.uploadedAt
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong uploadFileController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}