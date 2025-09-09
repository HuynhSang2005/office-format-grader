/**
 * @file archive-service.unit.test.ts
 * @description Unit tests specifically for archive service functions
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { extractAllFilesFromArchive, validateRarFile, validateZipFile } from '@services/archive.service';

describe('Archive Service Unit Tests', () => {
  describe('ZIP Archive Functions', () => {
    it('should reject invalid ZIP file', async () => {
      // Create an invalid ZIP buffer
      const invalidZipBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      
      const result = await validateZipFile(invalidZipBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File không có ZIP signature hợp lệ');
    });
  });

  describe('RAR Archive Functions', () => {
    it('should reject invalid RAR file', async () => {
      // Create an invalid RAR buffer
      const invalidRarBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      
      const result = await validateRarFile(invalidRarBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File không có RAR signature hợp lệ');
    });
  });

  describe('extractAllFilesFromArchive', () => {
    it('should handle empty ZIP buffer gracefully', async () => {
      const emptyBuffer = Buffer.from([]);
      const result = await extractAllFilesFromArchive(emptyBuffer, '.zip');
      expect(result).toBeNull();
    });

    it('should handle empty RAR buffer gracefully', async () => {
      const emptyBuffer = Buffer.from([]);
      const result = await extractAllFilesFromArchive(emptyBuffer, '.rar');
      expect(result).toBeNull();
    });
  });
});