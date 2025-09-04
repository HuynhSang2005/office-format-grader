/**
 * @file storage.types.ts
 * @description Các kiểu dữ liệu cho chức năng storage
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Interface cho uploaded file
 */
export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Interface cho file validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileType?: 'PPTX' | 'DOCX';
}