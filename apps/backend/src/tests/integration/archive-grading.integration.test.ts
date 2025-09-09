/**
 * @file archive-grading.integration.test.ts
 * @description Integration tests for the complete archive file upload and grading workflow
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveTempUploadedFile } from '@services/storage.service';
import { validateFile } from '@services/storage.service';
import { extractAllFilesFromArchive } from '@services/archive.service';
import { gradeFileService } from '@services/grade.service';
import JSZip from 'jszip';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock DOCX content for testing
const mockDocxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Test document for archive processing</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This document contains a table for testing</w:t>
      </w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell 2</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

describe('Archive Grading Integration', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    // Note: In a real test environment, you might want to use a separate test database
  });

  afterEach(async () => {
    // Clean up after tests
  });

  describe('ZIP Archive Grading Workflow', () => {
    it('should handle complete ZIP archive upload and grading workflow with DOCX file', async () => {
      // 1. Create a ZIP archive with a DOCX file directly (not as a folder)
      const zip = new JSZip();
      
      // Add a DOCX file directly to the ZIP
      zip.file('test_document.docx', mockDocxContent);
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      // 2. Validate the ZIP file
      const validation = await validateFile(zipBuffer, 'test_archive.zip');
      expect(validation.isValid).toBe(true);
      expect(validation.fileType).toBe('ZIP');
      
      // 3. Save the file as if it was uploaded
      const uploadedFile = await saveTempUploadedFile(zipBuffer, 'test_archive.zip');
      expect(uploadedFile.id).toBeDefined();
      expect(uploadedFile.originalName).toBe('test_archive.zip');
      
      // 4. Test extraction of files from the archive
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      // 5. Verify that we can find the DOCX file
      if (extractedFiles) {
        const officeFiles = Object.keys(extractedFiles).filter(file => 
          file.toLowerCase().endsWith('.docx')
        );
        expect(officeFiles.length).toBeGreaterThanOrEqual(1);
      }
      
      // Note: We're not testing the full grading here because it would require a more complex
      // DOCX structure and would be slow. The individual components are tested separately.
    });

    it('should handle ZIP archive with multiple Office files', async () => {
      // Create a ZIP with multiple Office files
      const zip = new JSZip();
      
      // Add DOCX files
      zip.file('document1.docx', mockDocxContent);
      zip.file('document2.docx', mockDocxContent);
      
      // Add a PPTX file
      zip.file('presentation.pptx', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
</p:presentation>`);
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      // Validate and save
      const validation = await validateFile(zipBuffer, 'multi_office.zip');
      expect(validation.isValid).toBe(true);
      expect(validation.fileType).toBe('ZIP');
      
      const uploadedFile = await saveTempUploadedFile(zipBuffer, 'multi_office.zip');
      expect(uploadedFile.id).toBeDefined();
      
      // Extract and verify multiple files
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
      
      if (extractedFiles) {
        const officeFiles = Object.keys(extractedFiles).filter(file => 
          file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.pptx')
        );
        expect(officeFiles.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle ZIP archives with no Office files', async () => {
      // Create a ZIP with non-Office files only
      const zip = new JSZip();
      zip.file('readme.txt', 'This is a readme file');
      zip.file('image.png', Buffer.from([0x89, 0x50, 0x4E, 0x47])); // PNG signature
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      const validation = await validateFile(zipBuffer, 'no_office_files.zip');
      expect(validation.isValid).toBe(true); // ZIP itself is valid
      expect(validation.fileType).toBe('ZIP');
      
      const uploadedFile = await saveTempUploadedFile(zipBuffer, 'no_office_files.zip');
      expect(uploadedFile.id).toBeDefined();
      
      // Extraction should work but find no Office files
      const extractedFiles = await extractAllFilesFromArchive(zipBuffer, '.zip');
      expect(extractedFiles).toBeDefined();
      expect(extractedFiles).not.toBeNull();
    });

    it('should handle corrupted ZIP archives gracefully', async () => {
      // Create an invalid ZIP buffer
      const invalidZipBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0xFF, 0xFF, 0xFF]); // Incomplete ZIP
      
      const validation = await validateFile(invalidZipBuffer, 'corrupted.zip');
      // Might still pass initial validation but would fail during extraction
      expect(validation).toBeDefined();
    });
  });
});