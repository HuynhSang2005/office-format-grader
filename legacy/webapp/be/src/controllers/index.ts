/**
 * Centralized export for all controllers
 * This provides a single point of import for all controller classes
 */

// Controller classes
export { AiController } from "./ai.controller";
export { ManualGraderController } from "./manual-grader.controller";
export { DocumentAnalyzerController } from "./document.controller";
export { SubmissionController } from "./submission.controller";
export { ManualController } from "./manual.controller";
export { RubricController } from "./rubric.controller";
export { ExportController } from "./export.controller";
export { HealthController } from "./health.controller";

/**
 * Controller instances - ready to use
 */
export const Controllers = {
  Ai: new AiController(),
  ManualGrader: new ManualGraderController(),
  DocumentAnalyzer: new DocumentAnalyzerController(),
  Submission: new SubmissionController(),
  Manual: new ManualController(),
  Rubric: new RubricController(),
  Export: new ExportController(),
  Health: new HealthController(),
} as const;

/**
 * Controller type definitions for dependency injection
 */
export interface IControllers {
  ai: AiController;
  manualGrader: ManualGraderController;
  documentAnalyzer: DocumentAnalyzerController;
  submission: SubmissionController;
}

/**
 * Controller factory function
 */
export function createControllers(): IControllers {
  return {
    ai: new AiController(),
    manualGrader: new ManualGraderController(),
    documentAnalyzer: new DocumentAnalyzerController(),
    submission: new SubmissionController(),
  };
}

/**
 * Controller configuration options
 */
export interface ControllerConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  tempDirectory?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  processingTimeout?: number;
}

/**
 * Base controller interface
 */
export interface BaseController {
  config?: ControllerConfig;
}

/**
 * Controller method type definitions
 */
export type ControllerMethod = (c: any) => Promise<Response>;

/**
 * Controller route mapping
 */
export interface ControllerRoutes {
  [path: string]: {
    [method: string]: ControllerMethod;
  };
}

/**
 * Default controller configuration
 */
export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  enableLogging: true,
  enableMetrics: false,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: [".docx", ".pptx"],
  processingTimeout: 30000, // 30 seconds
};