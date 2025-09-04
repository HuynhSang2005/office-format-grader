/**
 * @file rule-engine.types.ts
 * @description Định nghĩa các kiểu dữ liệu cho rule engine
 * @author Nguyễn Huỳnh Sang
 */

// Interface cho threshold configs
export interface ThresholdConfig {
  min?: number;
  max?: number;
  exact?: number;
  values?: number[];
}

// Interface cho string match configs
export interface StringMatchConfig {
  caseSensitive?: boolean;
  exact?: string;
  contains?: string[];
  startsWith?: string;
  endsWith?: string;
  regex?: RegExp;
}

// Interface cho count threshold
export interface CountThreshold {
  min?: number;
  max?: number;
  exact?: number;
}

// Interface cho score mapping
export interface ScoreMapping {
  condition: boolean;
  points: number;
  level: string;
  reason: string;
}

// Type cho complexity level
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

// Interface cho scoring config
export interface ScoringConfig {
  rounding: 'half_up_0.25' | 'none';
  maxPoints?: number;
  minPoints?: number;
}

// Interface cho grading options
export interface GradingOptions {
  rubric: any; // Will be properly typed with Rubric type
  onlyCriteria?: string[];     // Chỉ chấm những criteria này
  scoringConfig?: ScoringConfig;
  includeDetails?: boolean;    // Include chi tiết kỹ thuật
}

// Interface cho grading context
export interface GradingContext {
  fileId: string;
  filename: string;
  startTime: number;
}

// Interface cho batch score stats
export interface BatchScoreStats {
  totalFiles: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  passCount: number;        // Số file đạt >= 50%
  failCount: number;        // Số file < 50%
  averagePercentage: number;
}

// Type cho detector function
export type DetectorFn = (features: any) => {
  passed: boolean;
  points: number;
  level: string;
  reason: string;
  details?: any;
};