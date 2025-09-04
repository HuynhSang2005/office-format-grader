/**
 * @file scoring.test.ts
 * @description Test cho rule engine scoring - kiểm tra tính điểm và làm tròn
 * @author AI Agent
 */

import { describe, test, expect } from 'vitest';
import {
  roundPoints,
  scoreCriterion,
  calculateTotalScore,
  calculatePercentage,
  createGradeResult,
  validateScore,
  calculateBatchStats,
  defaultScoringConfig,
  type ScoringConfig,
  type BatchScoreStats
} from '@/rule-engine/scoring';
import type { Criterion, CriterionEvalResult, GradeResult, RoundingMethod } from '@/types/criteria';

describe('Rule Engine Scoring', () => {
  describe('roundPoints', () => {
    test('nên làm tròn chính xác với half_up_0.25', () => {
      const method: RoundingMethod = 'half_up_0.25';
      
      // Test cases cho 0.25 rounding
      expect(roundPoints(1.1, method)).toBe(1);
      expect(roundPoints(1.125, method)).toBe(1.25);
      expect(roundPoints(1.2, method)).toBe(1.25);
      expect(roundPoints(1.3, method)).toBe(1.25);
      expect(roundPoints(1.375, method)).toBe(1.5);
      expect(roundPoints(1.4, method)).toBe(1.5);
      expect(roundPoints(1.6, method)).toBe(1.5);
      expect(roundPoints(1.625, method)).toBe(1.75);
      expect(roundPoints(1.7, method)).toBe(1.75);
      expect(roundPoints(1.875, method)).toBe(2);
      expect(roundPoints(1.9, method)).toBe(2);
    });

    test('nên không làm tròn với method = none', () => {
      const method: RoundingMethod = 'none';
      
      expect(roundPoints(1.123456, method)).toBe(1.123456);
      expect(roundPoints(1.7, method)).toBe(1.7);
      expect(roundPoints(2.345, method)).toBe(2.345);
    });

    test('nên xử lý edge cases', () => {
      const method: RoundingMethod = 'half_up_0.25';
      
      expect(roundPoints(0, method)).toBe(0);
      expect(roundPoints(0.1, method)).toBe(0);
      expect(roundPoints(0.125, method)).toBe(0.25);
      expect(roundPoints(-1.3, method)).toBe(-1.25);
    });
  });

  describe('scoreCriterion', () => {
    const mockCriterion: Criterion = {
      id: 'test_criterion',
      name: 'Test Criterion',
      description: 'Test description',
      detectorKey: 'docx.toc',
      maxPoints: 2,
      levels: [
        { code: 'excellent', name: 'Excellent', points: 2, description: 'Perfect' },
        { code: 'good', name: 'Good', points: 1.5, description: 'Good' },
        { code: 'fair', name: 'Fair', points: 1, description: 'Fair' },
        { code: 'poor', name: 'Poor', points: 0, description: 'Poor' }
      ]
    };

    test('nên giới hạn điểm không vượt quá maxPoints', () => {
      // Arrange
      const result: CriterionEvalResult = {
        passed: true,
        points: 3, // Vượt quá maxPoints (2)
        level: 'excellent',
        reason: 'Test reason'
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const scored = scoreCriterion(result, mockCriterion, config);
      
      // Assert
      expect(scored.points).toBe(2); // Bị giới hạn bởi maxPoints
    });

    test('nên đảm bảo điểm không âm', () => {
      // Arrange
      const result: CriterionEvalResult = {
        passed: false,
        points: -1,
        level: 'poor',
        reason: 'Failed test'
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const scored = scoreCriterion(result, mockCriterion, config);
      
      // Assert
      expect(scored.points).toBe(0);
    });

    test('nên áp dụng rounding correctly', () => {
      // Arrange
      const result: CriterionEvalResult = {
        passed: true,
        points: 1.3,
        level: 'good',
        reason: 'Good result'
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const scored = scoreCriterion(result, mockCriterion, config);
      
      // Assert
      expect(scored.points).toBe(1.25);
    });
  });

  describe('calculateTotalScore', () => {
    test('nên tính tổng điểm chính xác', () => {
      // Arrange
      const results: Record<string, CriterionEvalResult> = {
        criterion1: { passed: true, points: 1.5, level: 'good', reason: 'Good' },
        criterion2: { passed: true, points: 2, level: 'excellent', reason: 'Perfect' },
        criterion3: { passed: false, points: 0.5, level: 'poor', reason: 'Failed' }
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const total = calculateTotalScore(results, config);
      
      // Assert
      expect(total).toBe(4); // 1.5 + 2 + 0.5 = 4.0
    });

    test('nên áp dụng rounding cho tổng điểm', () => {
      // Arrange
      const results: Record<string, CriterionEvalResult> = {
        criterion1: { passed: true, points: 1.1, level: 'fair', reason: 'Fair' },
        criterion2: { passed: true, points: 1.2, level: 'fair', reason: 'Fair' }
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const total = calculateTotalScore(results, config);
      
      // Assert
      expect(total).toBe(2.25); // 1.1 + 1.2 = 2.3 -> rounded to 2.25
    });

    test('nên xử lý empty results', () => {
      // Arrange
      const results: Record<string, CriterionEvalResult> = {};
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const total = calculateTotalScore(results, config);
      
      // Assert
      expect(total).toBe(0);
    });
  });

  describe('calculatePercentage', () => {
    test('nên tính phần trăm chính xác', () => {
      expect(calculatePercentage(8, 10)).toBe(80);
      expect(calculatePercentage(7.5, 10)).toBe(75);
      expect(calculatePercentage(0, 10)).toBe(0);
      expect(calculatePercentage(10, 10)).toBe(100);
    });

    test('nên làm tròn đến 2 chữ số thập phân', () => {
      expect(calculatePercentage(7.333, 10)).toBe(73.33);
      expect(calculatePercentage(8.666, 10)).toBe(86.66);
    });

    test('nên xử lý maxPossiblePoints = 0', () => {
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    test('nên xử lý maxPossiblePoints âm', () => {
      expect(calculatePercentage(5, -10)).toBe(0);
    });
  });

  describe('createGradeResult', () => {
    test('nên tạo GradeResult hoàn chỉnh', () => {
      // Arrange
      const criteriaResults: Record<string, CriterionEvalResult> = {
        toc: { passed: true, points: 2, level: 'excellent', reason: 'Perfect TOC' },
        table: { passed: true, points: 1.5, level: 'good', reason: 'Good table' }
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act
      const result = createGradeResult(
        'file123',
        'test.docx',
        'DOCX',
        'Default Rubric',
        criteriaResults,
        10,
        config,
        1500
      );
      
      // Assert
      expect(result.fileId).toBe('file123');
      expect(result.filename).toBe('test.docx');
      expect(result.fileType).toBe('DOCX');
      expect(result.rubricName).toBe('Default Rubric');
      expect(result.totalPoints).toBe(3.5);
      expect(result.maxPossiblePoints).toBe(10);
      expect(result.percentage).toBe(35);
      expect(result.byCriteria).toEqual(criteriaResults);
      expect(result.processingTime).toBe(1500);
      expect(result.gradedAt).toBeInstanceOf(Date);
    });
  });

  describe('validateScore', () => {
    test('nên validate điểm hợp lệ', () => {
      expect(validateScore(5, 10)).toBe(true);
      expect(validateScore(0, 10)).toBe(true);
      expect(validateScore(10, 10)).toBe(true);
      expect(validateScore(7.5, 10)).toBe(true);
    });

    test('nên reject điểm không hợp lệ', () => {
      expect(validateScore(-1, 10)).toBe(false);
      expect(validateScore(11, 10)).toBe(false);
      expect(validateScore(NaN, 10)).toBe(false);
      expect(validateScore(Infinity, 10)).toBe(false);
      expect(validateScore(-Infinity, 10)).toBe(false);
    });
  });

  describe('calculateBatchStats', () => {
    const mockResults: GradeResult[] = [
      {
        fileId: '1', filename: 'file1.docx', fileType: 'DOCX', rubricName: 'Test',
        totalPoints: 8, maxPossiblePoints: 10, percentage: 80,
        byCriteria: {}, gradedAt: new Date(), processingTime: 1000
      },
      {
        fileId: '2', filename: 'file2.docx', fileType: 'DOCX', rubricName: 'Test',
        totalPoints: 6, maxPossiblePoints: 10, percentage: 60,
        byCriteria: {}, gradedAt: new Date(), processingTime: 1200
      },
      {
        fileId: '3', filename: 'file3.docx', fileType: 'DOCX', rubricName: 'Test',
        totalPoints: 4, maxPossiblePoints: 10, percentage: 40,
        byCriteria: {}, gradedAt: new Date(), processingTime: 800
      }
    ];

    test('nên tính thống kê batch chính xác', () => {
      // Act
      const stats = calculateBatchStats(mockResults, 50);
      
      // Assert
      expect(stats.totalFiles).toBe(3);
      expect(stats.averageScore).toBe(6); // (8+6+4)/3 = 6
      expect(stats.maxScore).toBe(8);
      expect(stats.minScore).toBe(4);
      expect(stats.passCount).toBe(2); // 80% và 60% >= 50%
      expect(stats.failCount).toBe(1); // 40% < 50%
      expect(stats.averagePercentage).toBe(60); // (80+60+40)/3 = 60
    });

    test('nên xử lý empty results', () => {
      // Act
      const stats = calculateBatchStats([]);
      
      // Assert
      expect(stats.totalFiles).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.maxScore).toBe(0);
      expect(stats.minScore).toBe(0);
      expect(stats.passCount).toBe(0);
      expect(stats.failCount).toBe(0);
      expect(stats.averagePercentage).toBe(0);
    });

    test('nên áp dụng custom pass threshold', () => {
      // Act
      const stats = calculateBatchStats(mockResults, 70); // Ngưỡng 70%
      
      // Assert
      expect(stats.passCount).toBe(1); // Chỉ 80% >= 70%
      expect(stats.failCount).toBe(2); // 60% và 40% < 70%
    });
  });

  describe('defaultScoringConfig', () => {
    test('nên có config mặc định hợp lệ', () => {
      expect(defaultScoringConfig.rounding).toBe('half_up_0.25');
      expect(defaultScoringConfig.maxPoints).toBe(10);
      expect(defaultScoringConfig.minPoints).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('nên xử lý workflow chấm điểm hoàn chỉnh', () => {
      // Arrange - Simulate complete grading workflow
      const criterion: Criterion = {
        id: 'integration_test',
        name: 'Integration Test',
        description: 'Test integration',
        detectorKey: 'docx.toc',
        maxPoints: 2,
        levels: [
          { code: 'excellent', name: 'Excellent', points: 2, description: 'Perfect' },
          { code: 'poor', name: 'Poor', points: 0, description: 'Poor' }
        ]
      };
      
      const rawResult: CriterionEvalResult = {
        passed: true,
        points: 1.8, // Sẽ được rounded
        level: 'excellent',
        reason: 'Very good'
      };
      
      const config: ScoringConfig = { rounding: 'half_up_0.25' };
      
      // Act - Complete workflow
      const scoredResult = scoreCriterion(rawResult, criterion, config);
      const totalScore = calculateTotalScore({ test: scoredResult }, config);
      const percentage = calculatePercentage(totalScore, 2);
      const gradeResult = createGradeResult(
        'integration_test_file',
        'integration.docx',
        'DOCX',
        'Integration Rubric',
        { test: scoredResult },
        2,
        config,
        2000
      );
      
      // Assert
      expect(scoredResult.points).toBe(1.75); // 1.8 rounded to 1.75
      expect(totalScore).toBe(1.75);
      expect(percentage).toBe(87.5); // 1.75/2 * 100
      expect(gradeResult.totalPoints).toBe(1.75);
      expect(gradeResult.percentage).toBe(87.5);
      expect(validateScore(gradeResult.totalPoints, gradeResult.maxPossiblePoints)).toBe(true);
    });
  });
});