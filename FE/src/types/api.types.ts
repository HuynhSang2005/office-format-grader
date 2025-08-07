
export interface GradingDetail {
  criterion: string;
  maxScore: number;
  achievedScore: number;
  reason: string;
}

export interface GradingResult {
  totalAchievedScore: number;
  totalMaxScore: number;
  details: GradingDetail[];
}

export interface GradeResponse {
  gradingResult: GradingResult;
  submissionDetails: any;
}

export interface GradePayload {
  rubricFile: File;
  submissionFile: File;
}

// PowerPoint types
export interface PowerPointSlideInfo {
  slideNumber: number;
  title?: string;
  elementCount: number;
  hasChart: boolean;
  hasTable: boolean;
  hasImage: boolean;
}

export interface PowerPointOverviewResult {
  fileName: string;
  slideCount: number;
  hasCharts: boolean;
  hasTables: boolean;
  metadata: {
    title: string;
    author: string;
    company: string;
    createdAt: string;
    modifiedAt: string;
  }
}

export interface PowerPointDetailedResult extends PowerPointOverviewResult {
  slides: PowerPointSlideInfo[];
  // Các thông tin chi tiết khác
}

// Manual Checker Types
export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  description: string;
}

export interface DetailedGradingResult {
  result: GradingResult;
  parsedData: {
    fileName: string;
    slideCount: number;
    metadata: {
      title: string;
      author: string;
      company: string;
      createdAt: string;
      modifiedAt: string;
    }
  };
  rubric: RubricCriterion[];
}

// Submission Types
export interface SubmissionSummary {
  submission: {
    student?: {
      id: string;
      name: string;
    };
    files: {
      filename: string;
      type: 'docx' | 'pptx';
      overview: {
        // Thông tin tổng quan của file
      };
      format?: any; // Thông tin định dạng chi tiết
    }[];
  };
  rubric?: {
    filename: string;
    // Thông tin về rubric
  };
}