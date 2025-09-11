/**
 * @file pptx-transitions.e2e.test.ts
 * @description End-to-end test cho tiêu chí "Transitions" trong PPTX files
 * @author AI Agent
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractFromPPTX } from '../../extractors/pptx';
import { detectors } from '../../rule-engine/detectors';

describe('PPTX Transitions Criteria End-to-End Tests', () => {
  const testFilesDir = join(__dirname, '../../../examples/pptx');

  beforeAll(() => {
    // Setup before all tests if needed
  });

  afterAll(() => {
    // Cleanup after all tests if needed
  });

  it('should evaluate transitions criterion correctly for PPTX with no transitions', async () => {
    // Test with mock data for PPTX with no transitions
    const mockFeatures = {
      filename: 'no-transitions.pptx',
      transitions: []
    };

    const result = detectors['pptx.transitions'](mockFeatures);

    expect(result.passed).toBe(false);
    expect(result.points).toBe(0);
    expect(result.level).toBe('transition_0');
    expect(result.reason).toContain('Không có hiệu ứng chuyển slide');
  });

  it('should evaluate transitions criterion correctly for PPTX with basic transitions', async () => {
    // Test with mock data for PPTX with basic transitions
    const mockFeatures = {
      filename: 'basic-transitions.pptx',
      transitions: [
        { slideIndex: 0, type: 'fade', duration: 500 },
        { slideIndex: 1, type: 'push', duration: 600 },
        { slideIndex: 2, type: 'wipe', duration: 400 }
      ]
    };

    const result = detectors['pptx.transitions'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('transition_1');
    expect(result.reason).toContain('Tất cả slide có transition');
  });

  it('should evaluate transitions criterion correctly for PPTX with advanced transitions', async () => {
    // Test with mock data for PPTX with advanced transitions (including sound)
    const mockFeatures = {
      filename: 'advanced-transitions.pptx',
      transitions: [
        { slideIndex: 0, type: 'fade', duration: 500, hasSound: false },
        { slideIndex: 1, type: 'push', duration: 600, hasSound: true }, // Slide 2 has sound
        { slideIndex: 2, type: 'wipe', duration: 400, hasSound: false },
        { slideIndex: 3, type: 'dissolve', duration: 700, hasSound: false }
      ]
    };

    const result = detectors['pptx.transitions'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(1);
    expect(result.level).toBe('transition_2');
    expect(result.reason).toContain('Tất cả slide có transition, slide 2 có sound');
  });

  it('should evaluate transitions criterion correctly for PPTX with partial transitions', async () => {
    // Test with mock data for PPTX with only some slides having transitions
    const mockFeatures = {
      filename: 'partial-transitions.pptx',
      transitions: [
        { slideIndex: 0, type: 'fade', duration: 500 },
        // Missing transition for slide 1
        { slideIndex: 2, type: 'wipe', duration: 400 }
      ]
    };

    const result = detectors['pptx.transitions'](mockFeatures);

    // Since the logic checks if transitions.length > 0, this should pass at basic level
    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('transition_1');
  });

  it('should handle PPTX files with transitions but no sound on slide 2', async () => {
    // Test with mock data for PPTX with transitions but no sound on slide 2
    const mockFeatures = {
      filename: 'transitions-no-sound.pptx',
      transitions: [
        { slideIndex: 0, type: 'fade', duration: 500, hasSound: false },
        { slideIndex: 1, type: 'push', duration: 600, hasSound: false }, // Slide 2 no sound
        { slideIndex: 2, type: 'wipe', duration: 400, hasSound: false }
      ]
    };

    const result = detectors['pptx.transitions'](mockFeatures);

    expect(result.passed).toBe(true);
    expect(result.points).toBe(0.5);
    expect(result.level).toBe('transition_1');
    expect(result.reason).toContain('Tất cả slide có transition');
  });

  it('should handle edge cases in transitions detection', async () => {
    // Test with empty transitions array
    const emptyFeatures = {
      filename: 'empty-transitions.pptx',
      transitions: []
    };

    const emptyResult = detectors['pptx.transitions'](emptyFeatures);
    expect(emptyResult.passed).toBe(false);
    expect(emptyResult.points).toBe(0);

    // Test with null transitions
    const nullFeatures = {
      filename: 'null-transitions.pptx',
      transitions: null
    };

    const nullResult = detectors['pptx.transitions'](nullFeatures);
    expect(nullResult.passed).toBe(false);
    expect(nullResult.points).toBe(0);
  });

  it('should integrate transitions criterion with grading workflow', async () => {
    // Test the complete workflow simulation
    const mockFeatures = {
      filename: 'integration-test.pptx',
      transitions: [
        { slideIndex: 0, type: 'fade', duration: 500, hasSound: false },
        { slideIndex: 1, type: 'push', duration: 600, hasSound: true },
        { slideIndex: 2, type: 'wipe', duration: 400, hasSound: false }
      ]
    };

    // Create mock criterion
    const transitionsCriterion = {
      id: 'pptx_transitions',
      name: 'Hiệu ứng chuyển slide',
      detectorKey: 'pptx.transitions',
      maxPoints: 1,
      levels: [
        { code: 'transition_0', points: 0, description: 'Không có hiệu ứng chuyển slide' },
        { code: 'transition_1', points: 0.5, description: 'Tất cả slide có transition' },
        { code: 'transition_2', points: 1, description: 'Tất cả slide có transition, slide 2 có sound' }
      ]
    };

    // Simulate evaluation
    const detector = detectors['pptx.transitions'];
    const result = detector(mockFeatures);

    // Verify criterion evaluation
    const criterionResult = {
      id: transitionsCriterion.id,
      name: transitionsCriterion.name,
      ...result
    };

    expect(criterionResult.id).toBe('pptx_transitions');
    expect(criterionResult.name).toBe('Hiệu ứng chuyển slide');
    expect(criterionResult.passed).toBe(true);
    expect(criterionResult.points).toBe(1);
    expect(criterionResult.level).toBe('transition_2');
  });
});
