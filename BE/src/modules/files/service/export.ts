import { exportDetailsToExcel, generateExcelBuffer } from '../../../shared/excel/exporter.ts';

/**
 * Xuất dữ liệu phân tích sang Excel.
 */
export async function exportAnalysis(parsed: unknown, filename: string) {
  const empty = { totalAchievedScore: 0, totalMaxScore: 0, details: [] };
  const workbook = exportDetailsToExcel(empty as any, parsed as any, filename);
  const buffer = await generateExcelBuffer(workbook);
  return {
    type: 'excel' as const,
    buffer,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename,
  };
}
