import type { Context } from "hono";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import mammoth from "mammoth";

// Import schemas and types
import { AiSchemas, CommonSchemas } from "../schemas";
import type { ApiResponse, ProcessingStatus } from "../types_new";

// Import services (will be refactored)
import { gradeSubmissionWithAI } from "../services/aiChecker";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { createSubmissionSummary } from "../services/submissionSummarizer";
import { exportDetailsToExcel, generateExcelBuffer } from "../shared/excelExporter";

// Import utils (will be refactored)
import { successResponse, errorResponse } from "../utils/apiResponse";
import { sanitizeFilename } from "../services/shared/sanitizeFilename";

/**
 * AI Controller - Handles AI-powered grading requests
 * Follows REST API patterns with proper error handling and validation
 */
export class AiController {

  /**
   * Grade submission using AI
   * POST /api/ai/checker
   */
  async gradeWithAI(c: Context): Promise<Response> {
    const queryValidation = AiSchemas.Query.safeParse(c.req.query());
    if (!queryValidation.success) {
      return errorResponse(c, "Invalid query parameters", 400);
    }

    const { output } = queryValidation.data;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-checker-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const rubricFile = formData.get("rubricFile") as File | null;
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!rubricFile || !submissionFile) {
        return errorResponse(c, "Both rubricFile and submissionFile are required.", 400);
      }

      // 2. Save temporary files
      const { rubricPath, submissionPath } = await this.saveTemporaryFiles(
        tempDir,
        rubricFile,
        submissionFile
      );

      // 3. Parse rubric
      const rubricTextData = await this.parseRubricFile(rubricPath);

      // 4. Parse submission
      const submissionRawData = await this.parseSubmissionFile(
        submissionPath,
        submissionFile.name
      );

      // 5. Create submission summary
      const submissionSummary = await this.createSubmissionSummary(
        submissionFile,
        submissionRawData,
        rubricFile,
        rubricTextData
      );

      // 6. Grade with AI
      const aiResult = await gradeSubmissionWithAI(
        rubricTextData,
        JSON.stringify(submissionSummary?.submission?.files?.[0]?.format ?? {}, null, 2)
      );

      // 7. Handle output format
      if (output === "excel") {
        return await this.generateExcelResponse(
          c,
          aiResult,
          submissionRawData,
          submissionFile.name,
          submissionSummary
        );
      }

      // Return JSON response
      const response = AiSchemas.Response.parse({
        gradingResult: aiResult,
        submissionDetails: submissionSummary,
      });

      return successResponse(c, response, "AI grading completed successfully.");

    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Summarize submission without grading
   * POST /api/ai/summarize
   */
  async summarizeSubmission(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-summarizer-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Save temporary file
      const submissionPath = await this.saveSubmissionFile(tempDir, submissionFile);

      // 3. Parse submission
      const submissionRawData = await this.parseSubmissionFile(
        submissionPath,
        submissionFile.name
      );

      // 4. Create summary
      const submissionType = this.getFileType(submissionFile.name);
      const emptyRubric = { filename: "", rawData: { paragraphs: "" } };
      
      const submissionSummary = createSubmissionSummary(
        [{ filename: submissionFile.name, type: submissionType, rawData: submissionRawData }],
        emptyRubric
      );

      const response = AiSchemas.SubmissionSummaryResponse.parse({
        summary: submissionSummary,
      });

      return successResponse(c, response, "Submission summarized successfully.");

    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Extract format data from submission
   * POST /api/ai/extract-format
   */
  async extractFormat(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-extractor-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Save temporary file
      const submissionPath = await this.saveSubmissionFile(tempDir, submissionFile);

      // 3. Parse format data
      const formatData = await this.parseSubmissionFile(
        submissionPath,
        submissionFile.name
      );

      // 4. Return format data
      const fileType = this.getFileType(submissionFile.name);
      const response = AiSchemas.FormatExtractionResponse.parse({
        fileType,
        formatData,
      });

      return successResponse(c, response, "Format data extracted successfully.");

    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  // Private helper methods

  private async saveTemporaryFiles(
    tempDir: string,
    rubricFile: File,
    submissionFile: File
  ): Promise<{ rubricPath: string; submissionPath: string }> {
    const rubricBuffer = Buffer.from(await rubricFile.arrayBuffer());
    const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());

    const rubricPath = path.join(tempDir, sanitizeFilename(rubricFile.name));
    const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));

    await Promise.all([
      fs.writeFile(rubricPath, rubricBuffer),
      fs.writeFile(submissionPath, submissionBuffer),
    ]);

    return { rubricPath, submissionPath };
  }

  private async saveSubmissionFile(tempDir: string, submissionFile: File): Promise<string> {
    const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
    const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
    await fs.writeFile(submissionPath, submissionBuffer);
    return submissionPath;
  }

  private async parseRubricFile(rubricPath: string): Promise<string> {
    try {
      const { value } = await mammoth.extractRawText({ path: rubricPath });
      return value;
    } catch (err: any) {
      throw new Error(`Cannot parse rubric file: ${err.message || err}`);
    }
  }

  private async parseSubmissionFile(submissionPath: string, filename: string): Promise<any> {
    const extension = path.extname(filename).toLowerCase();

    if (extension === ".docx") {
      return await parseWordWithFormat(submissionPath);
    } else if (extension === ".pptx") {
      return await parsePowerPointFormat(submissionPath);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  private getFileType(filename: string): "docx" | "pptx" {
    const extension = path.extname(filename).toLowerCase();
    if (extension === ".docx") return "docx";
    if (extension === ".pptx") return "pptx";
    throw new Error(`Unsupported file type: ${extension}`);
  }

  private async createSubmissionSummary(
    submissionFile: File,
    submissionRawData: any,
    rubricFile: File,
    rubricTextData: string
  ) {
    const submissionType = this.getFileType(submissionFile.name);
    
    return createSubmissionSummary(
      [{ filename: submissionFile.name, type: submissionType, rawData: submissionRawData }],
      { filename: rubricFile.name, rawData: { paragraphs: rubricTextData } }
    );
  }

  private async generateExcelResponse(
    c: Context,
    aiResult: any,
    submissionRawData: any,
    submissionFilename: string,
    submissionSummary: any
  ): Promise<Response> {
    console.log("Generating Excel report...");

    // Get student information from summary if available
    const studentId = submissionSummary?.submission?.student?.id || "Unknown";
    const studentName = submissionSummary?.submission?.student?.name || "Unknown";

    // Generate Excel report
    const workbook = exportDetailsToExcel(
      aiResult,
      submissionRawData,
      `${studentName} (${studentId}) - ${submissionFilename}`
    );

    const buffer = await generateExcelBuffer(workbook);

    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    c.header(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(`ai-grading-report-${submissionFilename}.xlsx`)}"`
    );

    return c.body(buffer);
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error cleaning up temporary directory:", cleanupError);
    }
  }
}