/**
 * @file scoring.ts
 * @description Tính điểm và làm tròn theo quy tắc 0.25
 * @author Nguyễn Huỳnh Sang
 */

import type { RoundingMethod, CriterionEvalResult, GradeResult, Criterion } from '@/types/criteria';
import type { ScoringConfig, BatchScoreStats } from '@/types/rule-engine.types';

// Làm tròn điểm theo phương thức half_up_0.25
export function roundPoints(points: number, method: RoundingMethod): number {
  if (method === 'none') {
    return points;
  }
  
  if (method === 'half_up_0.25') {
    // Làm tròn lên bội số gần nhất của 0.25
    return Math.round(points * 4) / 4;
  }
  
  return points;
}

// Tính điểm cho một criterion
export function scoreCriterion(
  result: CriterionEvalResult,
  criterion: Criterion,
  config: ScoringConfig
): CriterionEvalResult {
  // Đảm bảo điểm không vượt quá maxPoints của criterion
  let adjustedPoints = Math.min(result.points, criterion.maxPoints);
  
  // Đảm bảo điểm không âm
  adjustedPoints = Math.max(0, adjustedPoints);
  
  // Áp dụng rounding
  adjustedPoints = roundPoints(adjustedPoints, config.rounding);
  
  return {
    ...result,
    points: adjustedPoints
  };
}

// Tính tổng điểm từ nhiều criterion results
export function calculateTotalScore(
  results: Record<string, CriterionEvalResult>,
  config: ScoringConfig
): number {
  const totalPoints = Object.values(results).reduce(
    (sum, result) => sum + result.points,
    0
  );
  
  return roundPoints(totalPoints, config.rounding);
}

// Tính phần trăm điểm
export function calculatePercentage(
  actualPoints: number,
  maxPossiblePoints: number
): number {
  if (maxPossiblePoints <= 0) {
    return 0;
  }
  
  const percentage = (actualPoints / maxPossiblePoints) * 100;
  return Math.round(percentage * 100) / 100; // Làm tròn 2 chữ số thập phân
}

// Tạo grade result đầy đủ
export function createGradeResult(
  fileId: string,
  filename: string,
  fileType: 'PPTX' | 'DOCX',
  rubricName: string,
  criteriaResults: Record<string, CriterionEvalResult>,
  maxPossiblePoints: number,
  config: ScoringConfig,
  processingTime: number
): GradeResult {
  const totalPoints = calculateTotalScore(criteriaResults, config);
  const percentage = calculatePercentage(totalPoints, maxPossiblePoints);
  
  return {
    fileId,
    filename,
    fileType,
    rubricName,
    totalPoints,
    maxPossiblePoints,
    percentage,
    byCriteria: criteriaResults,
    gradedAt: new Date(),
    processingTime
  };
}

// Validate điểm số có hợp lệ không
export function validateScore(points: number, maxPoints: number): boolean {
  return points >= 0 && points <= maxPoints && !isNaN(points) && isFinite(points);
}

export function calculateBatchStats(
  results: GradeResult[],
  passThreshold: number = 50 // Ngưỡng đạt (%)
): BatchScoreStats {
  if (results.length === 0) {
    return {
      totalFiles: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      passCount: 0,
      failCount: 0,
      averagePercentage: 0
    };
  }
  
  const scores = results.map(r => r.totalPoints);
  const percentages = results.map(r => r.percentage);
  
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const averagePercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  const passCount = results.filter(r => r.percentage >= passThreshold).length;
  const failCount = results.length - passCount;
  
  return {
    totalFiles: results.length,
    averageScore: Math.round(averageScore * 100) / 100,
    maxScore,
    minScore,
    passCount,
    failCount,
    averagePercentage: Math.round(averagePercentage * 100) / 100
  };
}

// Export default scoring config
export const defaultScoringConfig: ScoringConfig = {
  rounding: 'half_up_0.25',
  maxPoints: 10,
  minPoints: 0
};