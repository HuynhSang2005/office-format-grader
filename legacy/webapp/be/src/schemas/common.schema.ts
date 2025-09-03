import { z } from "zod";

/**
 * Schema for file upload validation
 */
export const FileUploadSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().positive("File size must be positive"),
  type: z.string().min(1, "File type is required"),
});

/**
 * Schema for rubric level (single scoring level in a criterion)
 */
export const RubricLevelSchema = z.object({
  score: z.number().min(0, "Score must be non-negative"),
  description: z.string().min(1, "Description is required"),
});

/**
 * Schema for rubric criterion (complete criterion with all levels)
 */
export const RubricCriterionSchema = z.object({
  id: z.string().min(1, "ID is required"),
  criterion: z.string().min(1, "Criterion name is required"),
  maxScore: z.number().positive("Max score must be positive"),
  levels: z.array(RubricLevelSchema).min(1, "At least one level is required"),
});

/**
 * Schema for grading detail (result for a single criterion)
 */
export const GradingDetailSchema = z.object({
  criterion: z.string().min(1, "Criterion name is required"),
  maxScore: z.number().min(0, "Max score must be non-negative"),
  achievedScore: z.number().min(0, "Achieved score must be non-negative"),
  reason: z.string().min(1, "Reason is required"),
});

/**
 * Schema for complete grading result
 */
export const GradingResultSchema = z.object({
  totalAchievedScore: z.number().min(0, "Total achieved score must be non-negative"),
  totalMaxScore: z.number().positive("Total max score must be positive"),
  details: z.array(GradingDetailSchema).min(1, "At least one detail is required"),
}).refine(
  (data) => data.totalAchievedScore <= data.totalMaxScore,
  {
    message: "Total achieved score cannot exceed total max score",
    path: ["totalAchievedScore"],
  }
);

/**
 * Schema for PowerPoint specific grading result
 */
export const PowerPointGradingResultSchema = z.object({
  totalScore: z.number().min(0).optional(),
  maxScore: z.number().positive().optional(),
  percentageScore: z.number().min(0).max(100).optional(),
  criteria: z.record(z.string(), z.object({
    name: z.string().min(1, "Criterion name is required"),
    score: z.number().min(0, "Score must be non-negative"),
    maxScore: z.number().positive("Max score must be positive"),
    reason: z.string().min(1, "Reason is required"),
  })).optional(),
});

/**
 * Schema for API response structure
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Schema for query parameters with output format
 */
export const OutputQuerySchema = z.object({
  output: z.enum(["json", "excel"]).optional(),
});

/**
 * Schema for criterion parameter validation
 */
export const CriterionParamSchema = z.object({
  criterionId: z.string().min(1, "Criterion ID is required"),
});

/**
 * Schema for rubric parameter validation
 */
export const RubricParamSchema = z.object({
  criterionId: z.string().min(1, "Criterion ID is required"),
});

/**
 * Schema for export request validation
 */
export const ExportRequestSchema = z.object({
  gradingResults: z.array(z.any()).min(1, "At least one grading result is required"),
  metadata: z.object({
    fileName: z.string().min(1, "File name is required"),
    exportFormat: z.enum(["excel", "csv"]),
    includeDetails: z.boolean().optional(),
  }),
});

// Type exports for better TypeScript integration
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type RubricLevel = z.infer<typeof RubricLevelSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type GradingDetail = z.infer<typeof GradingDetailSchema>;
export type GradingResult = z.infer<typeof GradingResultSchema>;
export type PowerPointGradingResult = z.infer<typeof PowerPointGradingResultSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type OutputQuery = z.infer<typeof OutputQuerySchema>;
export type CriterionParam = z.infer<typeof CriterionParamSchema>;
export type RubricParam = z.infer<typeof RubricParamSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;