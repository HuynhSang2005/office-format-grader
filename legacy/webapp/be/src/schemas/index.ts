/**
 * Centralized export for all Zod schemas
 * This provides a single point of import for all validation schemas
 */

// Common schemas
export * from "./common.schema";

// AI-specific schemas
export * from "./ai.schema";

// PowerPoint schemas
export * from "./powerpoint.schema";

// Word schemas
export * from "./word.schema";

// Re-export zod for convenience
export { z } from "zod";

/**
 * Schema bundles for related schemas
 */
import {
  AiCheckerRequestSchema,
  AiCheckerQuerySchema,
  AiCheckerResponseSchema,
  SubmissionSummaryRequestSchema,
  SubmissionSummaryResponseSchema,
  FormatExtractionRequestSchema,
  FormatExtractionResponseSchema,
} from "./ai.schema";

import {
  ManualGraderRequestSchema,
  PowerPointAnalysisResponseSchema,
  ParsedPowerPointFormatDataSchema,
} from "./powerpoint.schema";

import {
  WordAnalysisRequestSchema,
  WordAnalysisResponseSchema,
  ParsedWordDataSchema,
} from "./word.schema";

import {
  GradingResultSchema,
  ApiResponseSchema,
  FileUploadSchema,
} from "./common.schema";

/**
 * AI-related schemas bundle
 */
export const AiSchemas = {
  Request: AiCheckerRequestSchema,
  Query: AiCheckerQuerySchema,
  Response: AiCheckerResponseSchema,
  SubmissionSummaryRequest: SubmissionSummaryRequestSchema,
  SubmissionSummaryResponse: SubmissionSummaryResponseSchema,
  FormatExtractionRequest: FormatExtractionRequestSchema,
  FormatExtractionResponse: FormatExtractionResponseSchema,
} as const;

/**
 * PowerPoint-related schemas bundle
 */
export const PowerPointSchemas = {
  ManualGraderRequest: ManualGraderRequestSchema,
  AnalysisResponse: PowerPointAnalysisResponseSchema,
  ParsedFormatData: ParsedPowerPointFormatDataSchema,
} as const;

/**
 * Word-related schemas bundle
 */
export const WordSchemas = {
  AnalysisRequest: WordAnalysisRequestSchema,
  AnalysisResponse: WordAnalysisResponseSchema,
  ParsedData: ParsedWordDataSchema,
} as const;

/**
 * Common schemas bundle
 */
export const CommonSchemas = {
  GradingResult: GradingResultSchema,
  ApiResponse: ApiResponseSchema,
  FileUpload: FileUploadSchema,
} as const;

/**
 * All schemas organized by domain
 */
export const Schemas = {
  Common: CommonSchemas,
  Ai: AiSchemas,
  PowerPoint: PowerPointSchemas,
  Word: WordSchemas,
} as const;