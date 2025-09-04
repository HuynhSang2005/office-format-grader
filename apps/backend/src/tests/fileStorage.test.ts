/**
 * @file fileStorage.test.ts
 * @description Test cases for file storage workflow
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  saveTempUploadedFile, 
  readStoredFile, 
  deleteStoredFile,
  getFileInfo
} from '@services/storage.service';

describe('File Storage Service', () => {
  const testFileName = 'TEST_Student_Buoi1.docx';
  // Create a simple DOCX file buffer (ZIP signature + minimal content)
  const testBuffer = Buffer.from([
    0x50, 0x4B, 0x03, 0x04, // ZIP signature
    0x14, 0x00, 0x00, 0x00, 0x08, 0x00, // ZIP header
    ...Array.from(Buffer.from('word/document.xml', 'utf8')), // Simple file content
    0x50, 0x4B, 0x01, 0x02, // ZIP central directory signature
    0x14, 0x00, 0x14, 0x00, 0x00, 0x00, // Central directory header
    0x50, 0x4B, 0x05, 0x06, // ZIP end of central directory signature
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00 // End of central directory
  ]);
  
  beforeEach(async () => {
    // Clean up any existing test files
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
      const tempFiles = await fs.readdir(tempDir);
      for (const file of tempFiles) {
        if (file.startsWith('test-') || file.includes('TEST_Student')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (error) {
      // Ignore errors if directories don't exist
    }
  });
  
  afterEach(async () => {
    // Clean up after tests by calling beforeEach directly
    await new Promise(resolve => setTimeout(resolve, 0)); // Small delay to avoid conflicts
  });
  
  it('should save file to temp storage', async () => {
    const uploadedFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    expect(uploadedFile).toBeDefined();
    expect(uploadedFile.originalName).toBe(testFileName);
    expect(uploadedFile.fileSize).toBe(testBuffer.length);
    expect(uploadedFile.filePath).toContain('temp');
    
    // Verify file exists
    const fileExists = await fs.access(uploadedFile.filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
  
  it('should read stored file from temp', async () => {
    // Save to temp
    const tempFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    // Read file
    const readBuffer = await readStoredFile(tempFile.id);
    expect(readBuffer).toBeDefined();
  });
  
  it('should delete stored file from temp', async () => {
    // Save to temp
    const tempFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    // Verify file exists
    const tempFileExists = await fs.access(tempFile.filePath).then(() => true).catch(() => false);
    expect(tempFileExists).toBe(true);
    
    // Delete file
    await deleteStoredFile(tempFile.id);
    
    // Verify file no longer exists
    const tempFileStillExists = await fs.access(tempFile.filePath).then(() => true).catch(() => false);
    expect(tempFileStillExists).toBe(false);
  });
  
  it('should get file info', async () => {
    // Save to temp
    const tempFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    // Get file info
    const fileInfo = await getFileInfo(tempFile.id);
    
    expect(fileInfo).toBeDefined();
    expect(fileInfo?.id).toBe(tempFile.id);
    expect(fileInfo?.fileSize).toBe(testBuffer.length);
    expect(fileInfo?.filePath).toContain('temp');
  });
});