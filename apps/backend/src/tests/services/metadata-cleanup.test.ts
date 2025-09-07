/**
 * @file metadata-cleanup.test.ts
 * @description Unit tests cho metadata cleanup functionality
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanupOldMetadata } from '@services/storage.service';
import { logger } from '@core/logger';
import fs from 'fs/promises';
import path from 'path';

describe('Metadata Cleanup Service', () => {
  const metadataDir = path.join(process.cwd(), 'metadata');
  const testMetadataFiles: string[] = [];
  
  beforeEach(async () => {
    // Clear mock calls
    vi.clearAllMocks();
    
    // Create test metadata directory if it doesn't exist
    try {
      await fs.mkdir(metadataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Clear any existing test files
    const files = await fs.readdir(metadataDir);
    for (const file of files) {
      if (file.startsWith('test_')) {
        await fs.unlink(path.join(metadataDir, file));
      }
    }
    
    // Create test metadata files
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Create a recent file (should not be deleted)
    const recentFile = path.join(metadataDir, 'test_recent.json');
    await fs.writeFile(recentFile, JSON.stringify({
      fileId: 'test_recent',
      originalName: 'recent.docx',
      createdAt: new Date(now).toISOString()
    }));
    testMetadataFiles.push(recentFile);
    
    // Create an old file (should be deleted)
    const oldFile = path.join(metadataDir, 'test_old.json');
    await fs.writeFile(oldFile, JSON.stringify({
      fileId: 'test_old',
      originalName: 'old.docx',
      createdAt: new Date(now - 30 * oneDay).toISOString() // 30 days old
    }));
    testMetadataFiles.push(oldFile);
    
    // Set the old file's modification time to 30 days ago
    const oldTime = new Date(now - 30 * oneDay);
    await fs.utimes(oldFile, oldTime, oldTime);
  });
  
  afterEach(async () => {
    // Clean up test files
    for (const file of testMetadataFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // File might already be deleted
      }
    }
    testMetadataFiles.length = 0;
  });
  
  it('should clean up old metadata files', async () => {
    // Count files before cleanup
    const filesBefore = await fs.readdir(metadataDir);
    const testFilesBefore = filesBefore.filter(f => f.startsWith('test_'));
    expect(testFilesBefore).toHaveLength(2);
    
    // Run cleanup
    await cleanupOldMetadata();
    
    // Count files after cleanup
    const filesAfter = await fs.readdir(metadataDir);
    const testFilesAfter = filesAfter.filter(f => f.startsWith('test_'));
    
    // Should have deleted the old file, kept the recent one
    expect(testFilesAfter).toHaveLength(1);
    expect(testFilesAfter[0]).toBe('test_recent.json');
  });
  
  it('should handle errors gracefully', async () => {
    // Use vi.spyOn instead of directly replacing the function
    const readdirSpy = vi.spyOn(fs, 'readdir').mockImplementationOnce(() => {
      return Promise.reject(new Error('Test error'));
    });
    
    // Spy on logger.error to verify it's called
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    
    try {
      // This should not throw an error, but log it instead
      await cleanupOldMetadata();
      
      // Check that the spies were called
      expect(readdirSpy).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
    } finally {
      // Restore the original functions
      readdirSpy.mockRestore();
      loggerSpy.mockRestore();
    }
  });
});