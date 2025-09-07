/**
 * @file export-limit.test.ts
 * @description Unit test cho giới hạn số lượng kết quả export
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { ExportExcelRequestSchema } from '@/schemas/grade-request.schema';

describe('Export Limit Tests', () => {
  it('nên cho phép tối đa 60 results', () => {
    // Arrange
    const validData = {
      resultIds: Array(60).fill('test-id'),
      includeDetails: true,
      groupBy: 'none' as const,
      format: 'xlsx' as const
    };

    // Act & Assert
    expect(() => ExportExcelRequestSchema.parse(validData)).not.toThrow();
  });

  it('nên từ chối khi có hơn 60 results', () => {
    // Arrange
    const invalidData = {
      resultIds: Array(61).fill('test-id'), // 61 results, vượt quá giới hạn
      includeDetails: true,
      groupBy: 'none' as const,
      format: 'xlsx' as const
    };

    // Act & Assert
    expect(() => ExportExcelRequestSchema.parse(invalidData)).toThrow('Không được export quá 60 results');
  });

  it('nên cho phép ít hơn 60 results', () => {
    // Arrange
    const validData = {
      resultIds: Array(50).fill('test-id'), // 50 results
      includeDetails: true,
      groupBy: 'none' as const,
      format: 'xlsx' as const
    };

    // Act & Assert
    expect(() => ExportExcelRequestSchema.parse(validData)).not.toThrow();
  });
});