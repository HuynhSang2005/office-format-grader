export interface ParsedExcelData {
  sheetNames: string[];
  sheets: {
    [sheetName: string]: any[]; // Mỗi sheet là một array các object
  };
}