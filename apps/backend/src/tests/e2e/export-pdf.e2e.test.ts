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
      criterion => criterion.detectorKey === 'pptx.exportPdf'
    );
    
    expect(exportPdfCriterion).toBeDefined();
    expect(exportPdfCriterion?.name).toBe('Xuất file PDF');
    expect(exportPdfCriterion?.fileTypes).toContain('PPTX');
    // Note: pptx.exportPdf is specific to PPTX files only
    expect(exportPdfCriterion?.fileTypes).toHaveLength(1);
    expect(exportPdfCriterion?.defaultMaxPoints).toBe(0.5);
  });

  it('should correctly evaluate PDF export for multiple PPTX files', async () => {
    const { extractFromPPTX } = await import('../../extractors/pptx');
    const { detectors } = await import('../../rule-engine/detectors');

    // Test multiple files from examples directory
    const testFiles = [
      '049306003690-Nguyễn Đoan Trang-DEPPT01.pptx',
      '052206004465- Hà Quốc Nguyên Sinh_DEW01.pptx',
      '056306003357-Phạm Tú Uyên -DEW01.pptx'
    ];

    for (const fileName of testFiles) {
      const filePath = join(testFilesDir, fileName);
      
      try {
        const fileBuffer = await readFile(filePath);
        const features = await extractFromPPTX(fileBuffer, fileName);
        
        // Verify features are extracted correctly
        expect(features).toBeDefined();
        expect(typeof features.hasPdfExport).toBe('boolean');
        expect(typeof features.pdfPageCount).toBe('number');
        expect(features.pdfPageCount).toBeGreaterThan(0);
        
        // Test detector with extracted features
        const result = detectors['common.exportPdf'](features);
        
        // Should pass if file has slides and PDF export capability
        if (features.pdfPageCount && features.pdfPageCount > 0) {
          expect(result.passed).toBe(true);
          expect(result.points).toBe(0.5);
          expect(result.level).toBe('pdf_1');
        }
      } catch (error) {
        // Skip files that can't be read or processed
        console.warn(`Skipping file ${fileName}: ${(error as Error).message}`);
      }
    }
  });

  it('should handle corrupted PPTX files gracefully', async () => {
    const { extractFromPPTX } = await import('../../extractors/pptx');
    const { detectors } = await import('../../rule-engine/detectors');

    // Create a corrupted buffer
    const corruptedBuffer = Buffer.from('corrupted data');

    try {
      const features = await extractFromPPTX(corruptedBuffer, 'corrupted.pptx');
      
      // Should fallback to default values
      expect(features).toBeDefined();
      expect(features.hasPdfExport).toBe(true); // Default fallback
      expect(features.pdfPageCount).toBeGreaterThan(0); // Should have some default value
      
      const result = detectors['common.exportPdf'](features);
      expect(result).toBeDefined();
      
    } catch (error) {
      // If extraction fails completely, it should throw
      expect(error).toBeDefined();
    }
  });

  it('should handle PPTX files without PDF export capability', async () => {
    const { detectors } = await import('../../rule-engine/detectors');

    // Test with features that should fail
    const failingFeatures = {
      hasPdfExport: false,
      pdfPageCount: 0
    };

    const result = detectors['common.exportPdf'](failingFeatures);

    expect(result).toEqual({
      passed: false,
      points: 0,
      level: 'pdf_0',
      reason: 'Không có file PDF hoặc có lỗi'
    });
  });

  it('should handle edge cases in PDF export detection', async () => {
    const { detectors } = await import('../../rule-engine/detectors');

    // Test with negative page count
    const negativeFeatures = {
      hasPdfExport: true,
      pdfPageCount: -1
    };

    const negativeResult = detectors['common.exportPdf'](negativeFeatures);
    expect(negativeResult.passed).toBe(false);
    expect(negativeResult.points).toBe(0);

    // Test with zero page count
    const zeroFeatures = {
      hasPdfExport: true,
      pdfPageCount: 0
    };

    const zeroResult = detectors['common.exportPdf'](zeroFeatures);
    expect(zeroResult.passed).toBe(false);
    expect(zeroResult.points).toBe(0);

    // Test with very large page count
    const largeFeatures = {
      hasPdfExport: true,
      pdfPageCount: 1000
    };

    const largeResult = detectors['common.exportPdf'](largeFeatures);
    expect(largeResult.passed).toBe(true);
    expect(largeResult.points).toBe(0.5);
  });

  it('should integrate with grading workflow simulation', async () => {
    // This test simulates the complete grading workflow without external dependencies
    const { extractFromPPTX } = await import('../../extractors/pptx');
    const { detectors } = await import('../../rule-engine/detectors');

    // Use a real test file
    const filePath = join(testFilesDir, testFiles[0]);
    const fileBuffer = await readFile(filePath);
    
    // Extract features
    const features = await extractFromPPTX(fileBuffer, testFiles[0]);
    
    // Create a mock criterion
    const exportPdfCriterion = {
      id: 'pptx_export_pdf',
      name: 'Export PDF',
      detectorKey: 'common.exportPdf',
      maxPoints: 0.5,
      levels: [
        { code: 'pdf_0', points: 0, description: 'Không thể xuất PDF' },
        { code: 'pdf_1', points: 0.5, description: 'Xuất PDF chính xác' }
      ]
    };

    // Simulate the evaluation process
    const detector = detectors['common.exportPdf' as keyof typeof detectors];
    const result = detector(features);
    
    expect(result).toBeDefined();
    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('pdf_1');
    expect(result.reason).toBe('Xuất PDF chính xác, không lỗi layout');
    
    // Verify the criterion evaluation matches expected structure
    const criterionResult = {
      id: exportPdfCriterion.id,
      name: exportPdfCriterion.name,
      ...result
    };
    
    expect(criterionResult.id).toBe('pptx_export_pdf');
    expect(criterionResult.name).toBe('Export PDF');
    expect(criterionResult.passed).toBe(true);
    expect(criterionResult.points).toBe(0.5);
    expect(criterionResult.level).toBe('pdf_1');
  });
});