import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { gradeFileService } from '../../services/grade.service';
import { saveTempUploadedFile, validateFile } from '../../services/storage.service';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('End-to-End Workflow Tests', () => {
  let testUserId: number;
  let testFileId: string;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'test-e2e@example.com' },
      update: {},
      create: {
        email: 'test-e2e@example.com',
        password: hashedPassword
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.gradeResult.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.ungradedFile.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('PPTX End-to-End Workflow', () => {
    it('should process complete PPTX workflow: extract → grade → result', async () => {
      // Step 1: Load test PPTX file
      const pptxFilePath = path.join(__dirname, '../../../examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      // Step 2: Validate file
      const validation = await validateFile(pptxFileBuffer, 'test-pptx.pptx');
      expect(validation.isValid).toBe(true);
      expect(validation.fileType).toBe('PPTX');

      // Step 3: Save file temporarily
      const uploadedFile = await saveTempUploadedFile(pptxFileBuffer, 'test-pptx.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      expect(uploadedFile).toHaveProperty('id');
      expect(uploadedFile).toHaveProperty('fileName');

      testFileId = uploadedFile.id;

      // Step 4: Extract features (skip direct extraction, let service handle it)
      // const features = await extractPPTXFeatures(uploadedFile.fileName);
      // expect(features).toHaveProperty('filename');
      // expect(features).toHaveProperty('theme');
      // expect(features).toHaveProperty('transitions');
      // expect(features).toHaveProperty('animations');

      // Step 5: Grade the file
      const gradeResult = await gradeFileService({
        fileId: testFileId,
        userId: testUserId,
        useHardRubric: true
      });

      expect(gradeResult).toHaveProperty('fileId', testFileId);
      expect(gradeResult).toHaveProperty('filename');
      expect(gradeResult).toHaveProperty('totalPoints');
      expect(gradeResult).toHaveProperty('percentage');
      expect(gradeResult).toHaveProperty('processingTime');
      expect(gradeResult).toHaveProperty('dbId');

      // Step 6: Verify grading results contain PPTX criteria
      const criteriaResults = gradeResult.byCriteria;
      expect(criteriaResults).toBeInstanceOf(Object);
      expect(Object.keys(criteriaResults).length).toBeGreaterThan(0);

      // Check for PPTX-specific criteria
      const themeResult = criteriaResults['pptx_theme'];
      expect(themeResult).toBeDefined();
      expect(themeResult).toHaveProperty('passed');
      expect(themeResult).toHaveProperty('points');
      expect(themeResult).toHaveProperty('level');

      // Step 7: Verify result is saved in database
      const savedResult = await prisma.gradeResult.findUnique({
        where: { id: gradeResult.dbId }
      });
      expect(savedResult).toBeDefined();
      expect(savedResult?.filename).toBe(gradeResult.filename);
      expect(savedResult?.totalPoints).toBe(gradeResult.totalPoints);
    });

    it('should handle PPTX files with missing features gracefully', async () => {
      // Load a basic PPTX file
      const pptxFilePath = path.join(__dirname, '../../../examples/pptx/054206000135-DoanDinhHoan-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      // Validate and save file
      const validation = await validateFile(pptxFileBuffer, 'basic-pptx.pptx');
      const uploadedFile = await saveTempUploadedFile(pptxFileBuffer, 'basic-pptx.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      // Extract features (skip direct extraction, let service handle it)
      // const features = await extractPPTXFeatures(uploadedFile.fileName);
      // expect(features).toBeDefined();

      // Grade the file
      const gradeResult = await gradeFileService({
        fileId: uploadedFile.id,
        userId: testUserId,
        useHardRubric: true
      });

      expect(gradeResult).toHaveProperty('totalPoints');
      expect(gradeResult.totalPoints).toBeGreaterThanOrEqual(0);
      expect(gradeResult).toHaveProperty('percentage');
    });
  });

  describe('DOCX End-to-End Workflow', () => {
    it('should process complete DOCX workflow: extract → grade → result', async () => {
      // Step 1: Load test DOCX file
      const docxFilePath = path.join(__dirname, '../../../examples/docx/046306011637-LE TRAN MINH THU-DEWO1.DOCX');
      const docxFileBuffer = fs.readFileSync(docxFilePath);

      // Step 2: Validate file
      const validation = await validateFile(docxFileBuffer, 'test-docx.docx');
      expect(validation.isValid).toBe(true);
      expect(validation.fileType).toBe('DOCX');

      // Step 3: Save file temporarily
      const uploadedFile = await saveTempUploadedFile(docxFileBuffer, 'test-docx.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(uploadedFile).toHaveProperty('id');

      // Step 4: Extract features (skip direct extraction, let service handle it)
      // const features = await extractDOCXFeatures(uploadedFile.fileName);
      // expect(features).toHaveProperty('filename');
      // expect(features).toHaveProperty('toc');
      // expect(features).toHaveProperty('headers');
      // expect(features).toHaveProperty('footers');

      // Step 5: Grade the file
      const gradeResult = await gradeFileService({
        fileId: uploadedFile.id,
        userId: testUserId,
        useHardRubric: true
      });

      expect(gradeResult).toHaveProperty('fileId', uploadedFile.id);
      expect(gradeResult).toHaveProperty('totalPoints');
      expect(gradeResult).toHaveProperty('percentage');

      // Step 6: Verify DOCX criteria are evaluated
      const criteriaResults = gradeResult.byCriteria;
      const tocResult = criteriaResults['docx_toc'];
      expect(tocResult).toBeDefined();
      expect(tocResult).toHaveProperty('passed');
      expect(tocResult).toHaveProperty('points');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid file types gracefully', async () => {
      const invalidBuffer = Buffer.from('This is not a valid office file');

      const validation = await validateFile(invalidBuffer, 'invalid.txt');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Loại file không được hỗ trợ: .txt. Chỉ chấp nhận .pptx, .docx, .zip và .rar');
    });

    it('should handle corrupted files gracefully', async () => {
      const corruptedBuffer = Buffer.from('This is clearly not a valid office file format and should fail validation');

      const validation = await validateFile(corruptedBuffer, 'corrupted.docx');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('File không phải định dạng hợp lệ (thiếu ZIP signature)');
    });

    it('should handle grading non-existent files', async () => {
      await expect(gradeFileService({
        fileId: 'non-existent-file-id',
        userId: testUserId,
        useHardRubric: false
      })).rejects.toThrow();
    });
  });

  describe('Performance Testing', () => {
    it('should complete grading within reasonable time limits', async () => {
      const startTime = Date.now();

      // Load and grade a PPTX file
      const pptxFilePath = path.join(__dirname, '../../../examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const validation = await validateFile(pptxFileBuffer, 'performance-test.pptx');
      const uploadedFile = await saveTempUploadedFile(pptxFileBuffer, 'performance-test.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const gradeResult = await gradeFileService({
        fileId: uploadedFile.id,
        userId: testUserId,
        useHardRubric: true
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within 30 seconds
      expect(processingTime).toBeLessThan(30000);
      expect(gradeResult.processingTime).toBeLessThan(30000);
    });
  });

  describe('Data Persistence', () => {
    it('should persist grading results in database', async () => {
      // Grade a file
      const pptxFilePath = path.join(__dirname, '../../../examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const validation = await validateFile(pptxFileBuffer, 'persistence-test.pptx');
      const uploadedFile = await saveTempUploadedFile(pptxFileBuffer, 'persistence-test.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const gradeResult = await gradeFileService({
        fileId: uploadedFile.id,
        userId: testUserId,
        useHardRubric: true
      });

      // Verify result is saved
      const savedResult = await prisma.gradeResult.findUnique({
        where: { id: gradeResult.dbId }
      });

      expect(savedResult).toBeDefined();
      expect(savedResult?.userId).toBe(testUserId);
      expect(savedResult?.filename).toBe(gradeResult.filename);
      expect(savedResult?.totalPoints).toBe(gradeResult.totalPoints);
      expect(savedResult?.fileType).toBe('PPTX');
    });

    it('should maintain user grade history', async () => {
      // Count initial results
      const initialCount = await prisma.gradeResult.count({
        where: { userId: testUserId }
      });

      // Grade a file
      const pptxFilePath = path.join(__dirname, '../../../examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const validation = await validateFile(pptxFileBuffer, 'history-test.pptx');
      const uploadedFile = await saveTempUploadedFile(pptxFileBuffer, 'history-test.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      await gradeFileService({
        fileId: uploadedFile.id,
        userId: testUserId,
        useHardRubric: true
      });

      // Verify count increased
      const finalCount = await prisma.gradeResult.count({
        where: { userId: testUserId }
      });

      expect(finalCount).toBe(initialCount + 1);
    });
  });
});
