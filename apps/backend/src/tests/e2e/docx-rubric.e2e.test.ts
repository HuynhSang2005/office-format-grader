import { describe, it, expect } from 'vitest';
import { detectors } from '../../rule-engine/detectors';

describe('DOCX Rubric Comprehensive Validation', () => {
  describe('DOCX Table of Contents Criteria', () => {
    it('should evaluate TOC criterion correctly for DOCX with no TOC', async () => {
      const mockFeatures = {
        filename: 'no-toc.docx',
        toc: null
      };

      const result = detectors['docx.toc'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('toc_0');
      expect(result.reason).toContain('Không có mục lục');
    });

    it('should evaluate TOC criterion correctly for DOCX with basic TOC', async () => {
      const mockFeatures = {
        filename: 'basic-toc.docx',
        toc: {
          exists: true,
          isAutomatic: true,
          entryCount: 2,
          hasPageNumbers: false,
          isUpdated: false
        }
      };

      const result = detectors['docx.toc'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.75);
      expect(result.level).toBe('toc_1');
      expect(result.reason).toContain('Có mục lục tự động nhưng chưa đầy đủ');
    });

    it('should evaluate TOC criterion correctly for DOCX with professional TOC', async () => {
      const mockFeatures = {
        filename: 'professional-toc.docx',
        toc: {
          exists: true,
          isAutomatic: true,
          entryCount: 5,
          hasPageNumbers: true,
          isUpdated: true
        }
      };

      const result = detectors['docx.toc'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1.5);
      expect(result.level).toBe('toc_2');
      expect(result.reason).toContain('TOC tự động đầy đủ');
    });
  });

  describe('DOCX Header/Footer Criteria', () => {
    it('should evaluate header/footer criterion correctly for DOCX with no headers/footers', async () => {
      const mockFeatures = {
        filename: 'no-headers-footers.docx',
        headerFooter: null
      };

      const result = detectors['docx.headerFooter'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('hf_0');
      expect(result.reason).toContain('Không có header/footer');
    });

    it('should evaluate header/footer criterion correctly for DOCX with basic headers/footers', async () => {
      const mockFeatures = {
        filename: 'basic-headers-footers.docx',
        headerFooter: {
          hasHeader: true,
          hasFooter: true,
          hasPageNumbers: false,
          headerContent: '',
          footerContent: ''
        }
      };

      const result = detectors['docx.headerFooter'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.5);
      expect(result.level).toBe('hf_1');
      expect(result.reason).toContain('Có header/footer nhưng thiếu thông tin');
    });

    it('should evaluate header/footer criterion correctly for DOCX with professional headers/footers', async () => {
      const mockFeatures = {
        filename: 'professional-headers-footers.docx',
        headerFooter: {
          hasHeader: true,
          hasFooter: true,
          hasPageNumbers: true,
          headerContent: 'Document Title',
          footerContent: 'Page 1 of N'
        }
      };

      const result = detectors['docx.headerFooter'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1);
      expect(result.level).toBe('hf_2');
      expect(result.reason).toContain('Header/Footer đầy đủ thông tin');
    });
  });

  describe('DOCX Table Criteria', () => {
    it('should evaluate table criterion correctly for DOCX with no tables', async () => {
      const mockFeatures = {
        filename: 'no-tables.docx',
        tables: { count: 0 }
      };

      const result = detectors['docx.table'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('table_0');
      expect(result.reason).toContain('Không có bảng nào');
    });

    it('should evaluate table criterion correctly for DOCX with basic tables', async () => {
      const mockFeatures = {
        filename: 'basic-tables.docx',
        tables: {
          count: 2,
          hasFormatting: false,
          hasBorders: true,
          hasShading: false,
          hasHeaderRow: false
        }
      };

      const result = detectors['docx.table'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.75);
      expect(result.level).toBe('table_1');
      expect(result.reason).toContain('Có bảng nhưng format đơn giản');
    });

    it('should evaluate table criterion correctly for DOCX with professional tables', async () => {
      const mockFeatures = {
        filename: 'professional-tables.docx',
        tables: {
          count: 3,
          hasFormatting: true,
          hasBorders: true,
          hasShading: true,
          hasHeaderRow: true
        }
      };

      const result = detectors['docx.table'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1.5);
      expect(result.level).toBe('table_2');
      expect(result.reason).toContain('Bảng đúng mẫu');
    });
  });

  describe('DOCX Equation Criteria', () => {
    it('should evaluate equation criterion correctly for DOCX with no equations', async () => {
      const mockFeatures = {
        filename: 'no-equations.docx',
        equations: { count: 0 }
      };

      const result = detectors['docx.equation'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('eq_0');
      expect(result.reason).toContain('Không có phương trình');
    });

    it('should evaluate equation criterion correctly for DOCX with basic equations', async () => {
      const mockFeatures = {
        filename: 'basic-equations.docx',
        equations: {
          count: 2,
          isUsingEquationEditor: true,
          complexity: 'simple'
        }
      };

      const result = detectors['docx.equation'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.75);
      expect(result.level).toBe('eq_1');
      expect(result.reason).toContain('Có dùng Equation nhưng đơn giản');
    });

    it('should evaluate equation criterion correctly for DOCX with professional equations', async () => {
      const mockFeatures = {
        filename: 'professional-equations.docx',
        equations: {
          count: 3,
          isUsingEquationEditor: true,
          complexity: 'complex'
        }
      };

      const result = detectors['docx.equation'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1.5);
      expect(result.level).toBe('eq_2');
      expect(result.reason).toContain('Dùng Equation Editor, công thức chính xác');
    });
  });

  describe('DOCX SmartArt Criteria', () => {
    it('should evaluate SmartArt criterion correctly for DOCX with no SmartArt', async () => {
      const mockFeatures = {
        filename: 'no-smartart.docx',
        smartArt: { count: 0 }
      };

      const result = detectors['docx.smartArt'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('smart_0');
      expect(result.reason).toContain('Không có SmartArt nào');
    });

    it('should evaluate SmartArt criterion correctly for DOCX with basic SmartArt', async () => {
      const mockFeatures = {
        filename: 'basic-smartart.docx',
        smartArt: {
          count: 2,
          hasCustomContent: false,
          complexity: 'simple'
        }
      };

      const result = detectors['docx.smartArt'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.75);
      expect(result.level).toBe('smart_1');
      expect(result.reason).toContain('Có SmartArt nhưng đơn giản');
    });

    it('should evaluate SmartArt criterion correctly for DOCX with professional SmartArt', async () => {
      const mockFeatures = {
        filename: 'professional-smartart.docx',
        smartArt: {
          count: 3,
          hasCustomContent: true,
          complexity: 'complex'
        }
      };

      const result = detectors['docx.smartArt'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1.5);
      expect(result.level).toBe('smart_2');
      expect(result.reason).toContain('SmartArt đúng loại');
    });
  });

  describe('DOCX Hyperlinks Criteria', () => {
    it('should evaluate hyperlinks criterion correctly for DOCX with no hyperlinks', async () => {
      const mockFeatures = {
        filename: 'no-hyperlinks.docx',
        hyperlinks: { count: 0 }
      };

      const result = detectors['docx.hyperlinks'](mockFeatures);

      expect(result.passed).toBe(false);
      expect(result.points).toBe(0);
      expect(result.level).toBe('link_0');
      expect(result.reason).toContain('Không có hyperlink nào');
    });

    it('should evaluate hyperlinks criterion correctly for DOCX with basic hyperlinks', async () => {
      const mockFeatures = {
        filename: 'basic-hyperlinks.docx',
        hyperlinks: {
          count: 3,
          hasExternalLinks: true,
          hasInternalLinks: false,
          isWorking: false
        }
      };

      const result = detectors['docx.hyperlinks'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(0.5);
      expect(result.level).toBe('link_1');
      expect(result.reason).toContain('Có hyperlink nhưng chưa hiệu quả');
    });

    it('should evaluate hyperlinks criterion correctly for DOCX with professional hyperlinks', async () => {
      const mockFeatures = {
        filename: 'professional-hyperlinks.docx',
        hyperlinks: {
          count: 5,
          hasExternalLinks: true,
          hasInternalLinks: true,
          isWorking: true
        }
      };

      const result = detectors['docx.hyperlinks'](mockFeatures);

      expect(result.passed).toBe(true);
      expect(result.points).toBe(1);
      expect(result.level).toBe('link_2');
      expect(result.reason).toContain('Có hyperlink hoạt động tốt');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle DOCX files with null or undefined features', async () => {
      const mockFeatures = {
        filename: 'edge-case.docx',
        toc: null,
        headerFooter: undefined,
        tables: null,
        equations: undefined,
        smartArt: null,
        hyperlinks: undefined
      };

      // Test all existing detectors
      const tocResult = detectors['docx.toc'](mockFeatures);
      expect(tocResult.passed).toBe(false);
      expect(tocResult.points).toBe(0);

      const hfResult = detectors['docx.headerFooter'](mockFeatures);
      expect(hfResult.passed).toBe(false);
      expect(hfResult.points).toBe(0);

      const tableResult = detectors['docx.table'](mockFeatures);
      expect(tableResult.passed).toBe(false);
      expect(tableResult.points).toBe(0);

      const eqResult = detectors['docx.equation'](mockFeatures);
      expect(eqResult.passed).toBe(false);
      expect(eqResult.points).toBe(0);

      const saResult = detectors['docx.smartArt'](mockFeatures);
      expect(saResult.passed).toBe(false);
      expect(saResult.points).toBe(0);

      const hlResult = detectors['docx.hyperlinks'](mockFeatures);
      expect(hlResult.passed).toBe(false);
      expect(hlResult.points).toBe(0);
    });

    it('should handle DOCX files with empty objects', async () => {
      const mockFeatures = {
        filename: 'empty-objects.docx',
        tables: { count: 0 },
        equations: { count: 0 },
        smartArt: { count: 0 },
        hyperlinks: { count: 0 }
      };

      const tableResult = detectors['docx.table'](mockFeatures);
      expect(tableResult.passed).toBe(false);
      expect(tableResult.points).toBe(0);

      const eqResult = detectors['docx.equation'](mockFeatures);
      expect(eqResult.passed).toBe(false);
      expect(eqResult.points).toBe(0);

      const saResult = detectors['docx.smartArt'](mockFeatures);
      expect(saResult.passed).toBe(false);
      expect(saResult.points).toBe(0);

      const hlResult = detectors['docx.hyperlinks'](mockFeatures);
      expect(hlResult.passed).toBe(false);
      expect(hlResult.points).toBe(0);
    });
  });

  describe('Integration with Grading Workflow', () => {
    it('should integrate DOCX criteria with grading workflow', async () => {
      const mockFeatures = {
        filename: 'comprehensive.docx',
        toc: {
          exists: true,
          isAutomatic: true,
          entryCount: 5,
          hasPageNumbers: true,
          isUpdated: true
        },
        headerFooter: {
          hasHeader: true,
          hasFooter: true,
          hasPageNumbers: true,
          headerContent: 'Document Title',
          footerContent: 'Page 1 of N'
        },
        tables: {
          count: 3,
          hasFormatting: true,
          hasBorders: true,
          hasShading: true,
          hasHeaderRow: true
        },
        equations: {
          count: 3,
          isUsingEquationEditor: true,
          complexity: 'complex'
        },
        smartArt: {
          count: 3,
          hasCustomContent: true,
          complexity: 'complex'
        },
        hyperlinks: {
          count: 5,
          hasExternalLinks: true,
          hasInternalLinks: true,
          isWorking: true
        }
      };

      // Test all criteria
      const tocResult = detectors['docx.toc'](mockFeatures);
      const hfResult = detectors['docx.headerFooter'](mockFeatures);
      const tableResult = detectors['docx.table'](mockFeatures);
      const eqResult = detectors['docx.equation'](mockFeatures);
      const saResult = detectors['docx.smartArt'](mockFeatures);
      const hlResult = detectors['docx.hyperlinks'](mockFeatures);

      // All should pass with professional level
      expect(tocResult.passed).toBe(true);
      expect(tocResult.level).toBe('toc_2');

      expect(hfResult.passed).toBe(true);
      expect(hfResult.level).toBe('hf_2');

      expect(tableResult.passed).toBe(true);
      expect(tableResult.level).toBe('table_2');

      expect(eqResult.passed).toBe(true);
      expect(eqResult.level).toBe('eq_2');

      expect(saResult.passed).toBe(true);
      expect(saResult.level).toBe('smart_2');

      expect(hlResult.passed).toBe(true);
      expect(hlResult.level).toBe('link_2');

      // Calculate total score
      const totalPoints = tocResult.points + hfResult.points + tableResult.points +
                         eqResult.points + saResult.points + hlResult.points;
      const maxPoints = 8; // Sum of all professional level points: 1.5 + 1 + 1.5 + 1.5 + 1.5 + 1

      expect(totalPoints).toBe(maxPoints);
    });
  });
});
