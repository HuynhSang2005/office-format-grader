import { z } from "zod";
import { GradingResultSchema, OutputQuerySchema } from "./common.schema";

/**
 * Schema for AI checker request body (form data)
 */
export const AiCheckerRequestSchema = z.object({
  rubricFile: z.instanceof(File, { message: "Rubric file is required" }),
  submissionFile: z.instanceof(File, { message: "Submission file is required" }),
});

/**
 * Schema for AI checker query parameters
 */
export const AiCheckerQuerySchema = OutputQuerySchema;

/**
 * Schema for submission summary request
 */
export const SubmissionSummaryRequestSchema = z.object({
  submissionFile: z.instanceof(File, { message: "Submission file is required" }),
});

/**
 * Schema for format extraction request
 */
export const FormatExtractionRequestSchema = z.object({
  submissionFile: z.instanceof(File, { message: "Submission file is required" }),
});

/**
 * Schema for AI checker response (JSON format)
 */
export const AiCheckerResponseSchema = z.object({
  gradingResult: GradingResultSchema,
  submissionDetails: z.object({
    submission: z.object({
      student: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
      }).optional(),
      files: z.array(z.object({
        filename: z.string(),
        type: z.enum(["docx", "pptx"]),
        format: z.any(), // Dynamic format data
      })).optional(),
    }).optional(),
  }).optional(),
});

/**
 * Schema for submission summary response
 */
export const SubmissionSummaryResponseSchema = z.object({
  summary: z.object({
    submission: z.object({
      student: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
      }).optional(),
      files: z.array(z.object({
        filename: z.string(),
        type: z.enum(["docx", "pptx"]),
        format: z.any(), // Dynamic format data
      })).optional(),
    }).optional(),
  }),
});

/**
 * Schema for format extraction response
 */
export const FormatExtractionResponseSchema = z.object({
  fileType: z.enum(["docx", "pptx"]),
  formatData: z.any(), // Dynamic format data structure
});

/**
 * Schema for AI configuration
 */
export const AiConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().default("models/gemini-2.5-flash-lite"),
  temperature: z.number().min(0).max(1).default(0),
  maxRetries: z.number().int().positive().default(3),
  retryDelayMs: z.number().int().positive().default(1000),
});

// Type exports
export type AiCheckerRequest = z.infer<typeof AiCheckerRequestSchema>;
export type AiCheckerQuery = z.infer<typeof AiCheckerQuerySchema>;
export type SubmissionSummaryRequest = z.infer<typeof SubmissionSummaryRequestSchema>;
export type FormatExtractionRequest = z.infer<typeof FormatExtractionRequestSchema>;
export type AiCheckerResponse = z.infer<typeof AiCheckerResponseSchema>;
export type SubmissionSummaryResponse = z.infer<typeof SubmissionSummaryResponseSchema>;
export type FormatExtractionResponse = z.infer<typeof FormatExtractionResponseSchema>;
export type AiConfig = z.infer<typeof AiConfigSchema>;