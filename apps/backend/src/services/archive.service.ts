/**
 * @file archive.service.ts
 * @description Service giải nén file Office (PPTX/DOCX) an toàn từ ZIP và RAR archives
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import JSZip from 'jszip';
import path from 'path';
import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import os from 'os';
import { createExtractorFromData } from 'node-unrar-js';
import { UnzipResult, ExtractionOptions, DOCXFileStructure, PPTXFileStructure, OpenXMLRelationship } from '@/types/archive.types';
import { parseRelationships as parseDOCXRelationships } from '@/extractors/docx/openxml.util';
import { parsePPTXRelationships } from '@/extractors/pptx/openxml.util';

// Default extraction options
const DEFAULT_OPTIONS: ExtractionOptions = {
  maxFiles: 1000,
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['.xml', '.rels', '.txt', '.json'], // Office file components
  maxDepth: 10
};

// Validate path để tránh directory traversal
function validatePath(filePath: string): boolean {
  // Kiểm tra path không chứa ../ hoặc absolute paths
  const normalizedPath = path.normalize(filePath);
  
  if (normalizedPath.includes('..')) {
    return false;
  }
  
  if (path.isAbsolute(normalizedPath)) {
    return false;
  }
  
  return true;
}

// Validate file trong ZIP
function validateZipEntry(
  fileName: string, 
  fileSize: number, 
  options: ExtractionOptions
): { isValid: boolean; reason?: string } {
  // Kiểm tra path safety
  if (!validatePath(fileName)) {
    return { isValid: false, reason: `Unsafe path detected: ${fileName}` };
  }
  
  // Kiểm tra extension
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    const extension = path.extname(fileName).toLowerCase();
    if (!options.allowedExtensions.includes(extension)) {
      return { isValid: false, reason: `Extension not allowed: ${extension}` };
    }
  }
  
  // Kiểm tra depth
  if (options.maxDepth) {
    const depth = fileName.split('/').length - 1;
    if (depth > options.maxDepth) {
      return { isValid: false, reason: `Path too deep: ${depth} > ${options.maxDepth}` };
    }
  }
  
  return { isValid: true };
}

// Giải nén DOCX file an toàn
export async function extractDOCXSafely(
  fileBuffer: Buffer,
  options: ExtractionOptions = DEFAULT_OPTIONS
): Promise<DOCXFileStructure> {
  logger.info(`Đang giải nén DOCX file an toàn (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  
  try {
    // Validate ZIP signature
    if (fileBuffer.length < 4) {
      throw new Error('File quá nhỏ để là ZIP file');
    }
    
    const zipSignature = fileBuffer.subarray(0, 4);
    const validSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      Buffer.from([0x50, 0x4B, 0x05, 0x06]),
      Buffer.from([0x50, 0x4B, 0x07, 0x08])
    ];
    
    const hasValidSignature = validSignatures.some(sig => zipSignature.equals(sig));
    if (!hasValidSignature) {
      throw new Error('File không có ZIP signature hợp lệ');
    }
    
    // Giải nén file bằng JSZip
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(fileBuffer);
    
    // Khởi tạo cấu trúc DOCX
    const structure: DOCXFileStructure = {
      mainDocument: '',
      styles: '',
      headerFooters: {},
      relationships: []
    };
    
    // Trích xuất các file cần thiết
    const requiredFiles = [
      'word/document.xml',
      'word/styles.xml',
      'word/numbering.xml',
      'word/settings.xml',
      '[Content_Types].xml'
    ];
    
    // Trích xuất các file header/footer
    const headerFooterPattern = /^word\/(header|footer)\d+\.xml$/;
    
    // Trích xuất các file relationships
    const relsPattern = /^_rels\/.*\.rels$/;
    
    let extractedFiles = 0;
    let totalSize = 0;
    
    for (const [filePath, zipEntry] of Object.entries(zipContent.files)) {
      // Validate file entry
      const content = await zipEntry.async('string');
      const contentLength = content.length;
      
      const validation = validateZipEntry(filePath, contentLength, options);
      if (!validation.isValid) {
        logger.warn(`Skipping unsafe file: ${filePath} - ${validation.reason}`);
        continue;
      }
      
      // Check limits
      if (options.maxFiles && extractedFiles >= options.maxFiles) {
        logger.warn(`Reached max files limit: ${options.maxFiles}`);
        break;
      }
      
      if (options.maxTotalSize && (totalSize + contentLength) > options.maxTotalSize) {
        logger.warn(`Reached max total size limit: ${options.maxTotalSize}`);
        break;
      }
      
      // Trích xuất nội dung file
      if (!zipEntry.dir) {
        // Xử lý các file cụ thể
        if (filePath === 'word/document.xml') {
          structure.mainDocument = content;
        } else if (filePath === 'word/styles.xml') {
          structure.styles = content;
        } else if (filePath === 'word/numbering.xml') {
          structure.numbering = content;
        } else if (filePath === 'word/settings.xml') {
          structure.settings = content;
        } else if (headerFooterPattern.test(filePath)) {
          structure.headerFooters[filePath] = content;
        } else if (relsPattern.test(filePath)) {
          // Parse relationships properly
          try {
            const parsedRels = parseDOCXRelationships(content);
            structure.relationships.push(...parsedRels);
          } catch (error) {
            logger.warn(`Không thể parse relationships từ file: ${filePath}`, error);
          }
        }
        
        extractedFiles++;
        totalSize += contentLength;
      }
    }
    
    // Kiểm tra các file bắt buộc
    if (!structure.mainDocument) {
      throw new Error('Không tìm thấy file word/document.xml trong DOCX');
    }
    
    if (!structure.styles) {
      throw new Error('Không tìm thấy file word/styles.xml trong DOCX');
    }
    
    logger.info('Giải nén DOCX thành công');
    return structure;
    
  } catch (error) {
    logger.error('Lỗi khi giải nén DOCX:', error);
    throw new Error(`Không thể giải nén DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Giải nén PPTX file an toàn
export async function extractPPTXSafely(
  fileBuffer: Buffer,
  options: ExtractionOptions = DEFAULT_OPTIONS
): Promise<PPTXFileStructure> {
  logger.info(`Đang giải nén PPTX file an toàn (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  
  try {
    // Validate ZIP signature
    if (fileBuffer.length < 4) {
      throw new Error('File quá nhỏ để là ZIP file');
    }
    
    const zipSignature = fileBuffer.subarray(0, 4);
    const validSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      Buffer.from([0x50, 0x4B, 0x05, 0x06]),
      Buffer.from([0x50, 0x4B, 0x07, 0x08])
    ];
    
    const hasValidSignature = validSignatures.some(sig => zipSignature.equals(sig));
    if (!hasValidSignature) {
      throw new Error('File không có ZIP signature hợp lệ');
    }
    
    // Giải nén file bằng JSZip
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(fileBuffer);
    
    // Khởi tạo cấu trúc PPTX
    const structure: PPTXFileStructure = {
      presentation: '',
      slides: {},
      slideLayouts: {},
      slideMasters: {},
      theme: '',
      relationships: []
    };
    
    // Trích xuất các file cần thiết
    const requiredFiles = [
      'ppt/presentation.xml',
      'ppt/theme/theme1.xml'
    ];
    
    // Patterns cho các loại file
    const slidePattern = /^ppt\/slides\/slide\d+\.xml$/;
    const layoutPattern = /^ppt\/slideLayouts\/slideLayout\d+\.xml$/;
    const masterPattern = /^ppt\/slideMasters\/slideMaster\d+\.xml$/;
    const themePattern = /^ppt\/theme\/theme\d+\.xml$/;
    const headerFooterPattern = /^ppt\/(handoutMasters|notesMasters)\/.*\.xml$/;
    const relsPattern = /^_rels\/.*\.rels$/;
    
    let extractedFiles = 0;
    let totalSize = 0;
    
    for (const [filePath, zipEntry] of Object.entries(zipContent.files)) {
      // Validate file entry
      const content = await zipEntry.async('string');
      const contentLength = content.length;
      
      const validation = validateZipEntry(filePath, contentLength, options);
      if (!validation.isValid) {
        logger.warn(`Skipping unsafe file: ${filePath} - ${validation.reason}`);
        continue;
      }
      
      // Check limits
      if (options.maxFiles && extractedFiles >= options.maxFiles) {
        logger.warn(`Reached max files limit: ${options.maxFiles}`);
        break;
      }
      
      if (options.maxTotalSize && (totalSize + contentLength) > options.maxTotalSize) {
        logger.warn(`Reached max total size limit: ${options.maxTotalSize}`);
        break;
      }
      
      // Trích xuất nội dung file
      if (!zipEntry.dir) {
        // Xử lý các file cụ thể
        if (filePath === 'ppt/presentation.xml') {
          structure.presentation = content;
        } else if (slidePattern.test(filePath)) {
          structure.slides[filePath] = content;
        } else if (layoutPattern.test(filePath)) {
          structure.slideLayouts[filePath] = content;
        } else if (masterPattern.test(filePath)) {
          structure.slideMasters[filePath] = content;
        } else if (themePattern.test(filePath)) {
          structure.theme = content;
        } else if (headerFooterPattern.test(filePath)) {
          if (!structure.headerFooters) {
            structure.headerFooters = {};
          }
          structure.headerFooters[filePath] = content;
        } else if (relsPattern.test(filePath)) {
          // Parse relationships properly
          try {
            const parsedRels = parsePPTXRelationships(content);
            structure.relationships.push(...parsedRels);
          } catch (error) {
            logger.warn(`Không thể parse relationships từ file: ${filePath}`, error);
          }
        }
        
        extractedFiles++;
        totalSize += contentLength;
      }
    }
    
    // Kiểm tra các file bắt buộc
    if (!structure.presentation) {
      throw new Error('Không tìm thấy file ppt/presentation.xml trong PPTX');
    }
    
    if (!structure.theme) {
      throw new Error('Không tìm thấy file theme trong PPTX');
    }
    
    logger.info('Giải nén PPTX thành công');
    return structure;
    
  } catch (error) {
    logger.error('Lỗi khi giải nén PPTX:', error);
    throw new Error(`Không thể giải nén PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generic safe unzip function (cho future use)
export async function extractZipSafely(
  fileBuffer: Buffer,
  options: ExtractionOptions = DEFAULT_OPTIONS
): Promise<UnzipResult> {
  logger.info(`Đang giải nén ZIP file an toàn (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  
  try {
    // Handle empty buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      logger.warn('Empty ZIP buffer provided');
      return {
        success: false,
        error: 'Empty file buffer provided'
      };
    }
    
    // Validate ZIP signature
    if (fileBuffer.length < 4) {
      logger.warn('ZIP buffer too small');
      return {
        success: false,
        error: 'File quá nhỏ để là ZIP file'
      };
    }
    
    const zipSignature = fileBuffer.subarray(0, 4);
    const validSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      Buffer.from([0x50, 0x4B, 0x05, 0x06]),
      Buffer.from([0x50, 0x4B, 0x07, 0x08])
    ];
    
    const hasValidSignature = validSignatures.some(sig => zipSignature.equals(sig));
    if (!hasValidSignature) {
      logger.warn('Invalid ZIP signature');
      return {
        success: false,
        error: 'File không có ZIP signature hợp lệ'
      };
    }
    
    let extractedFiles = 0;
    let totalSize = 0;
    const fileList: string[] = [];
    
    // Giải nén file bằng JSZip
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(fileBuffer);
    
    for (const [filePath, zipEntry] of Object.entries(zipContent.files)) {
      // Validate each file
      const content = await zipEntry.async('string');
      const contentLength = content.length;
      
      const validation = validateZipEntry(filePath, contentLength, options);
      if (!validation.isValid) {
        logger.warn(`Skipping unsafe file: ${filePath} - ${validation.reason}`);
        continue;
      }
      
      // Check limits
      if (options.maxFiles && extractedFiles >= options.maxFiles) {
        logger.warn(`Reached max files limit: ${options.maxFiles}`);
        break;
      }
      
      if (options.maxTotalSize && (totalSize + contentLength) > options.maxTotalSize) {
        logger.warn(`Reached max total size limit: ${options.maxTotalSize}`);
        break;
      }
      
      if (!zipEntry.dir) {
        extractedFiles++;
        totalSize += contentLength;
        fileList.push(filePath);
      }
    }
    
    logger.info(`Giải nén thành công: ${extractedFiles} files (${(totalSize / 1024).toFixed(1)} KB)`);
    
    return {
      success: true,
      fileList,
      extractedPath: '/mock/extracted/path' // TODO: Implement actual path handling
    };
    
  } catch (error) {
    logger.error('Lỗi khi giải nén ZIP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Giải nén RAR file an toàn
export async function extractRarSafely(
  buffer: Buffer,
  options: ExtractionOptions = DEFAULT_OPTIONS
): Promise<UnzipResult> {
  logger.info(`Giải nén RAR file (${(buffer.length / 1024).toFixed(1)} KB)`);

  try {
    // Handle empty buffer
    if (!buffer || buffer.length === 0) {
      logger.warn('Empty RAR buffer provided');
      return {
        success: false,
        error: 'Empty file buffer provided'
      };
    }
    
    // Validate minimum size for RAR
    if (buffer.length < 20) {
      logger.warn('RAR buffer too small');
      return {
        success: false,
        error: 'File quá nhỏ để là RAR file hợp lệ'
      };
    }
    
    // Validate RAR signature (RAR4 and RAR5)
    if (buffer.length >= 7) {
      // RAR5 signature: 0x52 0x61 0x72 0x21 0x1A 0x07 0x01
      const rar5Signature = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01]);
      // RAR4 signature: 0x52 0x61 0x72 0x21 0x1A 0x07 0x00
      const rar4Signature = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]);
      
      const fileSignature = buffer.subarray(0, 7);
      const isRar5 = fileSignature.equals(rar5Signature);
      const isRar4 = fileSignature.equals(rar4Signature);
      
      if (!isRar5 && !isRar4) {
        logger.warn('Invalid RAR signature');
        return {
          success: false,
          error: 'File không có RAR signature hợp lệ'
        };
      }
    }

    // Create temporary file for RAR extraction
    const tempRar = path.join(os.tmpdir(), `upload_${nanoid()}.rar`);
    await fs.writeFile(tempRar, buffer);

    try {
      // Create extractor from the RAR file data
      // Convert to ArrayBuffer explicitly to avoid SharedArrayBuffer type issue
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      const extractor = await createExtractorFromData({ 
        data: arrayBuffer
      });

      // Extract files
      const extracted = extractor.extract();
      const xmlFiles: string[] = [];
      
      // Process extracted files
      for (const file of extracted.files) {
        if (file.fileHeader && !file.fileHeader.flags.directory) {
          const fileName = file.fileHeader.name;
          
          // Validate file entry
          const validation = validateZipEntry(fileName, file.fileHeader.unpSize, options);
          if (!validation.isValid) {
            logger.warn(`Skipping unsafe file: ${fileName} - ${validation.reason}`);
            continue;
          }
          
          // Check if it's an XML file
          if (fileName.endsWith('.xml')) {
            xmlFiles.push(fileName);
          }
        }
      }

      logger.info(`Giải nén RAR hoàn tất: ${xmlFiles.length} XML files`);
      return { success: true, fileList: xmlFiles, extractedPath: '/mock/extracted/path' };

    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempRar);
      } catch (unlinkError) {
        logger.warn(`Không thể xóa temporary file: ${tempRar}`, unlinkError);
      }
    }
  } catch (error) {
    logger.error('Lỗi khi giải nén RAR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Hàm tổng hợp để giải nén cả ZIP và RAR files
export async function extractArchive(
  buffer: Buffer,
  ext: '.zip' | '.rar',
  options: ExtractionOptions = DEFAULT_OPTIONS
): Promise<UnzipResult> {
  // Handle empty buffer
  if (!buffer || buffer.length === 0) {
    logger.warn(`Empty buffer provided for ${ext} extraction`);
    return {
      success: false,
      error: 'Empty file buffer provided'
    };
  }
  
  if (ext === '.rar') {
    return extractRarSafely(buffer, options);
  } else {
    return extractZipSafely(buffer, options);
  }
}

// Validate ZIP file trước khi extract
export async function validateZipFile(fileBuffer: Buffer): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  logger.debug('Đang validate ZIP file');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Kiểm tra minimum size
    if (fileBuffer.length < 22) {
      errors.push('File quá nhỏ để là ZIP file hợp lệ');
    }
    
    // Kiểm tra ZIP signature
    if (fileBuffer.length >= 4) {
      const signature = fileBuffer.subarray(0, 4);
      const validSignatures = [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]),
        Buffer.from([0x50, 0x4B, 0x05, 0x06]),
        Buffer.from([0x50, 0x4B, 0x07, 0x08])
      ];
      
      const hasValidSignature = validSignatures.some(sig => signature.equals(sig));
      if (!hasValidSignature) {
        errors.push('File không có ZIP signature hợp lệ');
      }
    }
    
    // Kiểm tra file size limits
    if (fileBuffer.length > DEFAULT_OPTIONS.maxTotalSize!) {
      warnings.push(`File lớn: ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Kiểm tra cấu trúc ZIP bằng JSZip
    try {
      const zip = new JSZip();
      await zip.loadAsync(fileBuffer);
    } catch (zipError) {
      errors.push(`ZIP structure invalid: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`);
    }
    
    const isValid = errors.length === 0;
    
    logger.debug(`ZIP validation: ${isValid ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)`);
    
    return {
      isValid,
      errors,
      warnings
    };
    
  } catch (error) {
    logger.error('Lỗi khi validate ZIP file:', error);
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings
    };
  }
}

// Validate RAR file trước khi extract
export async function validateRarFile(fileBuffer: Buffer): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  logger.debug('Đang validate RAR file');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Kiểm tra minimum size for RAR
    if (fileBuffer.length < 20) {
      errors.push('File quá nhỏ để là RAR file hợp lệ');
    }
    
    // Kiểm tra RAR signature (RAR4 and RAR5)
    if (fileBuffer.length >= 7) {
      // RAR5 signature: 0x52 0x61 0x72 0x21 0x1A 0x07 0x01
      const rar5Signature = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01]);
      // RAR4 signature: 0x52 0x61 0x72 0x21 0x1A 0x07 0x00
      const rar4Signature = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]);
      
      const fileSignature = fileBuffer.subarray(0, 7);
      const isRar5 = fileSignature.equals(rar5Signature);
      const isRar4 = fileSignature.equals(rar4Signature);
      
      if (!isRar5 && !isRar4) {
        errors.push('File không có RAR signature hợp lệ');
      }
    }
    
    // Kiểm tra file size limits
    if (fileBuffer.length > DEFAULT_OPTIONS.maxTotalSize!) {
      warnings.push(`File lớn: ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Kiểm tra cấu trúc RAR bằng node-unrar-js
    try {
      // Convert to ArrayBuffer explicitly to avoid SharedArrayBuffer type issue
      const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
      await createExtractorFromData({ 
        data: arrayBuffer
      });
    } catch (rarError) {
      errors.push(`RAR structure invalid: ${rarError instanceof Error ? rarError.message : 'Unknown error'}`);
    }
    
    const isValid = errors.length === 0;
    
    logger.debug(`RAR validation: ${isValid ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)`);
    
    return {
      isValid,
      errors,
      warnings
    };
    
  } catch (error) {
    logger.error('Lỗi khi validate RAR file:', error);
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings
    };
  }
}
