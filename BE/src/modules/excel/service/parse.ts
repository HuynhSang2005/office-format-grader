import * as XLSX from 'xlsx';
import type { ParsedExcelData } from '../../../types/domain/excel.ts';

/** Đọc và parse file Excel thành JSON. */
export async function parseExcelFile(filePath: string): Promise<ParsedExcelData> {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const sheetsData: Record<string, any[]> = {};
  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) sheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
  }
  return { sheetNames, sheets: sheetsData };
}
