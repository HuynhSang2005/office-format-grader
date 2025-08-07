import { 
  findRubricCriterion,
  calculateScore,
  calculateBooleanScore,
  calculateSimpleScore,
  createNoDataResult,
  createMissingCriterionResult
} from './rubricHelper';

import {
  updateScoreByPercentage,
  updateScoreByBoolean,
  updateScoreByConditions,
  updateTotalScore,
  convertToNewFormat,
  convertToOldFormat
} from './gradingResultHelper';

// Re-export tất cả
export * from './rubricHelper';
export * from './gradingResultHelper';

// wrapper API đơn giản cho cả hai module
export const GradingHelpers = {
  // Từ rubricHelper
  findCriterion: findRubricCriterion,
  calculateScore,
  calculateBooleanScore,
  calculateSimpleScore,
  createNoDataResult,
  createMissingCriterionResult,
  
  // Từ gradingResultHelper
  updateScoreByPercentage,
  updateScoreByBoolean,
  updateScoreByConditions,
  updateTotalScore,
  convertToNewFormat,
  convertToOldFormat
};