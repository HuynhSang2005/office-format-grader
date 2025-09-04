/**
 * @file unzip.schema.ts
 * @description Zod schemas cho chức năng unzip
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';

// Schema cho tùy chọn giải nén
export const extractionOptionsSchema = z.object({
  maxFiles: z.number().optional(),
  maxTotalSize: z.number().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  maxDepth: z.number().optional(),
});

// Schema cho kết quả unzip
export const unzipResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  extractedPath: z.string().optional(),
  fileList: z.array(z.string()).optional(),
});

// Schema cho OpenXML relationship
export const openXMLRelationshipSchema = z.object({
  id: z.string(),
  type: z.string(),
  target: z.string(),
});

// Schema cho cấu trúc file DOCX
export const docxFileStructureSchema = z.object({
  mainDocument: z.string(),
  styles: z.string(),
  numbering: z.string().optional(),
  settings: z.string().optional(),
  headerFooters: z.record(z.string(), z.string()),
  relationships: z.array(openXMLRelationshipSchema),
});

// Schema cho cấu trúc file PPTX
export const pptxFileStructureSchema = z.object({
  presentation: z.string(),
  slides: z.record(z.string(), z.string()),
  slideLayouts: z.record(z.string(), z.string()),
  slideMasters: z.record(z.string(), z.string()),
  theme: z.string(),
  relationships: z.array(openXMLRelationshipSchema),
  headerFooters: z.record(z.string(), z.string()).optional(),
});