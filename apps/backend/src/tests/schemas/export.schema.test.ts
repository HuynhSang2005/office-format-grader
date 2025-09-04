/**
 * @file export.schema.test.ts
 * @description Unit tests cho export schema validation
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { ExportExcelRequestSchema } from '@/schemas/grade-request.schema';

describe('ExportExcelRequestSchema', () => {
  it('nên validate đúng với dữ liệu hợp lệ', () => {
    const validData = {
      resultIds: ['result-1', 'result-2'],
      includeDetails: true,
      groupBy: 'user' as const,
      format: 'xlsx' as const
    };

    const result = ExportExcelRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('nên validate đúng với dữ liệu tối thiểu', () => {
    const validData = {
      resultIds: ['result-1']
    };

    const result = ExportExcelRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
    
    // Kiểm tra default values
    if (result.success) {
      expect(result.data.includeDetails).toBe(true);
      expect(result.data.groupBy).toBe('none');
      expect(result.data.format).toBe('xlsx');
    }
  });

  it('nên từ chối khi resultIds rỗng', () => {
    const invalidData = {
      resultIds: []
    };

    const result = ExportExcelRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Phải có ít nhất 1 result');
    }
  });

  it('nên từ chối khi có quá nhiều resultIds', () => {
    const invalidData = {
      resultIds: Array(1001).fill('result-id')
    };

    const result = ExportExcelRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Không được export quá 1000 results');
    }
  });

  it('nên từ chối khi resultId là chuỗi rỗng', () => {
    const invalidData = {
      resultIds: ['']
    };

    const result = ExportExcelRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Result ID không được rỗng');
    }
  });

  it('nên từ chối khi format không hợp lệ', () => {
    const invalidData = {
      resultIds: ['result-1'],
      format: 'pdf' // Không hợp lệ
    };

    const result = ExportExcelRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid enum value. Expected 'xlsx', received 'pdf'");
    }
  });

  it('nên từ chối khi groupBy không hợp lệ', () => {
    const invalidData = {
      resultIds: ['result-1'],
      groupBy: 'invalid' // Không hợp lệ
    };

    const result = ExportExcelRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Expected 'user' | 'fileType' | 'rubric' | 'date' | 'none'");
    }
  });
});