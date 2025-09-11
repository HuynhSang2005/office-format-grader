import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import app from '../app';
import { testClient } from 'hono/testing';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('End-to-End Workflow Tests', () => {
  let client: ReturnType<typeof testClient>;
  let testUserId: number;
  let testFileId: string;
  let testCustomRubricId: string;

  beforeAll(async () => {
    // Setup test client
    client = testClient(app);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'USER'
      }
    });
    testUserId = testUser.id;

    // Create test custom rubric
    const testRubric = await prisma.customRubric.create({
      data: {
        name: 'Test Rubric',
        description: 'Test rubric for end-to-end testing',
        userId: testUserId,
        content: {
          criteria: [
            {
              id: 'pptx.theme',
              name: 'Theme',
              description: 'Theme quality assessment',
              weight: 1.0,
              levels: [
                { name: 'theme_0', points: 0, description: 'No theme' },
                { name: 'theme_1', points: 0.5, description: 'Basic theme' },
                { name: 'theme_2', points: 1.0, description: 'Professional theme' }
              ]
            },
            {
              id: 'docx.toc',
              name: 'Table of Contents',
              description: 'TOC quality assessment',
              weight: 1.0,
              levels: [
                { name: 'toc_0', points: 0, description: 'No TOC' },
                { name: 'toc_1', points: 0.75, description: 'Basic TOC' },
                { name: 'toc_2', points: 1.5, description: 'Professional TOC' }
              ]
            }
          ]
        }
      }
    });
    testCustomRubricId = testRubric.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.gradeResult.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.ungradedFile.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.customRubric.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
  });

  describe('Complete PPTX Workflow: Upload → Extract → Grade → Result', () => {
    it('should process complete PPTX workflow successfully', async () => {
      // Step 1: Upload PPTX file
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'test-pptx.pptx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(uploadResponse.status).toBe(200);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.data).toHaveProperty('fileId');

      testFileId = uploadResult.data.fileId;

      // Step 2: Grade the uploaded file
      const gradeResponse = await client.api.grade.grade.$post({
        json: {
          fileId: testFileId,
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(gradeResponse.status).toBe(200);
      const gradeResult = await gradeResponse.json();
      expect(gradeResult.success).toBe(true);
      expect(gradeResult.data).toHaveProperty('totalPoints');
      expect(gradeResult.data).toHaveProperty('percentage');
      expect(gradeResult.data).toHaveProperty('criteriaResults');

      // Step 3: Verify grading results
      const criteriaResults = gradeResult.data.criteriaResults;
      expect(criteriaResults).toBeInstanceOf(Array);
      expect(criteriaResults.length).toBeGreaterThan(0);

      // Check that PPTX-specific criteria are evaluated
      const themeCriteria = criteriaResults.find((c: any) => c.criterionId === 'pptx.theme');
      expect(themeCriteria).toBeDefined();
      expect(themeCriteria.result).toHaveProperty('passed');
      expect(themeCriteria.result).toHaveProperty('points');
      expect(themeCriteria.result).toHaveProperty('level');

      // Step 4: Get grade result details
      const resultResponse = await client.api.grade.result.$get({
        query: { fileId: testFileId },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(resultResponse.status).toBe(200);
      const resultDetails = await resultResponse.json();
      expect(resultDetails.success).toBe(true);
      expect(resultDetails.data).toHaveProperty('filename');
      expect(resultDetails.data).toHaveProperty('totalPoints');
      expect(resultDetails.data).toHaveProperty('processingTime');
    });

    it('should handle PPTX upload with automatic grading using custom rubric', async () => {
      // Upload PPTX file with custom rubric ID for automatic grading
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'test-pptx-auto.pptx');
      uploadFormData.append('customRubricId', testCustomRubricId);

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(uploadResponse.status).toBe(200);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.data).toHaveProperty('gradeResult');
      expect(uploadResult.data.gradeResult).toHaveProperty('totalPoints');
      expect(uploadResult.data.gradeResult).toHaveProperty('percentage');
    });
  });

  describe('Complete DOCX Workflow: Upload → Extract → Grade → Result', () => {
    it('should process complete DOCX workflow successfully', async () => {
      // Step 1: Upload DOCX file
      const docxFilePath = path.join(__dirname, '../../examples/docx/pass-all-rubric/sample.docx');
      const docxFileBuffer = fs.readFileSync(docxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([docxFileBuffer]), 'test-docx.docx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(uploadResponse.status).toBe(200);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.data).toHaveProperty('fileId');

      const docxFileId = uploadResult.data.fileId;

      // Step 2: Grade the uploaded DOCX file
      const gradeResponse = await client.api.grade.grade.$post({
        json: {
          fileId: docxFileId,
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(gradeResponse.status).toBe(200);
      const gradeResult = await gradeResponse.json();
      expect(gradeResult.success).toBe(true);
      expect(gradeResult.data).toHaveProperty('totalPoints');
      expect(gradeResult.data).toHaveProperty('percentage');
      expect(gradeResult.data).toHaveProperty('criteriaResults');

      // Step 3: Verify DOCX-specific criteria are evaluated
      const criteriaResults = gradeResult.data.criteriaResults;
      const tocCriteria = criteriaResults.find((c: any) => c.criterionId === 'docx.toc');
      expect(tocCriteria).toBeDefined();
      expect(tocCriteria.result).toHaveProperty('passed');
      expect(tocCriteria.result).toHaveProperty('points');
      expect(tocCriteria.result).toHaveProperty('level');
    });
  });

  describe('Batch Processing Workflow', () => {
    it('should handle batch grading of multiple files', async () => {
      // Upload multiple files
      const fileIds: string[] = [];

      // Upload first PPTX file
      const pptxFilePath1 = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxBuffer1 = fs.readFileSync(pptxFilePath1);

      const uploadFormData1 = new FormData();
      uploadFormData1.append('file', new Blob([pptxBuffer1]), 'batch-test-1.pptx');

      const uploadResponse1 = await client.api.upload.$post({
        form: uploadFormData1,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const uploadResult1 = await uploadResponse1.json();
      fileIds.push(uploadResult1.data.fileId);

      // Upload second PPTX file
      const pptxFilePath2 = path.join(__dirname, '../../examples/pptx/basic/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxBuffer2 = fs.readFileSync(pptxFilePath2);

      const uploadFormData2 = new FormData();
      uploadFormData2.append('file', new Blob([pptxBuffer2]), 'batch-test-2.pptx');

      const uploadResponse2 = await client.api.upload.$post({
        form: uploadFormData2,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const uploadResult2 = await uploadResponse2.json();
      fileIds.push(uploadResult2.data.fileId);

      // Batch grade the files
      const batchGradeResponse = await client.api.grade.grade.$post({
        json: {
          files: fileIds.map(fileId => ({ fileId, userId: testUserId })),
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(batchGradeResponse.status).toBe(200);
      const batchResult = await batchGradeResponse.json();
      expect(batchResult.success).toBe(true);
      expect(batchResult.data).toBeInstanceOf(Array);
      expect(batchResult.data.length).toBe(2);

      // Verify each file has grading results
      batchResult.data.forEach((result: any) => {
        expect(result).toHaveProperty('fileId');
        expect(result).toHaveProperty('totalPoints');
        expect(result).toHaveProperty('percentage');
        expect(result).toHaveProperty('criteriaResults');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid file upload', async () => {
      const invalidFileBuffer = Buffer.from('invalid file content');

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([invalidFileBuffer]), 'invalid.txt');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(uploadResponse.status).toBe(400);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.message).toContain('validation thất bại');
    });

    it('should handle grading non-existent file', async () => {
      const gradeResponse = await client.api.grade.grade.$post({
        json: {
          fileId: 'non-existent-file-id',
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(gradeResponse.status).toBe(404);
      const gradeResult = await gradeResponse.json();
      expect(gradeResult.success).toBe(false);
    });

    it('should handle upload without authentication', async () => {
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'unauthorized.pptx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData
        // No Authorization header
      });

      expect(uploadResponse.status).toBe(401);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.message).toContain('đăng nhập');
    });

    it('should handle corrupted file gracefully', async () => {
      const corruptedBuffer = Buffer.from('corrupted file content that is not a valid office file');

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([corruptedBuffer]), 'corrupted.docx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      // Should either reject during validation or handle gracefully during processing
      expect([200, 400, 500]).toContain(uploadResponse.status);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle grading workflow within reasonable time limits', async () => {
      const startTime = Date.now();

      // Upload and grade a file
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'performance-test.pptx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.data.fileId;

      const gradeResponse = await client.api.grade.grade.$post({
        json: {
          fileId: fileId,
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within 30 seconds
      expect(processingTime).toBeLessThan(30000);

      const gradeResult = await gradeResponse.json();
      expect(gradeResult.data).toHaveProperty('processingTime');
      expect(gradeResult.data.processingTime).toBeLessThan(30000);
    });
  });

  describe('Data Persistence and Retrieval', () => {
    it('should persist grading results and allow retrieval', async () => {
      // Upload and grade a file
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'persistence-test.pptx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.data.fileId;

      const gradeResponse = await client.api.grade.grade.$post({
        json: {
          fileId: fileId,
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const gradeResult = await gradeResponse.json();
      const dbId = gradeResult.data.dbId;

      // Retrieve the result
      const resultResponse = await client.api.grade.result.$get({
        query: { id: dbId },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      expect(resultResponse.status).toBe(200);
      const retrievedResult = await resultResponse.json();
      expect(retrievedResult.success).toBe(true);
      expect(retrievedResult.data.id).toBe(dbId);
      expect(retrievedResult.data.totalPoints).toBe(gradeResult.data.totalPoints);
    });

    it('should maintain grade history for user', async () => {
      // Get initial history
      const initialHistoryResponse = await client.api.grade.history.$get({
        query: { userId: testUserId.toString() },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const initialHistory = await initialHistoryResponse.json();
      const initialCount = initialHistory.data?.length || 0;

      // Upload and grade a file
      const pptxFilePath = path.join(__dirname, '../../examples/pptx/pass-all-rubric/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
      const pptxFileBuffer = fs.readFileSync(pptxFilePath);

      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([pptxFileBuffer]), 'history-test.pptx');

      const uploadResponse = await client.api.upload.$post({
        form: uploadFormData,
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.data.fileId;

      await client.api.grade.grade.$post({
        json: {
          fileId: fileId,
          userId: testUserId,
          useHardRubric: false
        },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      // Check history again
      const updatedHistoryResponse = await client.api.grade.history.$get({
        query: { userId: testUserId.toString() },
        headers: {
          'Authorization': `Bearer test-token-${testUserId}`
        }
      });

      const updatedHistory = await updatedHistoryResponse.json();
      expect(updatedHistory.data.length).toBe(initialCount + 1);
    });
  });
});
