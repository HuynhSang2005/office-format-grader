/**
 * @file criteria-export-pdf.test.ts
 * @description Test cho tiêu chí "Export PDF" trong criteria
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectors } from '../../rule-engine/index';

describe('PPTX Export PDF Criterion Tests', () => {
  beforeEach(() => {
    // Setup before each test if needed
  });

  afterEach(() => {
    // Cleanup after each test if needed
  });

  it('should delegate pptx.exportPdf to common.exportPdf', () => {
    const mockFeatures = {
      hasPdfExport: true,
      pdfPageCount: 5
    };
    
    const pptxResult = detectors['pptx.exportPdf'](mockFeatures);
    const commonResult = detectors['common.exportPdf'](mockFeatures);
    
    expect(pptxResult).toEqual(commonResult);
  });

  it('should pass export PDF criterion when hasPdfExport is true and pdfPageCount > 0', () => {
    const features = {
      hasPdfExport: true,
      pdfPageCount: 5
    };
    
    const result = detectors['common.exportPdf'](features);
    
    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('pdf_1');
    expect(result.reason).toBe('Xuất PDF chính xác, không lỗi layout');
  });

  it('should fail export PDF criterion when hasPdfExport is false', () => {
    const features = {
      hasPdfExport: false,
      pdfPageCount: 5
    };
    
    const result = detectors['common.exportPdf'](features);
    
    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(result.level).toBe('pdf_0');
    expect(result.reason).toBe('Không có file PDF hoặc có lỗi');
  });

  it('should fail export PDF criterion when pdfPageCount is 0 or undefined', () => {
    const features1 = {
      hasPdfExport: true,
      pdfPageCount: 0
    };
    
    const result1 = detectors['common.exportPdf'](features1);
    
    expect(result1.passed).toBe(false);
    expect(result1.points).toBe(0);
    expect(result1.level).toBe('pdf_0');
    expect(result1.reason).toBe('File PDF có vấn đề về layout');
    
    const features2 = {
      hasPdfExport: true
      // pdfPageCount is undefined
    };
    
    const result2 = detectors['common.exportPdf'](features2);
    
    expect(result2.passed).toBe(false);
    expect(result2.points).toBe(0);
    expect(result2.level).toBe('pdf_0');
    expect(result2.reason).toBe('File PDF có vấn đề về layout');
  });

  it('should assume PDF export capability for PPTX files when hasPdfExport is undefined', () => {
    const features = {
      // hasPdfExport is undefined, but should be treated as true for PPTX files
      pdfPageCount: 5
    };
    
    const result = detectors['common.exportPdf'](features);
    
    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('pdf_1');
    expect(result.reason).toBe('Xuất PDF chính xác, không lỗi layout');
  });
});