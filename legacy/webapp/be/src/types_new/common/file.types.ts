/**
 * File handling and processing types
 */

/**
 * File type enumeration
 */
export enum FileType {
  DOCX = "docx",
  PPTX = "pptx", 
  XLSX = "xlsx",
  PDF = "pdf",
  JSON = "json",
  XML = "xml",
  TXT = "txt",
}

/**
 * MIME type mappings
 */
export const MIME_TYPES = {
  [FileType.DOCX]: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  [FileType.PPTX]: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  [FileType.XLSX]: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  [FileType.PDF]: "application/pdf",
  [FileType.JSON]: "application/json",
  [FileType.XML]: "application/xml",
  [FileType.TXT]: "text/plain",
} as const;

/**
 * File validation rules
 */
export interface FileValidationRules {
  maxSize?: number; // in bytes
  allowedTypes?: FileType[];
  allowedMimeTypes?: string[];
  requireExtension?: boolean;
}

/**
 * File metadata extracted from Office documents
 */
export interface FileMetadata {
  filename: string;
  size: number;
  type: FileType;
  mimeType: string;
  lastModified?: Date;
  created?: Date;
  author?: string;
  title?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
  language?: string;
  revision?: number;
  wordCount?: number;
  pageCount?: number;
  slideCount?: number;
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  extractText?: boolean;
  extractImages?: boolean;
  extractMetadata?: boolean;
  preserveFormatting?: boolean;
  includeHiddenContent?: boolean;
  parseStructure?: boolean;
}

/**
 * File extraction result
 */
export interface FileExtractionResult {
  text?: string;
  html?: string;
  structure?: any;
  metadata?: FileMetadata;
  images?: ImageInfo[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Image information from documents
 */
export interface ImageInfo {
  id: string;
  name?: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  data?: Buffer;
  caption?: string;
}

/**
 * Temporary file cleanup info
 */
export interface TempFileCleanup {
  path: string;
  createdAt: Date;
  shouldCleanupAt: Date;
  isProcessing: boolean;
}

/**
 * File upload progress
 */
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
  remainingTime?: number; // in seconds
}

/**
 * File processing statistics
 */
export interface FileProcessingStats {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  errorsByType: Record<string, number>;
}

/**
 * Archive (ZIP) entry information
 */
export interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressed: boolean;
  isDirectory: boolean;
  lastModified?: Date;
}

/**
 * Office document structure information
 */
export interface DocumentStructure {
  hasStyles: boolean;
  hasImages: boolean;
  hasTables: boolean;
  hasHeaders: boolean;
  hasFooters: boolean;
  hasHyperlinks: boolean;
  hasComments: boolean;
  hasRevisions: boolean;
  languages?: string[];
  sections?: number;
}

/**
 * File conversion options
 */
export interface FileConversionOptions {
  targetFormat: FileType;
  quality?: "low" | "medium" | "high";
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  compression?: boolean;
}

/**
 * File sanitization result
 */
export interface FileSanitizationResult {
  originalName: string;
  sanitizedName: string;
  changes: string[];
  isValid: boolean;
  errors: string[];
}