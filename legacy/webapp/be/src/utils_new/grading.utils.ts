/**
 * Grading Utilities
 * Consolidated grading helper functions for score calculation and result formatting
 */

import type { GradingResult, GradingDetail, PowerPointGradingResult, RubricCriterion, RubricLevel } from '../types_new/grading';

/**
 * Convert grading result from old format to new format
 */
export function convertToNewFormat(oldFormat: GradingResult): PowerPointGradingResult {
  const newFormat: PowerPointGradingResult = {
    totalScore: oldFormat.totalAchievedScore,
    maxScore: oldFormat.totalMaxScore,
    percentageScore: Math.round((oldFormat.totalAchievedScore / oldFormat.totalMaxScore) * 100),
    criteria: {}
  };
  
  // Convert each criterion
  oldFormat.details.forEach(detail => {
    // Generate criterion ID from name if not found
    const criterionId = detail.criterion.replace(/\s+/g, '_').toLowerCase();
    
    if (newFormat.criteria) {
      newFormat.criteria[criterionId] = {
        name: detail.criterion,
        score: detail.achievedScore,
        maxScore: detail.maxScore,
        reason: detail.reason
      };
    }
  });
  
  return newFormat;
}

/**
 * Convert grading result from new format to old format
 */
export function convertToOldFormat(newFormat: PowerPointGradingResult): GradingResult {
  const details: GradingDetail[] = [];
  
  if (newFormat.criteria) {
    Object.entries(newFormat.criteria).forEach(([id, criterionData]) => {
      details.push({
        criterion: criterionData.name,
        maxScore: criterionData.maxScore,
        achievedScore: criterionData.score,
        reason: criterionData.reason
      });
    });
  }
  
  return {
    totalAchievedScore: newFormat.totalScore || 0,
    totalMaxScore: newFormat.maxScore || 0,
    details
  };
}

/**
 * Find the most appropriate level based on score
 */
function findClosestLevel(levels: RubricLevel[], targetScore: number): RubricLevel | undefined {
  if (levels.length === 0) return undefined;
  
  // Sort levels by score in descending order
  const sortedLevels = [...levels].sort((a, b) => b.score - a.score);
  
  // Find the highest level where score >= level score
  for (const level of sortedLevels) {
    if (targetScore >= level.score - 0.001) { // Add small tolerance for rounding errors
      return level;
    }
  }
  
  // If no appropriate level found, return the lowest level
  return sortedLevels[sortedLevels.length - 1];
}

/**
 * Calculate score based on rubric levels
 */
export function calculateScore(
  rule: RubricCriterion, 
  score: number,
  customReason?: string
): GradingDetail {
  // Ensure score is in range [0, 1]
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  const levels = rule.levels || [];
  const maxPossibleScore = rule.maxScore;
  
  // Raw achieved score based on ratio
  const rawAchievedScore = normalizedScore * maxPossibleScore;
  
  // Check if levels exist
  if (levels.length === 0) {
    return {
      criterion: rule.criterion,
      maxScore: maxPossibleScore,
      achievedScore: rawAchievedScore,
      reason: customReason || `Achieved ${Math.round(normalizedScore * 100)}% of requirements`
    };
  }
  
  // Find appropriate level
  const closestLevel = findClosestLevel(levels, rawAchievedScore);
  
  if (!closestLevel) {
    return {
      criterion: rule.criterion,
      maxScore: maxPossibleScore,
      achievedScore: rawAchievedScore,
      reason: customReason || `Achieved ${Math.round(normalizedScore * 100)}% of requirements`
    };
  }
  
  // Use score from level to ensure consistency with rubric
  return {
    criterion: rule.criterion,
    maxScore: maxPossibleScore,
    achievedScore: closestLevel.score,
    reason: customReason || closestLevel.description
  };
}

/**
 * Calculate absolute score based on boolean value
 */
export function calculateBooleanScore(
  rule: RubricCriterion,
  passed: boolean,
  reasonIfPassed: string,
  reasonIfFailed: string
): GradingDetail {
  // If no levels, use maxScore or 0
  if (!rule.levels || rule.levels.length === 0) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: passed ? rule.maxScore : 0,
      reason: passed ? reasonIfPassed : reasonIfFailed
    };
  }
  
  // If levels exist, find highest and lowest levels
  const sortedLevels = [...rule.levels].sort((a, b) => b.score - a.score);
  const highestLevel = sortedLevels[0];
  const lowestLevel = sortedLevels[sortedLevels.length - 1];
  
  if (passed) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: highestLevel ? highestLevel.score : rule.maxScore,
      reason: reasonIfPassed || (highestLevel ? highestLevel.description : "Requirements met")
    };
  } else {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: lowestLevel ? lowestLevel.score : 0,
      reason: reasonIfFailed || (lowestLevel ? lowestLevel.description : "Requirements not met")
    };
  }
}

/**
 * Calculate simple score based on completion ratio
 */
export function calculateSimpleScore(
  rule: RubricCriterion,
  completionRatio: number,
  reason: string
): GradingDetail {
  // Ensure ratio is in range [0, 1]
  const normalizedRatio = Math.max(0, Math.min(1, completionRatio));
  
  return {
    criterion: rule.criterion,
    maxScore: rule.maxScore,
    achievedScore: Math.round(rule.maxScore * normalizedRatio * 100) / 100, // Round to 2 decimal places
    reason
  };
}

/**
 * Update total score for a grading result
 */
export function updateTotalScore(gradingResult: PowerPointGradingResult): void {
  if (!gradingResult.criteria) {
    gradingResult.totalScore = 0;
    gradingResult.maxScore = 0;
    gradingResult.percentageScore = 0;
    return;
  }

  let totalScore = 0;
  let maxScore = 0;

  Object.values(gradingResult.criteria).forEach(criterion => {
    totalScore += criterion.score;
    maxScore += criterion.maxScore;
  });

  gradingResult.totalScore = totalScore;
  gradingResult.maxScore = maxScore;
  gradingResult.percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

/**
 * Create missing criterion result
 */
export function createMissingCriterionResult(criterionId: string, criterionName: string): GradingDetail {
  return {
    criterion: criterionName,
    maxScore: 0,
    achievedScore: 0,
    reason: `Configuration error: Criterion ${criterionName} not found`
  };
}

/**
 * Create no data result
 */
export function createNoDataResult(rule: RubricCriterion, message: string): GradingDetail {
  return {
    criterion: rule.criterion,
    maxScore: rule.maxScore,
    achievedScore: 0,
    reason: message
  };
}