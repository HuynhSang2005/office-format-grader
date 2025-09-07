/**
 * @file storage.service.ts
 * @description Service quản lý lưu trữ và xử lý file upload
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { APP_CONFIG, METADATA_CLEANUP_CONFIG } from '@/config/constants';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import type { UploadedFile, FileValidationResult } from '@/types/storage.types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Đường dẫn thư mục temp (duy nhất cần thiết)
const TEMP_DIR = path.join(process.cwd(), 'temp');
const METADATA_DIR = path.join(process.cwd(), 'metadata');

// Đảm bảo thư mục temp và metadata tồn tại
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
    logger.debug('Thư mục temp và metadata đã sẵn sàng');
  } catch (error) {
    logger.error('Lỗi khi tạo thư mục:', error);
    throw error;
  }
}

// Lưu metadata của file
async function saveFileMetadata(fileId: string, originalName: string): Promise<void> {
  try {
    const metadataPath = path.join(METADATA_DIR, `${fileId}.json`);
    const metadata = {
      fileId,
      originalName,
      createdAt: new Date().toISOString()
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.debug(`Lưu metadata cho file ${fileId}: ${originalName}`);
  } catch (error) {
    logger.error(`Lỗi khi lưu metadata cho file ${fileId}:`, error);
    throw error;
  }
}

// Đọc metadata của file
async function getFileMetadata(fileId: string): Promise<{ originalName: string } | null> {
  try {
    const metadataPath = path.join(METADATA_DIR, `${fileId}.json`);
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    return {
      originalName: metadata.originalName
    };
  } catch (error) {
    logger.warn(`Không thể đọc metadata cho file ${fileId}:`, error);
    return null;
  }
}

// Xóa metadata của file
async function deleteFileMetadata(fileId: string): Promise<void> {
  try {
    const metadataPath = path.join(METADATA_DIR, `${fileId}.json`);
    await fs.unlink(metadataPath);
    logger.debug(`Xóa metadata cho file ${fileId}`);
  } catch (error) {
    logger.warn(`Không thể xóa metadata cho file ${fileId}:`, error);
  }
}

// Validate file type và size
export async function validateFile(buffer: Buffer, originalName: string): Promise<FileValidationResult> {
  logger.debug(`Đang validate file: ${originalName}`);
  
  try {
    const errors: string[] = [];
    
    // Kiểm tra file size
    if (buffer.length > APP_CONFIG.MAX_FILE_SIZE) {
      errors.push(`File quá lớn: ${(buffer.length / 1024 / 1024).toFixed(1)}MB > ${APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    if (buffer.length === 0) {
      errors.push('File rỗng');
    }
    
    // Kiểm tra extension
    const extension = path.extname(originalName).toLowerCase();
    let fileType: 'PPTX' | 'DOCX' | undefined;
    
    if (extension === '.pptx') {
      fileType = 'PPTX';
    } else if (extension === '.docx') {
      fileType = 'DOCX';
    } else {
      errors.push(`Loại file không được hỗ trợ: ${extension}. Chỉ chấp nhận .pptx và .docx`);
    }
    
    // Kiểm tra ZIP signature (Office files là ZIP)
    if (buffer.length >= 4) {
      const zipSignature = buffer.subarray(0, 4);
      const validSignatures = [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // Standard ZIP
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
        Buffer.from([0x50, 0x4B, 0x07, 0x08])  // Spanned ZIP
      ];
      
      const hasValidSignature = validSignatures.some(sig => zipSignature.equals(sig));
      if (!hasValidSignature) {
        errors.push('File không phải định dạng Office hợp lệ (thiếu ZIP signature)');
      }
    }
    
    // Kiểm tra filename convention (optional warning)
    if (fileType && !APP_CONFIG.FILENAME_PATTERN.test(originalName)) {
      logger.warn(`Tên file không đúng quy ước: ${originalName}`);
    }
    
    const isValid = errors.length === 0;
    
    logger.debug(`File validation: ${isValid ? 'PASS' : 'FAIL'} - ${errors.length} errors`);
    
    return {
      isValid,
      errors,
      fileType
    };
    
  } catch (error) {
    logger.error('Lỗi khi validate file:', error);
    return {
      isValid: false,
      errors: [`Lỗi validation: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

// Lưu file upload tạm thời (cho chấm điểm)
export async function saveTempUploadedFile(
  buffer: Buffer, 
  originalName: string,
  mimeType: string = 'application/octet-stream'
): Promise<UploadedFile> {
  logger.info(`Đang lưu file upload tạm thời: ${originalName} (${(buffer.length / 1024).toFixed(1)} KB)`);
  
  try {
    // Đảm bảo thư mục tồn tại
    await ensureDirectories();
    
    // Validate file trước khi lưu
    const validation = await validateFile(buffer, originalName);
    if (!validation.isValid) {
      throw new Error(`File validation thất bại: ${validation.errors.join(', ')}`);
    }
    
    // Tạo file ID và tên file unique
    const fileId = nanoid();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(TEMP_DIR, fileName);
    
    // Lưu file vào thư mục temp
    await fs.writeFile(filePath, buffer);
    
    // Lưu metadata
    await saveFileMetadata(fileId, originalName);
    
    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName,
      fileName,
      filePath,
      fileSize: buffer.length,
      mimeType,
      uploadedAt: new Date()
    };
    
    logger.info(`Lưu file tạm thời thành công: ${fileName} tại ${filePath}`);
    return uploadedFile;
    
  } catch (error) {
    logger.error(`Lỗi khi lưu file tạm thời ${originalName}:`, error);
    throw error;
  }
}

// Đọc file đã lưu từ thư mục temp
export async function readStoredFile(fileId: string): Promise<Buffer> {
  logger.debug(`Đang đọc stored file: ${fileId}`);
  
  try {
    // Tìm file trong thư mục temp
    const tempFiles = await fs.readdir(TEMP_DIR);
    const tempTargetFile = tempFiles.find(file => file.startsWith(fileId));
    
    if (!tempTargetFile) {
      throw new Error(`Không tìm thấy file với ID: ${fileId}`);
    }
    
    const tempFilePath = path.join(TEMP_DIR, tempTargetFile);
    const buffer = await fs.readFile(tempFilePath);
    logger.debug(`Đọc file từ temp thành công: ${tempTargetFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return buffer;
    
  } catch (error) {
    logger.error(`Lỗi khi đọc file ${fileId}:`, error);
    throw error;
  }
}

// Get đường dẫn file đã lưu từ thư mục temp (thêm mới cho route debug)
export async function getStoredFilePath(fileId: string): Promise<string> {
  logger.debug(`Đang lấy đường dẫn stored file: ${fileId}`);
  
  try {
    // Tìm file trong thư mục temp
    const tempFiles = await fs.readdir(TEMP_DIR);
    const tempTargetFile = tempFiles.find(file => file.startsWith(fileId));
    
    if (!tempTargetFile) {
      throw new Error(`Không tìm thấy file với ID: ${fileId}`);
    }
    
    const tempFilePath = path.join(TEMP_DIR, tempTargetFile);
    logger.debug(`Tìm thấy file path: ${tempFilePath}`);
    return tempFilePath;
    
  } catch (error) {
    logger.error(`Lỗi khi lấy đường dẫn file ${fileId}:`, error);
    throw error;
  }
}

// Xóa file đã lưu từ thư mục temp
export async function deleteStoredFile(fileId: string): Promise<void> {
  logger.info(`Đang xóa stored file: ${fileId}`);
  
  try {
    // Tìm file trong thư mục temp
    const tempFiles = await fs.readdir(TEMP_DIR);
    const tempTargetFile = tempFiles.find(file => file.startsWith(fileId));
    
    if (!tempTargetFile) {
      logger.warn(`File không tồn tại để xóa: ${fileId}`);
      return;
    }
    
    const tempFilePath = path.join(TEMP_DIR, tempTargetFile);
    await fs.unlink(tempFilePath);
    
    // Xóa metadata
    await deleteFileMetadata(fileId);
    
    logger.info(`Xóa file temp thành công: ${tempTargetFile}`);
    
  } catch (error) {
    logger.error(`Lỗi khi xóa file ${fileId}:`, error);
    throw error;
  }
}

// Lưu file tạm trong quá trình xử lý
export async function saveTempFile(buffer: Buffer, prefix: string = 'temp'): Promise<string> {
  logger.debug(`Đang lưu temp file với prefix: ${prefix}`);
  
  try {
    await ensureDirectories();
    
    const tempId = nanoid();
    const tempFileName = `${prefix}_${tempId}`;
    const tempFilePath = path.join(TEMP_DIR, tempFileName);
    
    await fs.writeFile(tempFilePath, buffer);
    
    logger.debug(`Lưu temp file thành công: ${tempFileName}`);
    return tempFilePath;
    
  } catch (error) {
    logger.error('Lỗi khi lưu temp file:', error);
    throw error;
  }
}

// Xóa file tạm
export async function deleteTempFile(tempFilePath: string): Promise<void> {
  try {
    await fs.unlink(tempFilePath);
    logger.debug(`Xóa temp file: ${path.basename(tempFilePath)}`);
  } catch (error) {
    logger.warn(`Lỗi khi xóa temp file ${tempFilePath}:`, error);
  }
}

// Dọn dẹp file tạm cũ (chạy định kỳ)
export async function cleanupTempFiles(olderThanHours: number = 3): Promise<void> {
  logger.info(`Đang dọn dẹp temp files cũ hơn ${olderThanHours} giờ`);
  
  try {
    await ensureDirectories();
    
    const files = await fs.readdir(TEMP_DIR);
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let deletedCount = 0;
    let dbCleanupCount = 0;
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          // Xóa metadata tương ứng
          const fileId = file.split('.')[0];
          await deleteFileMetadata(fileId);
          
          // Xóa bản ghi trong database ungraded_files nếu tồn tại
          try {
            const deletedRecord = await prisma.ungradedFile.delete({
              where: {
                id: fileId
              }
            });
            if (deletedRecord) {
              dbCleanupCount++;
              logger.debug(`Đã xóa bản ghi ungraded_files database cho file: ${fileId}`);
            }
          } catch (dbError) {
            // File có thể không tồn tại trong ungraded_files, điều này là bình thường
            logger.debug(`File ${fileId} không tồn tại trong ungraded_files hoặc đã được xóa trước đó`);
          }
          
          // Xóa bản ghi trong database grade_results nếu tồn tại (trong trường hợp có lỗi)
          try {
            const deletedGradeRecord = await prisma.gradeResult.delete({
              where: {
                id: fileId
              }
            });
            if (deletedGradeRecord) {
              logger.debug(`Đã xóa bản ghi grade_results database cho file: ${fileId}`);
            }
          } catch (dbError) {
            // File có thể không tồn tại trong grade_results, điều này là bình thường
            logger.debug(`File ${fileId} không tồn tại trong grade_results hoặc đã được xóa trước đó`);
          }
          
          deletedCount++;
          logger.debug(`Đã xóa temp file cũ: ${file}`);
        }
      } catch (fileError) {
        logger.warn(`Lỗi khi xử lý file ${file} trong quá trình dọn dẹp:`, fileError);
      }
    }
    
    logger.info(`Dọn dẹp hoàn thành: ${deletedCount} temp files đã xóa, ${dbCleanupCount} bản ghi database đã xóa`);
    
  } catch (error) {
    logger.error('Lỗi khi dọn dẹp temp files:', error);
  }
}

// Dọn dẹp metadata files cũ (chạy định kỳ)
export async function cleanupOldMetadata(): Promise<void> {
  logger.info(`Đang dọn dẹp metadata files cũ hơn ${METADATA_CLEANUP_CONFIG.RETENTION_DAYS} ngày`);
  
  try {
    await ensureDirectories();
    
    const metadataFiles = await fs.readdir(METADATA_DIR);
    const cutoffTime = Date.now() - (METADATA_CLEANUP_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const file of metadataFiles) {
      const filePath = path.join(METADATA_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        
        // Chỉ xóa file metadata nếu cũ hơn thời gian quy định
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.debug(`Đã xóa metadata file cũ: ${file}`);
        }
      } catch (fileError) {
        logger.warn(`Lỗi khi xử lý metadata file ${file} trong quá trình dọn dẹp:`, fileError);
      }
    }
    
    logger.info(`Dọn dẹp metadata hoàn thành: ${deletedCount} metadata files đã xóa`);
    
  } catch (error) {
    logger.error('Lỗi khi dọn dẹp metadata files:', error);
  }
}

// Get file info từ stored file
export async function getFileInfo(fileId: string): Promise<UploadedFile | null> {
  logger.debug(`Đang lấy file info: ${fileId}`);
  
  try {
    // Lấy metadata
    const metadata = await getFileMetadata(fileId);
    if (!metadata) {
      logger.warn(`Không tìm thấy metadata cho file ${fileId}`);
      return null;
    }
    
    // Tìm file trong thư mục temp
    const tempFiles = await fs.readdir(TEMP_DIR);
    const tempTargetFile = tempFiles.find(file => file.startsWith(fileId));
    
    if (!tempTargetFile) {
      return null;
    }
    
    const tempFilePath = path.join(TEMP_DIR, tempTargetFile);
    const stats = await fs.stat(tempFilePath);
    
    const extension = path.extname(tempTargetFile);
    
    return {
      id: fileId,
      originalName: metadata.originalName,
      fileName: tempTargetFile,
      filePath: tempFilePath,
      fileSize: stats.size,
      mimeType: extension === '.pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
                : extension === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/octet-stream',
      uploadedAt: stats.birthtime
    };
    
  } catch (error) {
    logger.error(`Lỗi khi lấy file info ${fileId}:`, error);
    return null;
  }
}

// Get original filename từ stored file
export async function getOriginalFileName(fileId: string): Promise<string> {
  try {
    const metadata = await getFileMetadata(fileId);
    if (metadata) {
      return metadata.originalName;
    }
    
    // Fallback: parse từ filename pattern (cũ)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check in temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    const tempFiles = await fs.readdir(tempDir);
    const tempTargetFile = tempFiles.find(file => file.startsWith(fileId));
    
    if (tempTargetFile) {
      return tempTargetFile;
    }
    
    return `${fileId}.unknown`;
    
  } catch (error) {
    logger.warn(`Không thể lấy original filename cho ${fileId}:`, error);
    return `${fileId}.unknown`;
  }
}