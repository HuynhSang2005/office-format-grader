/**
 * @file filenamePreservation.test.ts
 * @description Test cases for filename preservation
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  saveTempUploadedFile, 
  getOriginalFileName,
  deleteStoredFile
} from '@services/storage.service';

describe('Filename Preservation', () => {
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
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const metadataDir = path.join(process.cwd(), 'metadata');
    
    try {
      const tempFiles = await fs.readdir(tempDir);
      for (const file of tempFiles) {
        if (file.includes('TEST_Student')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
      
      const uploadFiles = await fs.readdir(uploadsDir);
      for (const file of uploadFiles) {
        if (file.includes('TEST_Student')) {
          await fs.unlink(path.join(uploadsDir, file));
        }
      }
      
      const metadataFiles = await fs.readdir(metadataDir);
      for (const file of metadataFiles) {
        if (file.includes('TEST_Student')) {
          await fs.unlink(path.join(metadataDir, file));
        }
      }
    } catch (error) {
      // Ignore errors if directories don't exist
    }
  });
  
  afterEach(async () => {
    // Clean up after tests
    // No need to call beforeEach here
  });
  
  it('should preserve original filename when saving to temp storage', async () => {
    const uploadedFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    expect(uploadedFile).toBeDefined();
    expect(uploadedFile.originalName).toBe(testFileName);
    expect(uploadedFile.fileSize).toBe(testBuffer.length);
    expect(uploadedFile.filePath).toContain('temp');
    
    // Verify file exists
    const fileExists = await fs.access(uploadedFile.filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
  
  it('should retrieve original filename correctly', async () => {
    // Save file
    const uploadedFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    // Retrieve original filename
    const originalName = await getOriginalFileName(uploadedFile.id);
    
    expect(originalName).toBe(testFileName);
  });
  
  it('should delete metadata when deleting file', async () => {
    // Save file
    const uploadedFile = await saveTempUploadedFile(testBuffer, testFileName);
    
    // Verify metadata exists
    const metadataPath = path.join(process.cwd(), 'metadata', `${uploadedFile.id}.json`);
    const metadataExistsBefore = await fs.access(metadataPath).then(() => true).catch(() => false);
    expect(metadataExistsBefore).toBe(true);
    
    // Delete file
    await deleteStoredFile(uploadedFile.id);
    
    // Verify metadata is deleted
    const metadataExistsAfter = await fs.access(metadataPath).then(() => true).catch(() => false);
    expect(metadataExistsAfter).toBe(false);
  });
});