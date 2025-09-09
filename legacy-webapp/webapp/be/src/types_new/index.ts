/**
 * Centralized export for all TypeScript types
 * This provides a single point of import for all types across the application
 */

// Common types
export * from "./common/api.types";
export * from "./common/file.types";
export * from "./common/grading.types";

// Document types
export * from "./documents/powerpoint.types";
export * from "./documents/word.types";
export * from "./documents/excel.types";

// Service types
export * from "./services/service.types";

/**
 * Type bundles for related types
 */
import type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  FileInfo,
  FileProcessingResult,
  PaginationParams,
  PaginatedResponse,
  QueryParams,
  HealthCheckResponse,
  ConfigOptions,
} from "./common/api.types";

import type {
  FileType,
  FileMetadata,
  FileProcessingOptions,
  FileExtractionResult,
  FileValidationResult,
  TempFileCleanup,
  DocumentStructure,
} from "./common/file.types";

import type {
  Rubric,
  RubricCriterion,
  GradingResult,
  GradingDetail,
  PowerPointGradingResult,
  WordGradingResult,
  GradingContext,
  GradingOptions,
  BatchGradingRequest,
  BatchGradingResult,
} from "./common/grading.types";

import type {
  ParsedPowerPointFormatData,
  FormattedSlide,
  ThemeData,
  Shape,
  AnimationEffect,
  TransitionEffect,
  PowerPointAnalysis,
} from "./documents/powerpoint.types";

import type {
  ParsedWordData,
  Paragraph,
  TextRun,
  Table,
  DocumentMetadata,
  WordDocumentAnalysis,
  WordDocumentSummary,
} from "./documents/word.types";

import type {
  ExcelWorkbook,
  ExcelWorksheet,
  ExcelCell,
  ExcelExportOptions,
  ExcelReportOptions,
} from "./documents/excel.types";

import type {
  ServiceResult,
  ServiceConfig,
  AIServiceConfig,
  ValidationResult,
  GradingServiceConfig,
  ExportServiceConfig,
} from "./services/service.types";

/**
 * API-related types bundle
 */
export const ApiTypes = {
  Response: {} as ApiResponse,
  SuccessResponse: {} as SuccessResponse,
  ErrorResponse: {} as ErrorResponse,
  FileInfo: {} as FileInfo,
  FileProcessingResult: {} as FileProcessingResult,
  PaginationParams: {} as PaginationParams,
  PaginatedResponse: {} as PaginatedResponse,
  QueryParams: {} as QueryParams,
  HealthCheckResponse: {} as HealthCheckResponse,
  ConfigOptions: {} as ConfigOptions,
} as const;

/**
 * File-related types bundle
 */
export const FileTypes = {
  FileType: {} as typeof FileType,
  FileMetadata: {} as FileMetadata,
  FileProcessingOptions: {} as FileProcessingOptions,
  FileExtractionResult: {} as FileExtractionResult,
  FileValidationResult: {} as FileValidationResult,
  TempFileCleanup: {} as TempFileCleanup,
  DocumentStructure: {} as DocumentStructure,
} as const;

/**
 * Grading-related types bundle
 */
export const GradingTypes = {
  Rubric: {} as Rubric,
  RubricCriterion: {} as RubricCriterion,
  GradingResult: {} as GradingResult,
  GradingDetail: {} as GradingDetail,
  PowerPointGradingResult: {} as PowerPointGradingResult,
  WordGradingResult: {} as WordGradingResult,
  GradingContext: {} as GradingContext,
  GradingOptions: {} as GradingOptions,
  BatchGradingRequest: {} as BatchGradingRequest,
  BatchGradingResult: {} as BatchGradingResult,
} as const;

/**
 * PowerPoint-related types bundle
 */
export const PowerPointTypes = {
  ParsedData: {} as ParsedPowerPointFormatData,
  Slide: {} as FormattedSlide,
  Theme: {} as ThemeData,
  Shape: {} as Shape,
  Animation: {} as AnimationEffect,
  Transition: {} as TransitionEffect,
  Analysis: {} as PowerPointAnalysis,
} as const;

/**
 * Word-related types bundle
 */
export const WordTypes = {
  ParsedData: {} as ParsedWordData,
  Paragraph: {} as Paragraph,
  TextRun: {} as TextRun,
  Table: {} as Table,
  Metadata: {} as DocumentMetadata,
  Analysis: {} as WordDocumentAnalysis,
  Summary: {} as WordDocumentSummary,
} as const;

/**
 * Excel-related types bundle
 */
export const ExcelTypes = {
  Workbook: {} as ExcelWorkbook,
  Worksheet: {} as ExcelWorksheet,
  Cell: {} as ExcelCell,
  ExportOptions: {} as ExcelExportOptions,
  ReportOptions: {} as ExcelReportOptions,
} as const;

/**
 * Service-related types bundle
 */
export const ServiceTypes = {
  Result: {} as ServiceResult,
  Config: {} as ServiceConfig,
  AIConfig: {} as AIServiceConfig,
  ValidationResult: {} as ValidationResult,
  GradingConfig: {} as GradingServiceConfig,
  ExportConfig: {} as ExportServiceConfig,
} as const;

/**
 * All types organized by domain
 */
export const Types = {
  Api: ApiTypes,
  File: FileTypes,
  Grading: GradingTypes,
  PowerPoint: PowerPointTypes,
  Word: WordTypes,
  Excel: ExcelTypes,
  Service: ServiceTypes,
} as const;

/**
 * Utility type for extracting type from bundle
 */
export type ExtractType<T> = T extends { [K in keyof T]: infer U } ? U : never;

/**
 * Helper types for common patterns
 */
export type DocumentType = "docx" | "pptx" | "xlsx";
export type ProcessingMode = "summary" | "detailed" | "full";
export type GradingMode = "ai" | "manual" | "hybrid";
export type OutputFormat = "json" | "excel" | "pdf" | "csv";

/**
 * Generic request/response types
 */
export interface GenericRequest<T = any> {
  data: T;
  options?: any;
  context?: any;
}

export interface GenericResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}