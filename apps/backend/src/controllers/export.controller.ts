import type { Context } from 'hono';
import { exportToExcel } from '@services/excel.service';
import { getGradeResultsByIds } from '@services/grade.service';
import { logger } from '@core/logger';
import type { ExportExcelRequest } from '@/schemas/grade-request.schema';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

/**
 * Controller xử lý export kết quả chấm điểm ra Excel
 * @param c Context từ Hono
 * @returns Response với file Excel
 */
export async function exportExcelController(c: Context) {
  try {
    logger.info('[INFO] Nhận yêu cầu export kết quả chấm điểm ra Excel');
    
    // Get validated request body from context (validated by zod middleware)
    // @ts-ignore - Temporary fix for type issue with zod-validator
    const body = c.req.valid('json') as ExportExcelRequest;
    
    // Validate that body exists
    if (!body) {
      logger.warn('[WARN] Request body is missing or invalid');
      return c.json({ 
        success: false, 
        error: 'Dữ liệu request không hợp lệ' 
      }, 400);
    }
    
    // Safely destructure the body with default values
    const { 
      resultIds = [], 
      includeDetails = true, 
      groupBy = 'none', 
      format = 'xlsx' 
    } = body;
    
    logger.debug(`[DEBUG] Request body: ${JSON.stringify({ resultIds, includeDetails, groupBy, format })}`);
    
    // Validate format - chỉ hỗ trợ xlsx
    if (format !== 'xlsx') {
      logger.warn(`[WARN] Định dạng export không được hỗ trợ: ${format}`);
      return c.json({ 
        success: false, 
        error: 'Chỉ hỗ trợ export định dạng xlsx' 
      }, 400);
    }
    
    // Validate resultIds
    if (!resultIds || resultIds.length === 0) {
      logger.warn('[WARN] Không có resultIds được cung cấp');
      return c.json({ 
        success: false, 
        error: 'Không có kết quả chấm điểm nào được chọn để export' 
      }, 400);
    }
    
    // Lấy kết quả chấm điểm từ DB
    logger.debug(`[DEBUG] Đang lấy ${resultIds.length} kết quả chấm điểm từ DB`);
    const results = await getGradeResultsByIds(resultIds);
    
    logger.debug(`[DEBUG] Đã lấy được ${results.length} kết quả từ DB`);
    
    if (results.length === 0) {
      logger.warn('[WARN] Không tìm thấy kết quả chấm điểm để export');
      return c.json({ 
        success: false, 
        error: 'Không tìm thấy kết quả chấm điểm để export' 
      }, 404);
    }
    
    // Log sample data for debugging
    logger.debug(`[DEBUG] Sample result data: ${JSON.stringify(results[0], null, 2)}`);
    
    // Export ra Excel
    const filename = `export_${new Date().getTime()}`;
    const exportData = {
      results,
      includeDetails,
      groupBy
    };
    
    logger.debug(`[DEBUG] Đang export ${results.length} dữ liệu ra Excel với cấu hình: ${JSON.stringify({ includeDetails, groupBy })}`);
    const exportedFilename = await exportToExcel(exportData, filename);
    
    logger.debug(`[DEBUG] Đã tạo file export: ${exportedFilename}`);
    
    // Check if file exists
    if (!existsSync(exportedFilename)) {
      logger.error(`[ERROR] File export không tồn tại: ${exportedFilename}`);
      return c.json({ 
        success: false, 
        error: 'Không thể tạo file export' 
      }, 500);
    }
    
    // Read file and return as blob
    const fileBuffer = await readFile(exportedFilename);
    
    logger.debug(`[DEBUG] Đã đọc file buffer với kích thước: ${fileBuffer.length} bytes`);
    
    // Convert to Uint8Array to avoid type issues
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Trả về response với file Excel
    logger.info(`[INFO] Export Excel thành công: ${exportedFilename}`);
    
    // Clean up temporary file after sending
    try {
      await unlink(exportedFilename);
      logger.debug(`[DEBUG] Đã xóa file tạm: ${exportedFilename}`);
    } catch (cleanupError) {
      logger.warn(`[WARN] Không thể xóa file tạm: ${exportedFilename}`, cleanupError);
    }
    
    return c.newResponse(uint8Array, 200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`
    });
  } catch (error) {
    logger.error('[ERROR] Lỗi khi export Excel:', error);
    // Log the full error object for debugging
    logger.error('[ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi export Excel' 
    }, 500);
  }
}