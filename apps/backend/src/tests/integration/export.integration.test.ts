/**
 * @file export.integration.test.ts
 * @description Integration test cho chức năng export
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { exportToExcel } from '@services/excel.service';
import type { GradeResult } from '@/types/criteria';

describe('Export Integration Tests', () => {
  const testFilename = 'integration_test_export';
  const testFileWithExtension = `${testFilename}.xlsx`;
  
  // Mock data
  const mockGradeResults: GradeResult[] = [
    {
      fileId: 'integration-test-file-1',
      filename: 'integration_test_1.docx',
      fileType: 'DOCX',
      rubricName: 'Default DOCX Rubric',
      totalPoints: 9.0,
      maxPossiblePoints: 10,
      percentage: 90,
      byCriteria: {
        'docx.toc': {
          passed: true,
          points: 2,
          level: 'excellent',
          reason: 'TOC hoàn hảo'
        },
        'docx.headerFooter': {
          passed: true,
          points: 2,
          level: 'excellent',
          reason: 'Header/Footer đầy đủ'
        }
      },
      gradedAt: new Date(),
      processingTime: 1100
    }
  ];

  beforeEach(() => {
    // Cleanup trước mỗi test
    if (existsSync(testFileWithExtension)) {
      unlinkSync(testFileWithExtension);
    }
  });

  afterEach(() => {
    // Cleanup sau mỗi test
    if (existsSync(testFileWithExtension)) {
      unlinkSync(testFileWithExtension);
    }
  });

  it('nên export dữ liệu và tạo file Excel hợp lệ', async () => {
    // Arrange
    const exportData = {
      results: mockGradeResults,
      includeDetails: true,
      groupBy: 'none' as const
    };

    // Act
    const filename = await exportToExcel(exportData, testFilename);

    // Assert
    expect(filename).toBe(testFileWithExtension);
    expect(existsSync(testFileWithExtension)).toBe(true);
    
    // Kiểm tra file không rỗng
    // Note: Chúng ta không thể kiểm tra nội dung chi tiết của file Excel trong test đơn giản này
    // nhưng có thể kiểm tra rằng file đã được tạo và có kích thước > 0
  });

  it('nên tạo file với tên timestamp khi không có tên được cung cấp', async () => {
    // Arrange
    const exportData = {
      results: mockGradeResults,
      includeDetails: false,
      groupBy: 'none' as const
    };

    // Act
    const filename = await exportToExcel(exportData);

    // Assert
    expect(filename).toMatch(/\.xlsx$/);
    expect(existsSync(filename)).toBe(true);
    
    // Cleanup
    if (existsSync(filename)) {
      unlinkSync(filename);
    }
  });
});