import * as ExcelJS from 'exceljs';

/**
 * @note Stub tạo workbook từ dữ liệu.
 */
export function exportDetailsToExcel(result: any, parsed: any, filename: string) {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Sheet1').addRow([JSON.stringify(parsed)]);
  return wb;
}

/**
 * Trả về buffer Excel từ workbook.
 */
export async function generateExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
