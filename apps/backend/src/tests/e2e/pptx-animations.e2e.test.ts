/**
 * @file pptx-animations.e2e.test.ts
 * @description End-to-end test cho tiêu chí "Animations" trong PPTX files
 * @author AI Agent
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractFromPPTX } from '../../extractors/pptx';
import { detectors } from '../../rule-engine/detectors';

describe('PPTX Animations Criteria End-to-End Tests', () => {
  const testFilesDir = join(__dirname, '../../../examples/pptx');

  beforeAll(() => {
    // Setup before all tests if needed
  });

  afterAll(() => {
    // Cleanup after all tests if needed
  });

  it('should evaluate animations criterion correctly for PPTX with no animations', async () => {
    // Test with mock data for PPTX with no animations
    const mockFeatures = {
      filename: 'no-animations.pptx',
      animations: []
    };

    const result = detectors['pptx.animations'](mockFeatures);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(result.level).toBe('anim_0');
    expect(result.reason).toContain('Không có animation nào');
  });

  it('should evaluate animations criterion correctly for PPTX with basic animations', async () => {
    // Test with mock data for PPTX with basic animations (single type)
    const mockFeatures = {
      filename: 'basic-animations.pptx',
      animations: [
        { slideIndex: 0, animationType: 'fade', target: 'title', duration: 500 },
        { slideIndex: 1, animationType: 'fade', target: 'content', duration: 600 },
        { slideIndex: 2, animationType: 'fade', target: 'image', duration: 400 }
      ]
    };

    const result = detectors['pptx.animations'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('anim_1');
    expect(result.reason).toContain('Có animation cơ bản');
  });

  it('should evaluate animations criterion correctly for PPTX with professional animations', async () => {
    // Test with mock data for PPTX with professional animations (multiple types)
    const mockFeatures = {
      filename: 'professional-animations.pptx',
      animations: [
        { slideIndex: 0, animationType: 'fade', target: 'title', duration: 500 },
        { slideIndex: 1, animationType: 'fly', target: 'content', duration: 600 },
        { slideIndex: 2, animationType: 'zoom', target: 'image', duration: 400 },
        { slideIndex: 3, animationType: 'spin', target: 'shape', duration: 700 },
        { slideIndex: 4, animationType: 'wipe', target: 'chart', duration: 800 }
      ]
    };

    const result = detectors['pptx.animations'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(1);
    expect(result.level).toBe('anim_2');
    expect(result.reason).toContain('Có animation chuyên nghiệp, đa dạng loại');
  });

  it('should evaluate animations criterion correctly for PPTX with single animation type', async () => {
    // Test with mock data for PPTX with only one type of animation
    const mockFeatures = {
      filename: 'single-type-animations.pptx',
      animations: [
        { slideIndex: 0, animationType: 'fade', target: 'title', duration: 500 },
        { slideIndex: 1, animationType: 'fade', target: 'content', duration: 600 },
        { slideIndex: 2, animationType: 'fade', target: 'image', duration: 400 }
      ]
    };

    const result = detectors['pptx.animations'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('anim_1');
    expect(result.reason).toContain('Có animation cơ bản');
  });

  it('should handle PPTX files with animations but single type', async () => {
    // Test with mock data for PPTX with animations of only one type
    const mockFeatures = {
      filename: 'uniform-animations.pptx',
      animations: [
        { slideIndex: 0, animationType: 'appear', target: 'title', duration: 500 },
        { slideIndex: 1, animationType: 'appear', target: 'content', duration: 600 },
        { slideIndex: 2, animationType: 'appear', target: 'image', duration: 400 }
      ]
    };

    const result = detectors['pptx.animations'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('anim_1');
    expect(result.reason).toContain('Có animation cơ bản');
  });

  it('should handle edge cases in animations detection', async () => {
    // Test with empty animations array
    const emptyFeatures = {
      filename: 'empty-animations.pptx',
      animations: []
    };

    const emptyResult = detectors['pptx.animations'](emptyFeatures);
    expect(emptyResult.passed).toBe(false);
    expect(emptyResult.points).toBe(0);

    // Test with null animations
    const nullFeatures = {
      filename: 'null-animations.pptx',
      animations: null
    };

    const nullResult = detectors['pptx.animations'](nullFeatures);
    expect(nullResult.passed).toBe(false);
    expect(nullResult.points).toBe(0);

    // Test with undefined animations
    const undefinedFeatures = {
      filename: 'undefined-animations.pptx'
      // animations is undefined
    };

    const undefinedResult = detectors['pptx.animations'](undefinedFeatures);
    expect(undefinedResult.passed).toBe(false);
    expect(undefinedResult.points).toBe(0);
  });

  it('should integrate animations criterion with grading workflow', async () => {
    // Test the complete workflow simulation
    const mockFeatures = {
      filename: 'integration-test.pptx',
      animations: [
        { slideIndex: 0, animationType: 'fade', target: 'title', duration: 500 },
        { slideIndex: 1, animationType: 'fly', target: 'content', duration: 600 },
        { slideIndex: 2, animationType: 'zoom', target: 'image', duration: 400 },
        { slideIndex: 3, animationType: 'spin', target: 'shape', duration: 700 }
      ]
    };

    // Create mock criterion
    const animationsCriterion = {
      id: 'pptx_animations',
      name: 'Animation effects',
      detectorKey: 'pptx.animations',
      maxPoints: 1,
      levels: [
        { code: 'anim_0', points: 0, description: 'Không có animation nào' },
        { code: 'anim_1', points: 0.5, description: 'Có animation cơ bản' },
        { code: 'anim_2', points: 1, description: 'Có animation chuyên nghiệp, đa dạng loại' }
      ]
    };

    // Simulate evaluation
    const detector = detectors['pptx.animations'];
    const result = detector(mockFeatures);

    // Verify criterion evaluation
    const criterionResult = {
      id: animationsCriterion.id,
      name: animationsCriterion.name,
      ...result
    };

    expect(criterionResult.id).toBe('pptx_animations');
    expect(criterionResult.name).toBe('Animation effects');
    expect(criterionResult.passed).toBe(true);
    expect(criterionResult.points).toBe(1);
    expect(criterionResult.level).toBe('anim_2');
  });
});
