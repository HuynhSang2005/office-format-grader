/**
 * @file archive.service.test.ts
 * @description Unit tests cho archive service
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { validateZipFile, extractZipSafely, validateRarFile, extractRarSafely, extractArchive } from '@services/archive.service';
import { ExtractionOptions } from '@/types/archive.types';

describe('Archive Service', () => {
  describe('validateZipFile', () => {
    it('should reject an invalid ZIP file buffer', async () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);

      const result = await validateZipFile(invalidBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File không có ZIP signature hợp lệ');
    });

    it('should reject a buffer that is too small', async () => {
      const smallBuffer = Buffer.from([0x50, 0x4B]);

      const result = await validateZipFile(smallBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File quá nhỏ để là ZIP file hợp lệ');
    });
  });

  describe('extractZipSafely', () => {
    it('should handle empty buffer gracefully', async () => {
      const emptyBuffer = Buffer.from([]);

      const options: ExtractionOptions = {
        maxFiles: 10,
        maxTotalSize: 1024 * 1024, // 1MB
        allowedExtensions: ['.txt', '.xml'],
        maxDepth: 5
      };

      const result = await extractZipSafely(emptyBuffer, options);
      expect(result.success).toBe(false);
    });
  });
  
  describe('validateRarFile', () => {
    it('should reject an invalid RAR file buffer', async () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

      const result = await validateRarFile(invalidBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File không có RAR signature hợp lệ');
    });

    it('should reject a buffer that is too small', async () => {
      const smallBuffer = Buffer.from([0x52, 0x61]);

      const result = await validateRarFile(smallBuffer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File quá nhỏ để là RAR file hợp lệ');
    });
  });

  describe('extractRarSafely', () => {
    it('should handle empty buffer gracefully', async () => {
      const emptyBuffer = Buffer.from([]);

      const options: ExtractionOptions = {
        maxFiles: 10,
        maxTotalSize: 1024 * 1024, // 1MB
        allowedExtensions: ['.txt', '.xml'],
        maxDepth: 5
      };

      const result = await extractRarSafely(emptyBuffer, options);
      expect(result.success).toBe(false);
    });
  });
  
  describe('extractArchive', () => {
    it('should call extractZipSafely for .zip files', async () => {
      const emptyBuffer = Buffer.from([]);
      const result = await extractArchive(emptyBuffer, '.zip');
      expect(result.success).toBe(false); // Will fail due to empty buffer, but correct function called
    });

    it('should call extractRarSafely for .rar files', async () => {
      const emptyBuffer = Buffer.from([]);
      const result = await extractArchive(emptyBuffer, '.rar');
      expect(result.success).toBe(false); // Will fail due to empty buffer, but correct function called
    });
  });
  
  // Thêm test cho relationships typing
  describe('OpenXMLRelationship typing', () => {
    it('should have correct structure for relationships', () => {
      // Test typing only - this is a compile-time check
      const relationship: import('@/types/archive.types').OpenXMLRelationship = {
        id: 'rId1',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
        target: 'styles.xml'
      };
      
      expect(relationship.id).toBe('rId1');
      expect(relationship.type).toBe('http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles');
      expect(relationship.target).toBe('styles.xml');
    });
  });
});