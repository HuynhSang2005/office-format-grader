export interface ParsedExcelData {
  sheetNames: string[];
  sheets: Record<string, any[]>;
}
