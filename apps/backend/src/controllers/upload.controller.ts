/**
 * @file upload.controller.ts
 * @description Controller xử lý upload file
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { saveTempUploadedFile, validateFile } from '@services/storage.service';

// POST /upload - Upload single file
export async function uploadFileController(c: Context) {
  try {
    logger.info('Upload request received');
    
    // Get form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
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