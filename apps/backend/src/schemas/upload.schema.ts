/**
 * @file upload.schema.ts
 * @description Zod schemas cho upload file
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';

// Schema cho upload request (multipart/form-data)
// Note: Zod doesn't directly validate multipart/form-data, but we can define the expected structure
export const UploadRequestSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size > 0,
    'File là bắt buộc'
  ).refine(
    (file) => file.size <= 52428800, // 50MB limit from APP_CONFIG
    'File quá lớn, vui lòng chọn file nhỏ hơn 50MB'
  ).refine(
    (file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'pptx' || extension === 'docx';
    },
    'Loại file không được hỗ trợ. Chỉ chấp nhận .pptx và .docx'
  )
});

// Schema cho upload success response
export const UploadSuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    fileId: z.string(),
    originalName: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.enum(['PPTX', 'DOCX']).optional(),
    uploadedAt: z.string() // ISO string date
  })
});

// Schema cho upload error response
export const UploadErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.array(z.string()).optional()
});

// Schema cho upload file not found error response
export const UploadFileNotFoundResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

// Export types từ schemas
export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export type UploadSuccessResponse = z.infer<typeof UploadSuccessResponseSchema>;
export type UploadErrorResponse = z.infer<typeof UploadErrorResponseSchema>;
export type UploadFileNotFoundResponse = z.infer<typeof UploadFileNotFoundResponseSchema>;