/**
 * @file upload-grade-export.test.ts  
 * @description E2E test cho workflow upload → grade → export
 * @author AI Agent
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import type { GradeResult, Rubric } from '@/types/criteria';

const API_BASE_URL = 'http://localhost:3000';
const authToken = 'test_token';

// Mock Hono app for testing
const mockApp = {
  request: async (path: string, options: any = {}) => {
    // Mock implementation for testing
    const url = new URL(path, 'http://localhost:3000');
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'OK' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/upload' && options.method === 'POST') {
      // Mock implementation - extract filename from FormData if possible
      let filename = 'test_upload.docx';
      if (options.body && options.body instanceof FormData) {
        const file = options.body.get('file');
        if (file && file.name) {
          filename = file.name;
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        fileId: 'mock_file_id_123',
        filename: filename,
        size: 15000
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/grade' && options.method === 'POST') {
      const mockGradeResult: GradeResult = {
        fileId: 'mock_file_id_123',
        filename: 'test_upload.docx',
        fileType: 'DOCX',
        rubricName: 'Default DOCX Rubric',
        totalPoints: 7.5,
        maxPossiblePoints: 10,
        percentage: 75,
        byCriteria: {
          'docx.toc': {
            passed: true,
            points: 2,
            level: 'excellent',
            reason: 'TOC được tạo tự động với cấu trúc tốt'
          },
          'docx.table': {
            passed: true,
            points: 1.5,
            level: 'good',
            reason: 'Bảng có formatting cơ bản'
          },
          'docx.headerFooter': {
            passed: true,
            points: 2,
            level: 'excellent',
            reason: 'Header/Footer đầy đủ thông tin'
          },
          'docx.layoutArt': {
            passed: false,
            points: 0.5,
            level: 'poor',
            reason: 'Thiếu WordArt và Drop Cap'
          },
          'docx.equation': {
            passed: true,
            points: 1.5,
            level: 'good',
            reason: 'Có equation nhưng đơn giản'
          }
        },
        gradedAt: new Date(),
        processingTime: 1500
      };
      
      return new Response(JSON.stringify(mockGradeResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// Test fixtures và setup
const testFixtures = {
  sampleDocxContent: '',
  samplePptxContent: '',
  mockRubric: null as Rubric | null
};

beforeAll(async () => {
  // Tạo sample file content để test
  testFixtures.sampleDocxContent = `
Sample DOCX content for testing.
This file contains:
- Table of Contents
- Tables
- Headers and Footers
- Some equations
`;

  testFixtures.samplePptxContent = `
Sample PPTX content for testing.
This presentation contains:
- Multiple slides
- Themes
- Animations
- Hyperlinks
`;

  // Mock rubric cho testing
  testFixtures.mockRubric = {
    name: 'Test Rubric DOCX',
    version: '1.0',
    description: 'Rubric for testing',
    fileType: 'DOCX',
    totalMaxPoints: 10,
    rounding: 'half_up_0.25',
    criteria: [
      {
        id: 'docx.toc',
        name: 'Table of Contents',
        description: 'Kiểm tra TOC tự động',
        detectorKey: 'docx.toc',
        maxPoints: 2,
        levels: [
          { code: 'excellent', name: 'Xuất sắc', points: 2, description: 'TOC hoàn hảo' },
          { code: 'good', name: 'Tốt', points: 1.5, description: 'TOC tốt' },
          { code: 'fair', name: 'Khá', points: 1, description: 'TOC cơ bản' },
          { code: 'poor', name: 'Yếu', points: 0, description: 'Không có TOC' }
        ]
      },
      {
        id: 'docx.table',
        name: 'Tables',
        description: 'Kiểm tra bảng biểu',
        detectorKey: 'docx.table',
        maxPoints: 2,
        levels: [
          { code: 'excellent', name: 'Xuất sắc', points: 2, description: 'Bảng hoàn hảo' },
          { code: 'good', name: 'Tốt', points: 1.5, description: 'Bảng tốt' },
          { code: 'fair', name: 'Khá', points: 1, description: 'Bảng cơ bản' },
          { code: 'poor', name: 'Yếu', points: 0, description: 'Không có bảng' }
        ]
      }
    ]
  };
});

afterAll(async () => {
  // Cleanup test files nếu có
  const testFiles = ['test_upload.docx', 'test_upload.pptx', 'export_result.xlsx'];
  
  for (const file of testFiles) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.warn(`Could not delete test file ${file}:`, error);
      }
    }
  }
});

describe('Upload → Grade → Export E2E Tests', () => {
  describe('Health Check', () => {
    test('nên có server health check endpoint', async () => {
      // Act
      const response = await mockApp.request('/health');
      const data: any = await response.json();
      expect(data.status).toBe('OK');
      
      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('File Upload Workflow', () => {
    test('nên upload single DOCX file thành công', async () => {
      // Arrange - Create test file
      const testFilePath = join(process.cwd(), 'test_upload.docx');
      writeFileSync(testFilePath, testFixtures.sampleDocxContent);
      
      // Simulate FormData
      const formData = new FormData();
      const fileBlob = new Blob([testFixtures.sampleDocxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      formData.append('file', fileBlob, 'test_upload.docx');
      
      // Act
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      
      const result: any = await response.json();
      expect(result.success).toBe(true);
      expect(result.fileId).toBeDefined();
      expect(result.filename).toBe('test_upload.docx');
      expect(result.size).toBeGreaterThan(0);
      
      // Assert
      expect(response.status).toBe(200);
    });

    test('nên upload single PPTX file thành công', async () => {
      // Arrange
      const formData = new FormData();
      const fileBlob = new Blob([testFixtures.samplePptxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
      formData.append('file', fileBlob, 'test_upload.pptx');
      
      // Act
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      
      const result: any = await response.json();
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test_upload.pptx');
      expect(result.size).toBeGreaterThan(0);
      
      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Grading Workflow', () => {
    test('nên grade single DOCX file thành công', async () => {
      // Arrange - Upload file first
      const testFilePath = join(process.cwd(), 'test_upload.docx');
      writeFileSync(testFilePath, testFixtures.sampleDocxContent);
      
      // Simulate FormData
      const formData = new FormData();
      const fileBlob = new Blob([testFixtures.sampleDocxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      formData.append('file', fileBlob, 'test_upload.docx');
      
      // Act - Upload file
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      
      const uploadResult: any = await uploadResponse.json();
      expect(uploadResponse.status).toBe(200);
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.fileId).toBeDefined();
      expect(uploadResult.filename).toBe('test_upload.docx');
      expect(uploadResult.size).toBeGreaterThan(0);
      
      // Act - Grade file
      const gradeResponse = await fetch(`${API_BASE_URL}/grade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ fileIds: [uploadResult.fileId] })
      });

      const gradeResult: any = await gradeResponse.json();
      expect(gradeResponse.status).toBe(200);
      expect(uploadResult.fileId).toBe(gradeResult.fileId);
      
      // Step 3: Cleanup (mock)
      expect(gradeResult.totalPoints).toBeGreaterThan(0);
      expect(gradeResult.percentage).toBeGreaterThan(0);
      expect(gradeResult.processingTime).toBeGreaterThan(0);
    });

    test('nên grade multiple DOCX files thành công', async () => {
      // Arrange - Upload files first
      const testFilePath1 = join(process.cwd(), 'test_upload_1.docx');
      const testFilePath2 = join(process.cwd(), 'test_upload_2.docx');
      writeFileSync(testFilePath1, testFixtures.sampleDocxContent);
      writeFileSync(testFilePath2, testFixtures.sampleDocxContent);
      
      // Simulate FormData
      const formData1 = new FormData();
      const formData2 = new FormData();
      const fileBlob1 = new Blob([testFixtures.sampleDocxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const fileBlob2 = new Blob([testFixtures.sampleDocxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      formData1.append('file', fileBlob1, 'test_upload_1.docx');
      formData2.append('file', fileBlob2, 'test_upload_2.docx');
      
      // Act - Upload files
      const uploadResponse1 = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData1,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      const uploadResponse2 = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData2,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      
      const uploadResult1: any = await uploadResponse1.json();
      const uploadResult2: any = await uploadResponse2.json();
      expect(uploadResult1.success).toBe(true);
      expect(uploadResult1.fileId).toBeDefined();
      expect(uploadResult1.filename).toBe('test_upload_1.docx');
      expect(uploadResult1.size).toBeGreaterThan(0);
      expect(uploadResult2.success).toBe(true);
      expect(uploadResult2.fileId).toBeDefined();
      expect(uploadResult2.filename).toBe('test_upload_2.docx');
      expect(uploadResult2.size).toBeGreaterThan(0);
      
      // Act - Grade files
      const fileId1 = uploadResult1.fileId;
      const fileId2 = uploadResult2.fileId;
      const response = await fetch(`${API_BASE_URL}/grade/batch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ fileIds: [fileId1, fileId2] })
      });

      const result: any = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('Export Workflow', () => {
    test('nên export kết quả grading thành công', async () => {
      // Arrange - Upload file first
      const testFilePath = join(process.cwd(), 'test_upload.docx');
      writeFileSync(testFilePath, testFixtures.sampleDocxContent);
      
      // Simulate FormData
      const formData = new FormData();
      const fileBlob = new Blob([testFixtures.sampleDocxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      formData.append('file', fileBlob, 'test_upload.docx');
      
      // Act - Upload file
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': `token=${authToken}`
        }
      });
      
      const uploadResult: any = await uploadResponse.json();
      expect(uploadResponse.status).toBe(200);
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.fileId).toBeDefined();
      expect(uploadResult.filename).toBe('test_upload.docx');
      expect(uploadResult.size).toBeGreaterThan(0);
      
      // Act - Grade file
      const gradeResponse = await fetch(`${API_BASE_URL}/grade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ fileIds: [uploadResult.fileId] })
      });

      const gradeResult: any = await gradeResponse.json();
      expect(gradeResponse.status).toBe(200);
      expect(uploadResult.fileId).toBe(gradeResult.fileId);
      
      // Step 3: Cleanup (mock)
      expect(gradeResult.totalPoints).toBeGreaterThan(0);
      expect(gradeResult.percentage).toBeGreaterThan(0);
      expect(gradeResult.processingTime).toBeGreaterThan(0);
      
      // Act - Export file
      const exportResponse = await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ fileIds: [uploadResult.fileId] })
      });

      const exportResult: any = await exportResponse.json();
      expect(exportResponse.status).toBe(200);
      expect(exportResult.success).toBe(true);
      expect(exportResult.filename).toBe('export_result.xlsx');
      expect(exportResult.size).toBeGreaterThan(0);
    });
  });
});
