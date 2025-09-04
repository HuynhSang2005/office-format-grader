/**
 * @file batch-grading.test.ts
 * @description Test cases for batch grading functionality
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  saveTempUploadedFile, 
  deleteStoredFile
} from '@services/storage.service';
import { batchGradeService } from '@services/grade.service';

describe('Batch Grading Service', () => {
  const testFileName1 = 'TEST_Student_Buoi1.docx';
  const testFileName2 = 'TEST_Student_Buoi2.pptx';
  
  // Create a simple DOCX file buffer (ZIP signature + minimal content)
  const testBufferDOCX = Buffer.from([
    0x50, 0x4B, 0x03, 0x04, // ZIP signature
    0x14, 0x00, 0x00, 0x00, 0x08, 0x00, // ZIP header
    ...Array.from(Buffer.from('word/document.xml', 'utf8')), // Simple file content
    0x50, 0x4B, 0x01, 0x02, // ZIP central directory signature
    0x14, 0x00, 0x14, 0x00, 0x00, 0x00, // Central directory header
    0x50, 0x4B, 0x05, 0x06, // ZIP end of central directory signature
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00 // End of central directory
  ]);
  
  // Create a simple PPTX file buffer (ZIP signature + minimal content)
  const testBufferPPTX = Buffer.from([
    0x50, 0x4B, 0x03, 0x04, // ZIP signature
    0x14, 0x00, 0x00, 0x00, 0x08, 0x00, // ZIP header
    ...Array.from(Buffer.from('ppt/presentation.xml', 'utf8')), // Simple file content
    0x50, 0x4B, 0x01, 0x02, // ZIP central directory signature
    0x14, 0x00, 0x14, 0x00, 0x00, 0x00, // Central directory header
    0x50, 0x4B, 0x05, 0x06, // ZIP end of central directory signature
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00 // End of central directory
  ]);
  
  let fileId1: string;
  let fileId2: string;
  
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
    
    // Save test files
    const uploadedFile1 = await saveTempUploadedFile(testBufferDOCX, testFileName1);
    const uploadedFile2 = await saveTempUploadedFile(testBufferPPTX, testFileName2);
    
    fileId1 = uploadedFile1.id;
    fileId2 = uploadedFile2.id;
  });
  
  afterEach(async () => {
    // Clean up test files
    try {
      await deleteStoredFile(fileId1);
    } catch (error) {
      // Ignore errors
    }
    
    try {
      await deleteStoredFile(fileId2);
    } catch (error) {
      // Ignore errors
    }
  });
  
  it('should batch grade multiple files', async () => {
    const batchRequest = {
      files: [fileId1, fileId2],
      userId: 1, // Changed from 'test-user-id' to number
      concurrency: 2
    };
    
    const result = await batchGradeService(batchRequest);
    
    expect(result).toBeDefined();
    expect(result.summary.total).toBe(2);
    expect(result.summary.success).toBeGreaterThanOrEqual(0);
    expect(result.summary.failed).toBeLessThanOrEqual(2);
    
    // Check results structure
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    
    // Check errors structure
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    
    // Check summary structure
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.total).toBe('number');
    expect(typeof result.summary.success).toBe('number');
    expect(typeof result.summary.failed).toBe('number');
    expect(typeof result.summary.totalTime).toBe('number');
  });
  
  it('should handle single file in batch', async () => {
    const batchRequest = {
      files: [fileId1],
      userId: 1, // Changed from 'test-user-id' to number
      concurrency: 1
    };
    
    const result = await batchGradeService(batchRequest);
    
    expect(result).toBeDefined();
    expect(result.summary.total).toBe(1);
    expect(result.summary.success).toBeGreaterThanOrEqual(0);
    expect(result.summary.failed).toBeLessThanOrEqual(1);
  });
});