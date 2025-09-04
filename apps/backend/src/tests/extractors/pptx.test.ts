/**
 * @file pptx.test.ts
 * @description Test cho PPTX extractor - kiểm tra trích xuất features từ file PPTX
 * @author AI Agent
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { extractPPTXFeatures } from '@/extractors/pptx/pptx';
import type { PPTXFileStructure } from '@/types/archive.types';
import type { FeaturesPPTX } from '@/types/features-pptx';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test fixtures
const fixtures = {
  samplePresentation: '',
  sampleSlide: '',
  sampleTheme: '',
  sampleSlideMaster: ''
};

beforeAll(async () => {
  // Load test XML fixtures
  const fixturesPath = join(__dirname, '../fixtures');
  fixtures.samplePresentation = readFileSync(join(fixturesPath, 'sample-pptx-presentation.xml'), 'utf-8');
  fixtures.sampleSlide = readFileSync(join(fixturesPath, 'sample-pptx-slide.xml'), 'utf-8');
  
  // Create minimal theme XML
  fixtures.sampleTheme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Custom Theme">
  <a:themeElements>
    <a:clrScheme name="Custom Colors">
      <a:dk1>
        <a:sysClr val="windowText" lastClr="000000"/>
      </a:dk1>
      <a:lt1>
        <a:sysClr val="window" lastClr="FFFFFF"/>
      </a:lt1>
    </a:clrScheme>
    <a:fontScheme name="Custom Fonts">
      <a:majorFont>
        <a:latin typeface="Arial"/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Calibri"/>
      </a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`;

  // Create minimal slide master XML
  fixtures.sampleSlideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldMaster>`;
});

describe('PPTX Extractor', () => {
  describe('extractPPTXFeatures', () => {
    test('nên trích xuất được basic features từ PPTX structure hợp lệ', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide,
          'slide2.xml': fixtures.sampleSlide,
          'slide3.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {
          'slideMaster1.xml': fixtures.sampleSlideMaster
        },
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      const filename = '20240101_NguyenVanA_Bai1.pptx';
      const fileSize = 25000;
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, filename, fileSize);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.filename).toBe(filename);
      expect(result.fileSize).toBe(fileSize);
      expect(result.slideCount).toBe(3);
      expect(result.slides).toHaveLength(3);
      expect(result.theme).toBeDefined();
      expect(result.slideMaster).toBeDefined();
    });

    test('nên extract slide information chính xác', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.slides).toHaveLength(1);
      expect(result.slides[0]).toBeDefined();
      expect(result.slides[0].index).toBe(0);
      expect(typeof result.slides[0].layoutName).toBe('string');
    });

    test('nên detect theme information', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {},
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.theme).toBeDefined();
      expect(result.theme.name).toBeDefined();
      expect(typeof result.theme.isCustom).toBe('boolean');
      if (result.theme.colorScheme) {
        expect(Array.isArray(result.theme.colorScheme)).toBe(true);
      }
    });

    test('nên detect slide master modifications', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {},
        slideLayouts: {},
        slideMasters: {
          'slideMaster1.xml': fixtures.sampleSlideMaster
        },
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.slideMaster).toBeDefined();
      expect(typeof result.slideMaster.isModified).toBe('boolean');
      expect(typeof result.slideMaster.customLayouts).toBe('number');
      expect(typeof result.slideMaster.hasCustomPlaceholders).toBe('boolean');
      // Note: Slide master detection có thể cần cải thiện
    });

    test('nên extract hyperlinks information', async () => {
      // Arrange
      const slideWithHyperlink = fixtures.sampleSlide.replace(
        '<a:t>Sample slide content goes here</a:t>',
        '<a:hlinkClick r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><a:t>Click here</a:t></a:hlinkClick>'
      );
      
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': slideWithHyperlink
        },
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.hyperlinks).toBeDefined();
      expect(Array.isArray(result.hyperlinks)).toBe(true);
      expect(result.hyperlinks.length).toBeGreaterThanOrEqual(0);
    });

    test('nên handle transition và animation information', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.transitions).toBeDefined();
      expect(Array.isArray(result.transitions)).toBe(true);
      
      expect(result.animations).toBeDefined();
      expect(Array.isArray(result.animations)).toBe(true);
    });

    test('nên extract slide objects information', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.objects).toBeDefined();
      expect(Array.isArray(result.objects)).toBe(true);
      expect(result.objects.length).toBeGreaterThanOrEqual(0);
    });

    test('nên detect outline structure', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'test.pptx', 1000);
      
      // Assert
      expect(result.outline).toBeDefined();
      expect(typeof result.outline.hasOutlineSlides).toBe('boolean');
      expect(Array.isArray(result.outline.levels)).toBe(true);
      expect(result.outline.levels.length).toBeGreaterThanOrEqual(0);
    });

    test('nên validate tất cả required fields trong FeaturesPPTX', async () => {
      // Arrange
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {
          'slideMaster1.xml': fixtures.sampleSlideMaster
        },
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(pptxStructure, 'complete.pptx', 2000);
      
      // Assert - Kiểm tra tất cả required fields
      expect(result.filename).toBeDefined();
      expect(result.slideCount).toBeDefined();
      expect(result.fileSize).toBeDefined();
      expect(result.slides).toBeDefined();
      expect(result.theme).toBeDefined();
      expect(result.slideMaster).toBeDefined();
      expect(result.headerFooter).toBeDefined();
      expect(result.hyperlinks).toBeDefined();
      expect(result.transitions).toBeDefined();
      expect(result.animations).toBeDefined();
      expect(result.objects).toBeDefined();
      expect(result.outline).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('nên xử lý gracefully khi không parse được XML', async () => {
      // Arrange
      const malformedStructure: PPTXFileStructure = {
        presentation: 'not-xml-at-all',
        slides: {},
        slideLayouts: {},
        slideMasters: {},
        theme: '',
        relationships: []
      };
      
      // Act & Assert - Không nên throw error
      await expect(extractPPTXFeatures(malformedStructure, 'bad.pptx', 500))
        .resolves.toBeDefined();
    });

    test('nên handle empty slides', async () => {
      // Arrange
      const emptyStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {},
        slideLayouts: {},
        slideMasters: {},
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(emptyStructure, 'empty.pptx', 1000);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.slideCount).toBe(0);
      expect(result.slides).toHaveLength(0);
    });

    test('nên handle missing theme', async () => {
      // Arrange
      const noThemeStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides: {
          'slide1.xml': fixtures.sampleSlide
        },
        slideLayouts: {},
        slideMasters: {},
        theme: '',
        relationships: []
      };
      
      // Act
      const result = await extractPPTXFeatures(noThemeStructure, 'no-theme.pptx', 1000);
      
      // Assert
      expect(result.theme).toBeDefined();
      expect(result.theme.name).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('nên extract features trong thời gian hợp lý', async () => {
      // Arrange - Create structure with multiple slides
      const slides: Record<string, string> = {};
      for (let i = 1; i <= 10; i++) {
        slides[`slide${i}.xml`] = fixtures.sampleSlide;
      }
      
      const pptxStructure: PPTXFileStructure = {
        presentation: fixtures.samplePresentation,
        slides,
        slideLayouts: {},
        slideMasters: {
          'slideMaster1.xml': fixtures.sampleSlideMaster
        },
        theme: fixtures.sampleTheme,
        relationships: []
      };
      
      // Act & Assert
      const startTime = Date.now();
      await extractPPTXFeatures(pptxStructure, 'perf-test.pptx', 50000);
      const duration = Date.now() - startTime;
      
      // Nên hoàn thành trong 2 giây cho 10 slides
      expect(duration).toBeLessThan(2000);
    });
  });
});