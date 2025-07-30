import * as XLSX from 'xlsx';
import type { ParsedExcelData } from '../../types/excel.types';


export async function parseExcelFile(filePath: string): Promise<ParsedExcelData> {
  try {
    // Đọc file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const sheetsData: { [sheetName: string]: any[] } = {};

    // Lặp qua từng sheet và chuyển đổi thành JSON
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      // Chuyển đổi sheet thành một mảng các object JSON
      if (worksheet) {
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        sheetsData[sheetName] = jsonData;
      }
    }

    return {
      sheetNames: sheetNames,
      sheets: sheetsData,
    };
  } catch (error) {
    console.error(`Lỗi khi phân tích file Excel tại ${filePath}:`, error);
    throw new Error('Không thể phân tích file Excel.');
  }
}