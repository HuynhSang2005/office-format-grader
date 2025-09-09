import { promises as fs } from "fs";
import path from "path";
import os from "os";

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    size: number;
    extension: string;
    mimeType: string;
  };
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  maxSize?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  createTempDir?: boolean;
  preserveOriginalName?: boolean;
}

/**
 * Temporary file info
 */
export interface TempFileInfo {
  path: string;
  originalName: string;
  sanitizedName: string;
  size: number;
  extension: string;
  directory: string;
}

/**
 * MIME type mappings for common file types
 */
const MIME_TYPE_MAP: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

/**
 * Default file processing options
 */
const DEFAULT_OPTIONS: FileProcessingOptions = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: [".docx", ".pptx"],
  createTempDir: true,
  preserveOriginalName: false,
};

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(filename: string, options?: { maxLength?: number; preserveExtension?: boolean }): string {
  const { maxLength = 255, preserveExtension = true } = options || {};
  
  // Get file extension
  const extension = preserveExtension ? path.extname(filename) : "";
  const nameWithoutExt = preserveExtension ? path.basename(filename, extension) : filename;
  
  // Remove or replace dangerous characters
  let sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe characters with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .trim();
  
  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = "file";
  }
  
  // Truncate if too long (accounting for extension)
  const maxNameLength = maxLength - extension.length;
  if (sanitized.length > maxNameLength) {
    sanitized = sanitized.substring(0, maxNameLength);
  }
  
  return sanitized + extension;
}

/**
 * Validate file based on size, type, and content
 */
export function validateFile(file: File, options: FileProcessingOptions = {}): FileValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      size: file.size,
      extension: path.extname(file.name).toLowerCase(),
      mimeType: file.type,
    },
  };

  // Validate file size
  if (opts.maxSize && file.size > opts.maxSize) {
    result.isValid = false;
    result.errors.push(`File size ${file.size} bytes exceeds maximum allowed size ${opts.maxSize} bytes`);
  }

  // Validate file extension
  if (opts.allowedExtensions && !opts.allowedExtensions.includes(result.metadata.extension)) {
    result.isValid = false;
    result.errors.push(`File extension ${result.metadata.extension} is not allowed. Allowed: ${opts.allowedExtensions.join(", ")}`);
  }

  // Validate MIME type
  if (opts.allowedMimeTypes && !opts.allowedMimeTypes.includes(file.type)) {
    result.isValid = false;
    result.errors.push(`MIME type ${file.type} is not allowed. Allowed: ${opts.allowedMimeTypes.join(", ")}`);
  }

  // Check if file is empty
  if (file.size === 0) {
    result.isValid = false;
    result.errors.push("File is empty");
  }

  // Validate MIME type matches extension
  const expectedMimeType = MIME_TYPE_MAP[result.metadata.extension];
  if (expectedMimeType && file.type && file.type !== expectedMimeType) {
    result.warnings.push(`MIME type ${file.type} does not match expected type ${expectedMimeType} for extension ${result.metadata.extension}`);
  }

  // Check for suspicious filenames
  const suspiciousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.com$/i];
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    result.isValid = false;
    result.errors.push("Potentially malicious file type detected");
  }

  return result;
}

/**
 * Create temporary directory
 */
export async function createTempDirectory(prefix: string = "office-grader-"): Promise<string> {
  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    return tempDir;
  } catch (error: any) {
    throw new Error(`Failed to create temporary directory: ${error.message}`);
  }
}

/**
 * Save file to temporary location
 */
export async function saveFileTemporarily(
  file: File,
  options: FileProcessingOptions = {}
): Promise<TempFileInfo> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate file first
  const validation = validateFile(file, opts);
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(", ")}`);
  }

  // Create temporary directory if needed
  let tempDir: string;
  if (opts.createTempDir) {
    tempDir = await createTempDirectory();
  } else {
    tempDir = os.tmpdir();
  }

  // Sanitize filename
  const sanitizedName = opts.preserveOriginalName 
    ? file.name 
    : sanitizeFilename(file.name);

  // Create full path
  const filePath = path.join(tempDir, sanitizedName);

  try {
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return {
      path: filePath,
      originalName: file.name,
      sanitizedName,
      size: file.size,
      extension: path.extname(file.name).toLowerCase(),
      directory: tempDir,
    };
  } catch (error: any) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {} // Ignore cleanup errors
    
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

/**
 * Cleanup temporary files and directories
 */
export async function cleanupTempFiles(paths: string | string[]): Promise<void> {
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  
  const cleanupPromises = pathsArray.map(async (filePath) => {
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      // Log but don't throw - cleanup should be best effort
      console.warn(`Failed to cleanup ${filePath}:`, error);
    }
  });

  await Promise.allSettled(cleanupPromises);
}

/**
 * Get file information without loading content
 */
export async function getFileInfo(filePath: string): Promise<{
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  lastModified: Date;
  isReadable: boolean;
}> {
  try {
    const stat = await fs.stat(filePath);
    const name = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPE_MAP[extension] || "application/octet-stream";

    // Check if file is readable
    let isReadable = true;
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch {
      isReadable = false;
    }

    return {
      name,
      size: stat.size,
      extension,
      mimeType,
      lastModified: stat.mtime,
      isReadable,
    };
  } catch (error: any) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

/**
 * Check if file exists and is accessible
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Get directory size
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        totalSize += await getDirectorySize(itemPath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (error) {
    console.warn(`Failed to calculate directory size for ${dirPath}:`, error);
  }

  return totalSize;
}

/**
 * Generate unique filename if file already exists
 */
export async function generateUniqueFilename(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const nameWithoutExt = path.basename(filePath, ext);

  let counter = 1;
  let newFilePath: string;

  do {
    newFilePath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
    counter++;
  } while (await fileExists(newFilePath));

  return newFilePath;
}

/**
 * File utilities collection
 */
export const FileUtils = {
  sanitizeFilename,
  validateFile,
  createTempDirectory,
  saveFileTemporarily,
  cleanupTempFiles,
  getFileInfo,
  fileExists,
  ensureDirectoryExists,
  getDirectorySize,
  generateUniqueFilename,

  /**
   * Get file extension from filename or MIME type
   */
  getExtensionFromMimeType: (mimeType: string): string => {
    const entry = Object.entries(MIME_TYPE_MAP).find(([_, mime]) => mime === mimeType);
    return entry ? entry[0] : "";
  },

  /**
   * Get MIME type from file extension
   */
  getMimeTypeFromExtension: (extension: string): string => {
    return MIME_TYPE_MAP[extension.toLowerCase()] || "application/octet-stream";
  },

  /**
   * Check if file type is supported
   */
  isSupportedFileType: (filename: string): boolean => {
    const extension = path.extname(filename).toLowerCase();
    return DEFAULT_OPTIONS.allowedExtensions?.includes(extension) || false;
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  },

  /**
   * Get MIME type constants
   */
  MIME_TYPES: MIME_TYPE_MAP,

  /**
   * Default options
   */
  DEFAULT_OPTIONS,
};