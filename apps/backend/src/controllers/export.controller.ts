import type { Context } from 'hono';
import { exportToExcel } from '@services/excel.service';
import { getGradeResultsByIds } from '@services/grade.service';
import { logger } from '@core/logger';
import type { ExportExcelRequest } from '@/schemas/grade-request.schema';

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
    const { resultIds, includeDetails, groupBy, format } = body;
    
    // Validate format - chỉ hỗ trợ xlsx
    if (format !== 'xlsx') {
      logger.warn(`[WARN] Định dạng export không được hỗ trợ: ${format}`);
      return c.json({ 
        success: false, 
        error: 'Chỉ hỗ trợ export định dạng xlsx' 
      }, 400);
    }
    
    // Lấy kết quả chấm điểm từ DB
    logger.debug(`[DEBUG] Đang lấy ${resultIds.length} kết quả chấm điểm từ DB`);
    const results = await getGradeResultsByIds(resultIds);
    
    if (results.length === 0) {
      logger.warn('[WARN] Không tìm thấy kết quả chấm điểm để export');
      return c.json({ 
        success: false, 
        error: 'Không tìm thấy kết quả chấm điểm để export' 
      }, 404);
    }
    
    // Export ra Excel
    const filename = `export_${new Date().getTime()}`;
    const exportData = {
      results,
      includeDetails,
      groupBy
    };
    
    logger.debug('[DEBUG] Đang export dữ liệu ra Excel');
    const exportedFilename = await exportToExcel(exportData, filename);
    
    // Trả về response thành công
    logger.info(`[INFO] Export Excel thành công: ${exportedFilename}`);
    return c.json({
      success: true,
      filename: exportedFilename,
      resultCount: results.length
    });
  } catch (error) {
    logger.error('[ERROR] Lỗi khi export Excel:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi export Excel' 
    }, 500);
  }
}