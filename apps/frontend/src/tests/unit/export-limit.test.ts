/**
 * @file export-limit.test.ts
 * @description Unit test cho giới hạn số lượng kết quả export ở frontend
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { ExportRequestSchema } from '../../schemas/export.schema';

describe('Frontend Export Limit Tests', () => {
  it('nên cho phép tối đa 60 results', () => {
    // Arrange
    const validData = {
      resultIds: Array(60).fill('test-id'),
      includeDetails: true,
      groupBy: 'none' as const,
      format: 'xlsx' as const
    };

    // Act & Assert
    expect(() => ExportRequestSchema.parse(validData)).not.toThrow();
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
    expect(() => ExportRequestSchema.parse(invalidData)).toThrow('Không được export quá 60 results');
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
    expect(() => ExportRequestSchema.parse(validData)).not.toThrow();
  });
});