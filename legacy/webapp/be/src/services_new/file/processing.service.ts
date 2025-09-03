import { logger } from '../../utils_new/logger.utils';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * File Processing Service
 * Handles file operations, validation, and temporary file management
 */
export class FileProcessingService {
  
  /**
   * Validate uploaded file format and size
   */
  async validateFile(file: File, allowedExtensions: string[]): Promise<boolean> {
    try {
      const extension = path.extname(file.name).toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        throw new Error(`Unsupported file format: ${extension}`);
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large (max 50MB)');
      }

      logger.info('File validation successful', {
        fileName: file.name,
        extension,
        size: file.size
      });

      return true;
    } catch (error) {
      logger.error('File validation failed', { 
        fileName: file.name,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Save uploaded file to temporary directory
   */
  async saveToTempDirectory(file: File, prefix: string = 'office-grader-'): Promise<{
    filePath: string;
    tempDir: string;
    cleanup: () => Promise<void>;
  }> {
    try {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
      const sanitizedName = this.sanitizeFilename(file.name);
      const filePath = path.join(tempDir, sanitizedName);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      logger.info('File saved to temporary directory', {
        fileName: file.name,
        filePath,
        tempDir
      });

      const cleanup = async () => {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          logger.info('Temporary directory cleaned up', { tempDir });
        } catch (error) {
          logger.error('Failed to cleanup temporary directory', { 
            tempDir, 
            error: error.message 
          });
        }
      };

      return { filePath, tempDir, cleanup };
    } catch (error) {
      logger.error('Error saving file to temporary directory', { 
        fileName: file.name,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Scan and analyze file structure
   */
  async scanFileStructure(filePath: string): Promise<any> {
    try {
      logger.info('Scanning file structure', { filePath });

      // Implementation will be moved from existing fileScanner
      throw new Error('File scanning implementation pending');
      
    } catch (error) {
      logger.error('Error scanning file structure', { 
        filePath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get file metadata and properties
   */
  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(filePath).toLowerCase(),
        basename: path.basename(filePath)
      };
    } catch (error) {
      logger.error('Error getting file metadata', { 
        filePath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Sanitize filename for safe file operations
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  }
}