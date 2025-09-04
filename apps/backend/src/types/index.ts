/**
 * @file index.ts
 * @description Export tất cả các types
 * @author Nguyễn Huỳnh Sang
 */

// Export features-docx types
export type { FeaturesDOCX } from './features-docx';
export type { TocInfo } from './features-docx';
export type { DOCXHeaderFooterInfo } from './features-docx';
export type { TableInfo } from './features-docx';
export type { EquationInfo } from './features-docx';
export type { TabStopsInfo } from './features-docx';
export type { SmartArtInfo } from './features-docx';
export type { DocumentStructure } from './features-docx';
export type { StylesInfo } from './features-docx';
export type { ColumnsInfo } from './features-docx';
export type { DropCapInfo } from './features-docx';
export type { PictureInfo } from './features-docx';
export type { WordArtInfo } from './features-docx';
export type { DOCXHyperlinkInfo } from './features-docx';

// Export features-pptx types
export type { FeaturesPPTX } from './features-pptx';
export type { SlideInfo } from './features-pptx';
export type { ThemeInfo } from './features-pptx';
export type { SlideMasterInfo } from './features-pptx';
export type { PPTXHeaderFooterInfo } from './features-pptx';
export type { TransitionInfo } from './features-pptx';
export type { AnimationInfo } from './features-pptx';
export type { SlideObject } from './features-pptx';
export type { OutlineStructure } from './features-pptx';
export type { OutlineLevel } from './features-pptx';
export type { PPTXHyperlinkInfo } from './features-pptx';

// Export criteria and rubric types
export type { DetectorKey } from './criteria';
export type { FileType } from './criteria';
export type { RoundingMethod } from './criteria';
export type { Level } from './criteria';
export type { Criterion } from './criteria';
export type { Rubric } from './criteria';
export type { CriterionEvalResult } from './criteria';
export type { GradeResult } from './criteria';
export type { GradeRequest } from './criteria';
export type { CriteriaListQuery } from './criteria';
export type { CriteriaPreviewBody } from './criteria';
export type { CriteriaValidateBody } from './criteria';
export type { ValidationResult } from './criteria';
export type { SupportedCriteria } from './criteria';

// Export archive types
export type { UnzipResult } from './archive.types';
export type { ExtractionOptions } from './archive.types';
export type { OpenXMLRelationship } from './archive.types';
export type { DOCXFileStructure } from './archive.types';
export type { PPTXFileStructure } from './archive.types';

// Export dashboard types
export type { DashboardStats, GradeResult as DashboardGradeResult } from './dashboard.types';

// Export custom rubric types
export type { CustomRubric, CreateCustomRubricRequest as CreateCustomRubricType, UpdateCustomRubricRequest as UpdateCustomRubricType } from './custom-rubric.types';

// Export grade types
export type { GradeFileRequest, BatchGradeRequest, GradeResultWithDB } from './grade.types';

// Export criteria service types
export type { SupportedCriteria as CriteriaServiceSupportedCriteria } from './criteria-service.types';

// Export storage types
export type { UploadedFile, FileValidationResult } from './storage.types';

// Export auth types
export type { LoginBody } from './auth.types';

// Export docx-xml types
export type { XMLNode, OpenXMLRelationship as DOCXOpenXMLRelationship } from './docx-xml.types';

// Export pptx-xml types
export type { 
  PPTXXMLNode, 
  PPTXRelationship, 
  SlideRelationship,
  ThemeDefinition
} from './pptx-xml.types';

// Export rule engine types
export type { 
  DetectorFn,
  ThresholdConfig,
  StringMatchConfig,
  CountThreshold,
  ScoreMapping,
  ComplexityLevel,
  ScoringConfig,
  GradingOptions,
  GradingContext,
  BatchScoreStats
} from './rule-engine.types';

// Export middleware types
export type { UserContext } from './middleware.types';

// Export hono context types
export type { HonoContextExtension } from './hono-context.types';

// Export core types
export type { LogLevel, LogEntry } from './core.types';