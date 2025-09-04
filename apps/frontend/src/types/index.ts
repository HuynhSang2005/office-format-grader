export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string; // Backend sends token in body, but we'll rely on the cookie
}

export interface UploadResponseData {
  fileId: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  fileType?: 'PPTX' | 'DOCX';
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: UploadResponseData;
}

export interface CriterionEvalResult {
  passed: boolean;
  points: number;
  level: string;
  reason: string;
  details?: unknown;
}

export interface GradeResult {
  fileId: string;
  filename: string;
  fileType: 'PPTX' | 'DOCX';
  totalPoints: number;
  maxPossiblePoints: number;
  percentage: number;
  byCriteria: Record<string, CriterionEvalResult>;
  gradedAt: string; // ISO Date String
  processingTime: number;
}

// This is the response from the SINGLE grade file endpoint
export interface GradeFileResponse {
  success: boolean;
  message: string;
  data: {
    gradeResult: GradeResult;
  };
}

// Dashboard and History related types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardGradeResult {
  id: string;
  filename: string;
  fileType: string;
  totalPoints: number;
  gradedAt: string; // ISO Date String
}

export interface DashboardStats {
  totalGraded: number;
  totalUngraded: number;
  totalCustomRubrics: number;
  top5Highest: DashboardGradeResult[];
  top5Lowest: DashboardGradeResult[];
  topHighestPaginated: {
    data: DashboardGradeResult[];
    pagination: PaginationInfo;
  };
  topLowestPaginated: {
    data: DashboardGradeResult[];
    pagination: PaginationInfo;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface HistoryGradeResult {
  id: string;
  filename: string;
  fileType: 'PPTX' | 'DOCX';
  totalPoints: number;
  gradedAt: string; // ISO Date String
}

export interface GradeHistoryResponse {
  success: boolean;
  message: string;
  data: {
    results: HistoryGradeResult[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface DashboardParams {
  page?: number;
  limit?: number;
  gradedDays?: number;
}

export interface HistoryParams {
  limit: number;
  offset: number;
}

// Rubric related types
export interface Level {
  code: string;
  name: string;
  points: number;
  description: string;
}

export interface Criterion {
  id: string;
  name: string;
  detectorKey: string;
  maxPoints: number;
  levels: Level[];
}

export interface Rubric {
  title: string;
  version: string;
  locale: string;
  totalPoints: number;
  scoring: {
    method: 'sum';
    rounding: 'half_up_0.25' | 'none';
  };
  criteria: Criterion[];
}

export interface CustomRubric {
  id: string;
  ownerId: number;
  name: string;
  content: Rubric;
  total: number;
  isPublic: boolean;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

// Payloads for API functions
export type CreateRubricPayload = Omit<CustomRubric, 'id' | 'createdAt' | 'updatedAt' | 'total'>;
export type UpdateRubricPayload = Partial<Omit<CustomRubric, 'id' | 'createdAt' | 'updatedAt' | 'total' | 'ownerId'>>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
