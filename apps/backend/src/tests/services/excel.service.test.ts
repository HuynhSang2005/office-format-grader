/**
 * @file excel.service.test.ts
 * @description Test cho excel service
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { exportToExcel } from '@services/excel.service';
import type { GradeResult } from '@/types/criteria';

describe('Excel Service', () => {
  const testFilename = 'test_export';
  const testFileWithExtension = `${testFilename}.xlsx`;
  
  // Mock data
  const mockGradeResults: GradeResult[] = [
    {
      fileId: 'test-file-1',
      filename: 'test1.docx',
      fileType: 'DOCX',
      rubricName: 'Default DOCX Rubric',
      totalPoints: 8.5,
      maxPossiblePoints: 10,
      percentage: 85,
      byCriteria: {
        'docx.toc': {
          passed: true,
          points: 2,
          level: 'excellent',
          reason: 'TOC hoàn hảo'
        },
        'docx.table': {
          passed: true,
          points: 1.5,
          level: 'good',
          reason: 'Bảng tốt'
        }
      },
      gradedAt: new Date(),
      processingTime: 1200
    },
    {
      fileId: 'test-file-2',
      filename: 'test2.pptx',
      fileType: 'PPTX',
      rubricName: 'Default PPTX Rubric',
      totalPoints: 7.0,
      maxPossiblePoints: 10,
      percentage: 70,
      byCriteria: {
        'pptx.theme': {
          passed: true,
          points: 1.5,
          level: 'good',
          reason: 'Theme phù hợp'
        },
        'pptx.transitions': {
          passed: false,
          points: 0,
          level: 'poor',
          reason: 'Thiếu transitions'
        }
      },
      gradedAt: new Date(),
      processingTime: 1500
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

  it('nên export dữ liệu ra file Excel thành công', async () => {
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
  });

  it('nên export dữ liệu mà không có chi tiết tiêu chí', async () => {
    // Arrange
    const exportData = {
      results: mockGradeResults,
      includeDetails: false,
      groupBy: 'none' as const
    };

    // Act
    const filename = await exportToExcel(exportData, testFilename);

    // Assert
    expect(filename).toBe(testFileWithExtension);
    expect(existsSync(testFileWithExtension)).toBe(true);
  });

  it('nên throw error khi dữ liệu không hợp lệ', async () => {
    // Arrange
    const invalidExportData = {
      results: null as any,
      includeDetails: true,
      groupBy: 'none' as const
    };

    // Act & Assert
    await expect(exportToExcel(invalidExportData, testFilename)).rejects.toThrow();
  });
});