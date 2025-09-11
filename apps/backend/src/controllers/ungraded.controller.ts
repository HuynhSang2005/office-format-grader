/**
 * @file ungraded.controller.ts
 * @description Controller xử lý file chưa chấm điểm
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';
import { logger } from '@core/logger';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /ungraded - Lấy danh sách file chưa chấm điểm của user với hỗ trợ phân trang
export async function getUngradedFilesController(c: Context) {
  try {
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    // Get query parameters for pagination
    const queryParams = c.req.query();
    const limit = parseInt(queryParams.limit || '500');
    const offset = parseInt(queryParams.offset || '0');
    
    logger.info(`Getting ungraded files for user ${userId} with limit=${limit}, offset=${offset}`);
    
    const [ungradedFiles, total] = await Promise.all([
      prisma.ungradedFile.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.ungradedFile.count({
        where: { userId }
      })
    ]);
    
    return c.json({
      success: true,
      message: 'Lấy danh sách file chưa chấm điểm thành công',
      data: {
        files: ungradedFiles,
        total,
        limit,
        offset
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong getUngradedFilesController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// DELETE /ungraded/:id - Xóa file chưa chấm điểm
export async function deleteUngradedFileController(c: Context) {
  try {
    const fileId = c.req.param('id');
    
    if (!fileId) {
      return c.json({
        success: false,
        message: 'File ID là bắt buộc'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get user ID from JWT context
    const user = c.get('user');
    const userId = user.id;
    
    logger.info(`Deleting ungraded file: ${fileId} for user ${userId}`);
    
    // Delete from database
    const deletedFile = await prisma.ungradedFile.delete({
      where: {
        id: fileId,
        userId
      }
    });
    
    return c.json({
      success: true,
      message: 'Xóa file chưa chấm điểm thành công',
      data: {
        deletedFile
      }
    });
    
  } catch (error) {
    logger.error('Lỗi trong deleteUngradedFileController:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
    }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}