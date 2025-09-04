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
  
  // Thêm header chi tiết tiêu chí nếu có
  if (includeDetails && results.length > 0) {
    const firstResult = results[0];
    const criteriaHeaders = Object.keys(firstResult.byCriteria).map(key => `Tiêu chí: ${key}`);
    headers.push(...criteriaHeaders);
  }
  
  worksheetData.push(headers);
  
  // Data rows
  for (const result of results) {
    const row = [
      result.filename,
      result.fileType,
      result.rubricName,
      result.totalPoints,
      result.maxPossiblePoints,
      `${result.percentage.toFixed(2)}%`,
      result.processingTime,
      result.gradedAt.toISOString()
    ];
    
    // Thêm chi tiết tiêu chí nếu có
    if (includeDetails) {
      const criteriaDetails = Object.values(result.byCriteria).map(criteria => 
        `${criteria.points} (${criteria.level}) - ${criteria.reason}`
      );
      row.push(...criteriaDetails);
    }
    
    worksheetData.push(row);
  }
  
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
    logger.info(`[INFO] Bắt đầu xuất ${data.results.length} kết quả chấm điểm ra Excel`);
    
    // Tạo workbook
    const workbook = utils.book_new();
    workbook.Props = {
      Title: "Kết quả chấm điểm Office",
      Subject: "Kết quả chấm điểm",
      Author: "Office Vibe Code",
      CreatedDate: new Date()
    };
    
    // Tạo worksheet
    const worksheet = createWorksheet(data);
    
    // Thêm worksheet vào workbook
    utils.book_append_sheet(workbook, worksheet, "Kết quả chấm điểm");
    
    // Tạo tên file đầy đủ
    const fullFilename = `${filename}.xlsx`;
    
    // Ghi file
    writeFile(workbook, fullFilename);
    
    logger.info(`[INFO] Đã xuất file Excel thành công: ${fullFilename}`);
    return fullFilename;
  } catch (error) {
    logger.error(`[ERROR] Lỗi khi xuất file Excel:`, error);
    throw new Error(`Không thể xuất file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}