/**
 * Grading Types
 * Centralized type definitions for grading and evaluation functionality
 */

// Common grading interfaces
export interface GradingCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  reason: string;
  details?: any;
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteria: Record<string, GradingCriterion>;
  metadata?: {
    gradedAt: string;
    gradingMethod: 'ai' | 'manual' | 'hybrid';
    documentType: 'powerpoint' | 'word';
    fileName?: string;
  };
}

// AI-specific grading types
export interface AIGradingResult extends GradingResult {
  aiModel: string;
  confidence: number;
  processingTimeMs: number;
  suggestions?: string[];
}

// Manual grading types
export interface ManualGradingResult extends GradingResult {
  rubricVersion: string;
  checkedCriteria: string[];
  warnings?: string[];
}

// Rubric types
export interface RubricLevel {
  score: number;
  description: string;
  examples?: string[];
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  description?: string;
  maxScore: number;
  weight?: number;
  levels?: RubricLevel[];
  category?: string;
}

export interface Rubric {
  id: string;
  name: string;
  version: string;
  documentType: 'powerpoint' | 'word';
  criteria: RubricCriterion[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

// Legacy compatibility types
export interface GradingDetail {
  criterion: string;
  maxScore: number;
  achievedScore: number;
  reason: string;
}

export interface PowerPointGradingResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteria?: Record<string, {
    name: string;
    score: number;
    maxScore: number;
    reason: string;
  }>;
}

// Export utility types
export type GradingMethod = 'ai' | 'manual' | 'hybrid';
export type DocumentType = 'powerpoint' | 'word';
export type GradingStatus = 'pending' | 'processing' | 'completed' | 'failed';