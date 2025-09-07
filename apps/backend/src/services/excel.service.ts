/**
 * @file excel.service.ts
 * @description Dịch vụ xử lý xuất kết quả chấm điểm ra file Excel
 * @author Nguyễn Huỳnh Sang
 */

import { utils, writeFile } from 'xlsx';
import type { GradeResult } from '@/types/criteria';
import { logger } from '@core/logger';
import type { ExportExcelRequest } from '@/schemas/grade-request.schema';

/**
 * Interface cho dữ liệu export Excel
 */
export interface ExcelExportData {
  results: GradeResult[];
  includeDetails?: boolean;
  groupBy?: ExportExcelRequest['groupBy'];
}

/**
 * Tạo worksheet từ dữ liệu chấm điểm
 * @param data Dữ liệu export
 * @returns Worksheet object
 */
function createWorksheet(data: ExcelExportData) {
  const { results, includeDetails = true } = data;
  
  // Validate input data
  if (!results || results.length === 0) {
    const error = new Error('Không có dữ liệu để export');
    logger.error('[ERROR] createWorksheet - Không có dữ liệu để export');
    throw error;
  }
  
  logger.debug(`[DEBUG] createWorksheet - Đang xử lý ${results.length} kết quả`);
  
  // Tạo dữ liệu cho worksheet
  const worksheetData: any[][] = [];
  
  // Header row
  const headers = [
    'Tên file',
    'Loại file',
    'Tên rubric',
    'Tổng điểm',
    'Điểm tối đa',
    'Phần trăm',
    'Thời gian xử lý (ms)',
    'Thời gian chấm'
  ];
  
  logger.debug(`[DEBUG] createWorksheet - Header row: ${JSON.stringify(headers)}`);
  
  // Thêm header chi tiết tiêu chí nếu có
  if (includeDetails && results.length > 0) {
    const firstResult = results[0];
    if (firstResult.byCriteria) {
      const criteriaHeaders = Object.keys(firstResult.byCriteria).map(key => `Tiêu chí: ${key}`);
      headers.push(...criteriaHeaders);
      logger.debug(`[DEBUG] createWorksheet - Criteria headers: ${JSON.stringify(criteriaHeaders)}`);
    }
  }
  
  worksheetData.push(headers);
  
  // Data rows
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    logger.debug(`[DEBUG] createWorksheet - Processing result ${i}: ${JSON.stringify(result)}`);
    
    const row = [
      result.filename || '',
      result.fileType || '',
      result.rubricName || 'Default Rubric',
      result.totalPoints || 0,
      result.maxPossiblePoints || 10,
      result.percentage ? `${result.percentage.toFixed(2)}%` : '0%',
      result.processingTime || 0,
      result.gradedAt ? result.gradedAt.toISOString() : new Date().toISOString()
    ];
    
    logger.debug(`[DEBUG] createWorksheet - Base row ${i}: ${JSON.stringify(row)}`);
    
    // Thêm chi tiết tiêu chí nếu có
    if (includeDetails && result.byCriteria) {
      const criteriaDetails = Object.values(result.byCriteria).map(criteria => {
        const detail = `${criteria.points || 0} (${criteria.level || 'unknown'}) - ${criteria.reason || ''}`;
        logger.debug(`[DEBUG] createWorksheet - Criteria detail: ${detail}`);
        return detail;
      });
      row.push(...criteriaDetails);
      logger.debug(`[DEBUG] createWorksheet - Row with criteria ${i}: ${JSON.stringify(row)}`);
    }
    
    worksheetData.push(row);
  }
  
  logger.debug(`[DEBUG] createWorksheet - Worksheet data: ${JSON.stringify(worksheetData)}`);
  
  // Tạo worksheet từ dữ liệu
  const worksheet = utils.aoa_to_sheet(worksheetData);
  return worksheet;
}

/**
 * Xuất kết quả chấm điểm ra file Excel
 * @param data Dữ liệu export
 * @param filename Tên file output (không bao gồm extension)
 * @returns Đường dẫn tới file đã tạo
 */
export async function exportToExcel(data: ExcelExportData, filename: string = 'export_result'): Promise<string> {
  try {
    logger.info(`[INFO] Bắt đầu xuất ${data.results?.length || 0} kết quả chấm điểm ra Excel`);
    
    // Log xlsx library status
    logger.debug(`[DEBUG] xlsx utils available: ${!!utils}`);
    logger.debug(`[DEBUG] xlsx writeFile available: ${!!writeFile}`);
    
    // Validate input data
    if (!data) {
      const error = new Error('Dữ liệu export không hợp lệ: data là null hoặc undefined');
      logger.error('[ERROR] exportToExcel - Dữ liệu export không hợp lệ: data là null hoặc undefined');
      throw error;
    }
    
    if (!data.results) {
      const error = new Error('Dữ liệu export không hợp lệ: data.results là null hoặc undefined');
      logger.error('[ERROR] exportToExcel - Dữ liệu export không hợp lệ: data.results là null hoặc undefined');
      throw error;
    }
    
    if (data.results.length === 0) {
      const error = new Error('Không có dữ liệu để export');
      logger.error('[ERROR] exportToExcel - Không có dữ liệu để export');
      throw error;
    }
    
    logger.debug(`[DEBUG] exportToExcel - Dữ liệu đầu vào hợp lệ, bắt đầu tạo workbook`);
    
    // Tạo workbook
    const workbook = utils.book_new();
    workbook.Props = {
      Title: "Kết quả chấm điểm Office",
      Subject: "Kết quả chấm điểm",
      Author: "Office Vibe Code",
      CreatedDate: new Date()
    };
    
    logger.debug(`[DEBUG] exportToExcel - Đã tạo workbook`);
    
    // Tạo worksheet
    const worksheet = createWorksheet(data);
    
    logger.debug(`[DEBUG] exportToExcel - Đã tạo worksheet`);
    
    // Thêm worksheet vào workbook
    utils.book_append_sheet(workbook, worksheet, "Kết quả chấm điểm");
    
    logger.debug(`[DEBUG] exportToExcel - Đã thêm worksheet vào workbook`);
    
    // Tạo tên file đầy đủ
    const fullFilename = `${filename}.xlsx`;
    
    logger.debug(`[DEBUG] exportToExcel - Tên file đầy đủ: ${fullFilename}`);
    
    // Ghi file
    writeFile(workbook, fullFilename);
    
    logger.info(`[INFO] Đã xuất file Excel thành công: ${fullFilename}`);
    return fullFilename;
  } catch (error) {
    logger.error(`[ERROR] Lỗi khi xuất file Excel:`, error);
    // Log the full error object for debugging
    logger.error('[ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`Không thể xuất file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}