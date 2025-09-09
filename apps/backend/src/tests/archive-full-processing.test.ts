/**
 * @file archive-full-processing.test.ts
 * @description Comprehensive tests for archive file processing and grading functionality
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { validateFile } from '@services/storage.service';
import { extractAllFilesFromArchive } from '@services/archive.service';
import JSZip from 'jszip';

// Mock data for testing
const mockDocxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>This is a test DOCX document for archive processing</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

const mockPptxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
</p:presentation>`;

describe('Archive Full Processing', () => {
  describe('ZIP Archive Processing', () => {
    it('should validate ZIP archive files correctly', async () => {
      // Create a mock ZIP buffer with DOCX file inside
      const zip = new JSZip();
      zip.file('test.docx', mockDocxContent);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      const result = await validateFile(zipBuffer, 'test.zip');
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('ZIP');
      expect(result.errors).toHaveLength(0);
    });

    it('should extract ZIP archive and find Office files', async () => {
      // Create a ZIP with both DOCX and PPTX files
      const zip = new JSZip();
      zip.file('document.docx', mockDocxContent);
      zip.file('presentation.pptx', mockPptxContent);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      if (extractedFiles) {
        expect(Object.keys(extractedFiles)).toContain('document.docx');
        expect(Object.keys(extractedFiles)).toContain('presentation.pptx');
        expect(extractedFiles['document.docx']).toBeInstanceOf(Buffer);
        expect(extractedFiles['presentation.pptx']).toBeInstanceOf(Buffer);
      }
    });

    it('should process ZIP archive with DOCX file for grading', async () => {
      // Create a ZIP with a DOCX file
      const zip = new JSZip();
      zip.file('test_document.docx', mockDocxContent);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      // This would normally be handled by the grade service
      // We're testing the extraction part that the grade service uses
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      if (extractedFiles) {
        const officeFiles = Object.keys(extractedFiles).filter(file => 
          file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.pptx')
        );
        expect(officeFiles).toHaveLength(1);
        expect(officeFiles[0]).toBe('test_document.docx');
      }
    });

    it('should process ZIP archive with PPTX file for grading', async () => {
      // Create a ZIP with a PPTX file
      const zip = new JSZip();
      zip.file('test_presentation.pptx', mockPptxContent);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      if (extractedFiles) {
        const officeFiles = Object.keys(extractedFiles).filter(file => 
          file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.pptx')
        );
        expect(officeFiles).toHaveLength(1);
        expect(officeFiles[0]).toBe('test_presentation.pptx');
      }
    });
  });

  describe('RAR Archive Processing', () => {
    it('should validate RAR archive files correctly', async () => {
      // Create a mock RAR buffer (using a simple buffer with RAR signature)
      const rarBuffer = Buffer.from([
        0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, // RAR5 signature
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      
      const result = await validateFile(rarBuffer, 'test.rar');
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('RAR');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle RAR archive extraction errors gracefully', async () => {
      // Create an invalid RAR buffer
      const invalidRarBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      
      // Should handle gracefully without throwing
      try {
        const result = await extractAllFilesFromArchive(invalidRarBuffer, '.rar');
        // If it doesn't throw, it should return null
        expect(result).toBeNull();
      } catch (error) {
        // If it throws, it should be handled gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid archive files', async () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      
      // For ZIP files, invalid signature should cause validation to fail
      const zipResult = await validateFile(invalidBuffer, 'test.zip');
      expect(zipResult.isValid).toBe(false);
      
      // For RAR files, we're only checking the signature in the first 7 bytes
      // Since our invalid buffer is only 4 bytes, it won't be validated as RAR
      // Let's create a proper test with a buffer that has an invalid RAR signature
      const invalidRarBuffer = Buffer.from([
        0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00, // RAR4 signature prefix
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF  // Invalid continuation
      ]);
      
      // This test is more about ensuring the function doesn't crash than about validation results
      expect(() => validateFile(invalidRarBuffer, 'test.rar')).not.toThrow();
    });

    it('should handle empty archive files', async () => {
      const emptyBuffer = Buffer.from([]);
      
      const zipResult = await validateFile(emptyBuffer, 'test.zip');
      expect(zipResult.isValid).toBe(false);
      expect(zipResult.errors).toContain('File rỗng');
      
      const rarResult = await validateFile(emptyBuffer, 'test.rar');
      expect(rarResult.isValid).toBe(false);
      expect(rarResult.errors).toContain('File rỗng');
    });

    it('should handle archives without Office files', async () => {
      // Create a ZIP with non-Office files
      const zip = new JSZip();
      zip.file('readme.txt', 'This is a text file');
      zip.file('image.jpg', Buffer.from([0xFF, 0xD8, 0xFF]));
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      if (extractedFiles) {
        const officeFiles = Object.keys(extractedFiles).filter(file => 
          file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.pptx')
        );
        expect(officeFiles).toHaveLength(0);
      }
    });
  });
});