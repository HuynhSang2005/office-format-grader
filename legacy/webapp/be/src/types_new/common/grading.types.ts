/**
 * Grading system types for rubric-based assessment
 */

/**
 * Rubric scoring level
 */
export interface RubricLevel {
  score: number;
  description: string;
  examples?: string[];
  keywords?: string[];
}

/**
 * Complete rubric criterion definition
 */
export interface RubricCriterion {
  id: string;
  criterion: string;
  maxScore: number;
  weight?: number;
  category?: string;
  levels: RubricLevel[];
  description?: string;
  examples?: string[];
  autoCheckable?: boolean;
  checkFunction?: string; // Function name for automatic checking
}

/**
 * Rubric metadata
 */
export interface RubricMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  created: Date;
  lastModified: Date;
  documentType: "docx" | "pptx" | "xlsx";
  totalMaxScore: number;
  categories?: string[];
  tags?: string[];
}

/**
 * Complete rubric definition
 */
export interface Rubric {
  metadata: RubricMetadata;
  criteria: RubricCriterion[];
  scoringGuidelines?: string;
  passingThreshold?: number;
}

/**
 * Grading detail for a single criterion
 */
export interface GradingDetail {
  criterionId: string;
  criterion: string;
  maxScore: number;
  achievedScore: number;
  percentage: number;
  level?: RubricLevel;
  reason: string;
  evidence?: string[];
  suggestions?: string[];
  isAutoGraded?: boolean;
  confidence?: number; // 0-1 for AI grading
}

/**
 * Complete grading result
 */
export interface GradingResult {
  totalAchievedScore: number;
  totalMaxScore: number;
  percentage: number;
  grade?: string; // Letter grade or pass/fail
  passThreshold?: number;
  isPassing?: boolean;
  details: GradingDetail[];
  summary?: string;
  suggestions?: string[];
  gradedAt: Date;
  gradedBy: "ai" | "manual" | "hybrid";
  confidence?: number; // Overall confidence for AI grading
  processingTime?: number; // in milliseconds
}

/**
 * PowerPoint specific grading result
 */
export interface PowerPointGradingResult extends GradingResult {
  slideAnalysis?: {
    totalSlides: number;
    analyzedSlides: number;
    slideScores: Array<{
      slideNumber: number;
      score: number;
      issues: string[];
    }>;
  };
  designAnalysis?: {
    themeConsistency: number;
    layoutQuality: number;
    visualAppeal: number;
  };
  technicalAnalysis?: {
    animationsUsed: number;
    transitionsUsed: number;
    multimediaElements: number;
    interactiveElements: number;
  };
}

/**
 * Word document specific grading result
 */
export interface WordGradingResult extends GradingResult {
  documentAnalysis?: {
    wordCount: number;
    pageCount: number;
    structureScore: number;
    formattingScore: number;
  };
  contentAnalysis?: {
    headingStructure: number;
    citationQuality: number;
    grammarScore?: number;
    readabilityScore?: number;
  };
  technicalAnalysis?: {
    stylesUsed: string[];
    imagesCount: number;
    tablesCount: number;
    tocPresent: boolean;
  };
}

/**
 * Grading context information
 */
export interface GradingContext {
  submissionId?: string;
  studentId?: string;
  studentName?: string;
  assignmentId?: string;
  assignmentName?: string;
  dueDate?: Date;
  submissionDate?: Date;
  attemptNumber?: number;
  courseId?: string;
  instructorId?: string;
}

/**
 * Grading options/settings
 */
export interface GradingOptions {
  useAI?: boolean;
  aiModel?: string;
  strictMode?: boolean;
  includeSuggestions?: boolean;
  generateReport?: boolean;
  reportFormat?: "json" | "pdf" | "excel";
  language?: string;
  customWeights?: Record<string, number>;
  passingThreshold?: number;
}

/**
 * Batch grading request
 */
export interface BatchGradingRequest {
  files: Array<{
    filename: string;
    data: Buffer;
    metadata?: any;
  }>;
  rubric: Rubric;
  options: GradingOptions;
  context?: Partial<GradingContext>;
}

/**
 * Batch grading result
 */
export interface BatchGradingResult {
  totalFiles: number;
  successfulGrades: number;
  failedGrades: number;
  results: Array<{
    filename: string;
    success: boolean;
    result?: GradingResult;
    error?: string;
  }>;
  summary: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passingRate: number;
  };
  processingTime: number;
}

/**
 * AI grading configuration
 */
export interface AIGradingConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  promptTemplate?: string;
  retryAttempts: number;
  confidenceThreshold: number;
  fallbackToManual?: boolean;
}

/**
 * Manual grading session
 */
export interface ManualGradingSession {
  sessionId: string;
  graderId: string;
  startTime: Date;
  endTime?: Date;
  filesGraded: number;
  averageTimePerFile: number;
  notes?: string;
}

/**
 * Grading statistics
 */
export interface GradingStats {
  totalSubmissions: number;
  aiGraded: number;
  manualGraded: number;
  hybridGraded: number;
  averageScore: number;
  standardDeviation: number;
  scoreDistribution: Record<string, number>;
  commonIssues: Array<{
    issue: string;
    frequency: number;
  }>;
  gradingTrends: Array<{
    date: Date;
    avgScore: number;
    submissionCount: number;
  }>;
}