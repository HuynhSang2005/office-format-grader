/**
 * @file export-pdf.e2e.test.ts
 * @description End-to-end test cho tiêu chí "Export PDF" với API thực tế
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Note: In a real E2E test, we would use a testing framework like Playwright or Cypress
// to test the full flow. For now, we'll simulate the API calls.

describe('PPTX Export PDF End-to-End Tests', () => {
  const testFilesDir = join(__dirname, '../../../examples/pptx');
  const testFiles = [
    '049306003690-Nguyễn Đoan Trang-DEPPT01.pptx'
  ];

  beforeAll(() => {
    // Setup before all tests if needed
  });

  afterAll(() => {
    // Cleanup after all tests if needed
  });

  it('should have pptx.exportPdf criterion in preset rubric', async () => {
    // This test would normally make an HTTP request to:
    // GET /api/criteria?source=preset&fileType=PPTX
    
    // For now, we'll just verify the preset rubric contains the criterion
    const presetRubricPath = join(__dirname, '../../../src/config/presets/defaultRubric.pptx.json');
    const presetRubricContent = await readFile(presetRubricPath, 'utf-8');
    const presetRubric = JSON.parse(presetRubricContent);
    
    const exportPdfCriterion = presetRubric.criteria.find(
      (criterion: any) => criterion.id === 'pptx_export_pdf'
    );
    
    expect(exportPdfCriterion).toBeDefined();
    expect(exportPdfCriterion.detectorKey).toBe('common.exportPdf');
    expect(exportPdfCriterion.maxPoints).toBe(0.5);
    
    // Verify the levels are correctly defined
    expect(exportPdfCriterion.levels).toHaveLength(2);
    expect(exportPdfCriterion.levels[0].code).toBe('pdf_0');
    expect(exportPdfCriterion.levels[0].points).toBe(0);
    expect(exportPdfCriterion.levels[1].code).toBe('pdf_1');
    expect(exportPdfCriterion.levels[1].points).toBe(0.5);
  });

  it('should evaluate export PDF criterion correctly through the rule engine', async () => {
    // This test would normally:
    // 1. Upload a PPTX file
    // 2. Trigger grading
    // 3. Check that the export PDF criterion is evaluated correctly
    
    // For now, we'll just verify the detector works as expected
    const { detectors } = await import('../../rule-engine/detectors');
    
    // Test with features that should pass
    const passingFeatures = {
      hasPdfExport: true,
      pdfPageCount: 5
    };
    
    const result = detectors['common.exportPdf'](passingFeatures);
    
    expect(result).toEqual({
      passed: true,
      points: 0.5,
      level: 'pdf_1',
      reason: 'Xuất PDF chính xác, không lỗi layout'
    });
  });

  it('should handle export PDF criterion in supported criteria API', async () => {
    // This test would normally make an HTTP request to:
    // GET /api/criteria/supported?fileType=PPTX
    
    // For now, we'll just verify that the supported criteria include the export PDF criterion
    const { getSupportedCriteria } = await import('../../services/criteria.service');
    
    const supportedCriteria = await getSupportedCriteria('PPTX');
    
    const exportPdfCriterion = supportedCriteria.find(
      criterion => criterion.detectorKey === 'common.exportPdf'
    );
    
    expect(exportPdfCriterion).toBeDefined();
    expect(exportPdfCriterion?.name).toBe('Export PDF');
    expect(exportPdfCriterion?.fileTypes).toContain('PPTX');
    expect(exportPdfCriterion?.fileTypes).toContain('DOCX');
    expect(exportPdfCriterion?.defaultMaxPoints).toBe(0.5);
  });
});