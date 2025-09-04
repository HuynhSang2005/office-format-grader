/**
 * @file index.ts
 * @description Export tất cả các schemas
 * @author Nguyễn Huỳnh Sang
 */

// Export archive schemas
export { 
  extractionOptionsSchema, 
  unzipResultSchema, 
  openXMLRelationshipSchema, 
  docxFileStructureSchema, 
  pptxFileStructureSchema 
} from './archive.schema';

// Export rubric schemas
export { 
  DetectorKeySchema, 
  FileTypeSchema, 
  LevelSchema, 
  CriterionSchema, 
  RubricSchema, 
  RoundingMethodSchema, 
  CriterionEvalResultSchema, 
  GradeResultSchema, 
  ValidationResultSchema,
  type DetectorKey, 
  type FileType, 
  type RoundingMethod, 
  type Level, 
  type Criterion, 
  type Rubric, 
  type CriterionEvalResult, 
  type GradeResult, 
  type ValidationResult 
} from './rubric.schema';

// Export grade request schemas
export { 
  GradeRequestSchema, 
  SingleFileGradeRequestSchema, 
  BatchStatusQuerySchema, 
  GradeHistoryQuerySchema, 
  RegradeRequestSchema, 
  CompareResultsRequestSchema, 
  ExportExcelRequestSchema,
  type GradeRequest, 
  type SingleFileGradeRequest, 
  type BatchStatusQuery, 
  type GradeHistoryQuery, 
  type RegradeRequest, 
  type CompareResultsRequest, 
  type ExportExcelRequest 
} from './grade-request.schema';

// Export criteria schemas
export { 
  CriteriaListQuerySchema, 
  CriteriaPreviewBodySchema, 
  CriteriaValidateBodySchema, 
  SupportedCriteriaSchema, 
  SupportedCriteriaQuerySchema, 
  CreateCriterionSchema, 
  CreateRubricSchema, 
  PresetRubricQuerySchema, 
  RubricComparisonSchema,
  type CriteriaListQuery, 
  type CriteriaPreviewBody, 
  type CriteriaValidateBody, 
  type SupportedCriteria, 
  type SupportedCriteriaQuery, 
  type CreateCriterion, 
  type CreateRubric, 
  type PresetRubricQuery, 
  type RubricComparison 
} from './criteria.schema';

// Export custom rubric schemas
export { 
  CreateCustomRubricSchema, 
  UpdateCustomRubricSchema, 
  ListCustomRubricsQuerySchema,
  CustomRubricResponseSchema,
  CreateCustomRubricResponseSchema,
  UpdateCustomRubricResponseSchema,
  DeleteCustomRubricResponseSchema,
  GetCustomRubricResponseSchema,
  ListCustomRubricsResponseSchema,
  ValidateCustomRubricResponseSchema,
  CustomRubricErrorResponseSchema,
  type CreateCustomRubricRequest, 
  type UpdateCustomRubricRequest, 
  type ListCustomRubricsQuery,
  type CustomRubricResponse,
  type CreateCustomRubricResponse,
  type UpdateCustomRubricResponse,
  type DeleteCustomRubricResponse,
  type GetCustomRubricResponse,
  type ListCustomRubricsResponse,
  type ValidateCustomRubricResponse,
  type CustomRubricErrorResponse
} from './custom-rubric.schema';

// Export export schemas
export { 
  ExportRequestSchema,
  ExportSuccessResponseSchema,
  ExportErrorResponseSchema,
  type ExportRequest,
  type ExportSuccessResponse,
  type ExportErrorResponse
} from './export.schema';

// Export grade API schemas
export { 
  GradeFileApiSchema,
  CustomGradeApiSchema, 
  GradeHistoryApiSchema,
  GradeResultResponseSchema,
  GradeFileResponseSchema,
  BatchGradeResponseSchema,
  GradeHistoryResponseSchema,
  SingleGradeResultResponseSchema,
  GradeErrorResponseSchema,
  type GradeFileApiRequest,
  type CustomGradeApiRequest, 
  type GradeHistoryApiQuery,
  type GradeResultResponse,
  type GradeFileResponse,
  type BatchGradeResponse,
  type GradeHistoryResponse,
  type SingleGradeResultResponse,
  type GradeErrorResponse
} from './grade-api.schema';

// Export dashboard schemas
export { 
  DashboardQuerySchema,
  DashboardGradeResultSchema,
  PaginationInfoSchema,
  DashboardStatsResponseSchema,
  DashboardErrorResponseSchema,
  type DashboardQuery,
  type DashboardGradeResult,
  type PaginationInfo,
  type DashboardStatsResponse,
  type DashboardErrorResponse
} from './dashboard.schema';

// Export auth schemas
export { 
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  CurrentUserResponseSchema,
  AuthErrorResponseSchema,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type CurrentUserResponse,
  type AuthErrorResponse
} from './auth.schema';

// Export upload schemas
export { 
  UploadRequestSchema,
  UploadSuccessResponseSchema,
  UploadErrorResponseSchema,
  UploadFileNotFoundResponseSchema,
  type UploadRequest,
  type UploadSuccessResponse,
  type UploadErrorResponse,
  type UploadFileNotFoundResponse
} from './upload.schema';