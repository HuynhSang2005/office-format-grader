import type { Context } from "hono";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Import schemas and types
import { CommonSchemas } from "../schemas";
import type { ApiResponse, FileProcessingResult, BatchGradingRequest } from "../types_new";

// Import services (will be refactored)
import { createSubmissionSummary } from "../services/submissionSummarizer";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { exportDetailsToExcel, generateExcelBuffer } from "../shared/excelExporter";

// Import utils (will be refactored)
import { successResponse, errorResponse } from "../utils/apiResponse";
import { sanitizeFilename } from "../services/shared/sanitizeFilename";

/**
 * Submission Controller - Handles submission management and batch processing
 * Supports single and batch submission processing with various output formats
 */
export class SubmissionController {

  /**
   * Process single submission
   * POST /api/submissions/process
   */
  async processSubmission(c: Context): Promise<Response> {
    const { includeRubric = false, generateSummary = true } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "submission-processor-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;
      const rubricFile = formData.get("rubricFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Process submission file
      const submissionResult = await this.processSubmissionFile(tempDir, submissionFile);

      // 3. Process rubric file if provided
      let rubricData = null;
      if (rubricFile && includeRubric === "true") {
        rubricData = await this.processRubricFile(tempDir, rubricFile);
      }

      // 4. Create submission summary if requested
      let submissionSummary = null;
      if (generateSummary === "true") {
        submissionSummary = await this.createSubmissionSummary(
          submissionFile,
          submissionResult.data,
          rubricFile,
          rubricData
        );
      }

      const result = {
        submission: submissionResult,
        rubric: rubricData,
        summary: submissionSummary,
        processedAt: new Date().toISOString(),
      };

      return successResponse(c, result, "Submission processed successfully.");

    } catch (error: any) {
      return errorResponse(c, `Submission processing error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Process batch submissions
   * POST /api/submissions/batch
   */
  async processBatchSubmissions(c: Context): Promise<Response> {
    const { generateReport = false, reportFormat = "excel" } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "batch-processor-"));

    try {
      // 1. Parse form data for multiple files
      const formData = await c.req.formData();
      const files = formData.getAll("submissionFiles") as File[];
      const rubricFile = formData.get("rubricFile") as File | null;

      if (!files || files.length === 0) {
        return errorResponse(c, "At least one submission file is required.", 400);
      }

      // 2. Process rubric if provided
      let rubricData = null;
      if (rubricFile) {
        rubricData = await this.processRubricFile(tempDir, rubricFile);
      }

      // 3. Process all submissions
      const results = await this.processBatchFiles(tempDir, files, rubricData);

      // 4. Generate batch report if requested
      if (generateReport === "true") {
        return await this.generateBatchReport(c, results, reportFormat as string);
      }

      const batchResult = {
        totalFiles: files.length,
        successfulFiles: results.filter(r => r.success).length,
        failedFiles: results.filter(r => !r.success).length,
        results,
        processedAt: new Date().toISOString(),
      };

      return successResponse(c, batchResult, "Batch processing completed.");

    } catch (error: any) {
      return errorResponse(c, `Batch processing error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Get submission summary
   * POST /api/submissions/summary
   */
  async getSubmissionSummary(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "submission-summarizer-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Process submission
      const submissionResult = await this.processSubmissionFile(tempDir, submissionFile);

      // 3. Create comprehensive summary
      const summary = await this.createDetailedSummary(submissionFile, submissionResult.data);

      return successResponse(c, { summary }, "Submission summary generated successfully.");

    } catch (error: any) {
      return errorResponse(c, `Summary generation error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Validate submission file
   * POST /api/submissions/validate
   */
  async validateSubmission(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "submission-validator-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Validate file
      const validationResult = await this.validateSubmissionFile(tempDir, submissionFile);

      return successResponse(c, validationResult, "Submission validation completed.");

    } catch (error: any) {
      return errorResponse(c, `Validation error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Export submission data
   * POST /api/submissions/export
   */
  async exportSubmissionData(c: Context): Promise<Response> {
    const { format = "excel", includeDetails = true } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "submission-exporter-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Process submission
      const submissionResult = await this.processSubmissionFile(tempDir, submissionFile);

      // 3. Generate export based on format
      if (format === "excel") {
        return await this.generateExcelExport(c, submissionResult, submissionFile.name);
      } else if (format === "json") {
        return await this.generateJsonExport(c, submissionResult, submissionFile.name);
      } else {
        return errorResponse(c, `Unsupported export format: ${format}`, 400);
      }

    } catch (error: any) {
      return errorResponse(c, `Export error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  // Private helper methods

  private async processSubmissionFile(
    tempDir: string,
    submissionFile: File
  ): Promise<FileProcessingResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate file type
      const extension = path.extname(submissionFile.name).toLowerCase();
      if (extension !== ".pptx" && extension !== ".docx") {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      // 2. Save file temporarily
      const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
      const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
      await fs.writeFile(submissionPath, submissionBuffer);

      // 3. Parse based on file type
      let parsedData;
      if (extension === ".pptx") {
        parsedData = await parsePowerPointFormat(submissionPath);
      } else {
        parsedData = await parseWordWithFormat(submissionPath);
      }

      const processingTime = Date.now() - startTime;

      return {
        filename: submissionFile.name,
        fileType: extension.substring(1),
        success: true,
        data: parsedData,
        processingTime,
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      return {
        filename: submissionFile.name,
        fileType: "unknown",
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  private async processRubricFile(tempDir: string, rubricFile: File): Promise<any> {
    // For now, assume rubric is a text file or Word document
    const rubricBuffer = Buffer.from(await rubricFile.arrayBuffer());
    const rubricPath = path.join(tempDir, sanitizeFilename(rubricFile.name));
    await fs.writeFile(rubricPath, rubricBuffer);

    const extension = path.extname(rubricFile.name).toLowerCase();
    if (extension === ".docx") {
      return await parseWordWithFormat(rubricPath);
    } else if (extension === ".txt") {
      return await fs.readFile(rubricPath, "utf-8");
    } else {
      // Assume it's plain text
      return await fs.readFile(rubricPath, "utf-8");
    }
  }

  private async createSubmissionSummary(
    submissionFile: File,
    submissionData: any,
    rubricFile: File | null,
    rubricData: any
  ): Promise<any> {
    const submissionType = this.getFileType(submissionFile.name);
    const rubricInfo = rubricData ? 
      { filename: rubricFile?.name || "", rawData: { paragraphs: rubricData } } :
      { filename: "", rawData: { paragraphs: "" } };

    return createSubmissionSummary(
      [{ filename: submissionFile.name, type: submissionType, rawData: submissionData }],
      rubricInfo
    );
  }

  private async processBatchFiles(
    tempDir: string,
    files: File[],
    rubricData: any
  ): Promise<FileProcessingResult[]> {
    const results: FileProcessingResult[] = [];

    // Process files in parallel (but limit concurrency)
    const maxConcurrent = 3;
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(file => this.processSubmissionFile(tempDir, file))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async validateSubmissionFile(tempDir: string, submissionFile: File): Promise<any> {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      fileInfo: {
        name: submissionFile.name,
        size: submissionFile.size,
        type: submissionFile.type,
      },
    };

    // Basic validations
    const extension = path.extname(submissionFile.name).toLowerCase();
    if (extension !== ".pptx" && extension !== ".docx") {
      validation.isValid = false;
      validation.errors.push(`Unsupported file type: ${extension}`);
    }

    if (submissionFile.size > 50 * 1024 * 1024) { // 50MB limit
      validation.warnings.push("File size is larger than 50MB, processing may be slow");
    }

    if (submissionFile.size === 0) {
      validation.isValid = false;
      validation.errors.push("File is empty");
    }

    // Try to parse the file to check if it's valid
    if (validation.isValid) {
      try {
        await this.processSubmissionFile(tempDir, submissionFile);
      } catch (error: any) {
        validation.isValid = false;
        validation.errors.push(`File parsing failed: ${error.message}`);
      }
    }

    return validation;
  }

  private async createDetailedSummary(submissionFile: File, submissionData: any): Promise<any> {
    const fileType = this.getFileType(submissionFile.name);
    
    const baseSummary = {
      filename: submissionFile.name,
      fileType,
      fileSize: submissionFile.size,
      processedAt: new Date().toISOString(),
    };

    if (fileType === "pptx") {
      return {
        ...baseSummary,
        slideCount: submissionData.slides?.length || 0,
        hasTheme: !!submissionData.theme,
        hasAnimations: submissionData.slides?.some((s: any) => s.animations) || false,
        hasTransitions: submissionData.slides?.some((s: any) => s.transitions) || false,
        mediaFiles: submissionData.mediaFiles?.length || 0,
        documentProperties: submissionData.documentProperties,
      };
    } else if (fileType === "docx") {
      return {
        ...baseSummary,
        pageCount: submissionData.metadata?.pageCount || 0,
        wordCount: submissionData.metadata?.wordCount || 0,
        paragraphCount: submissionData.content?.length || 0,
        hasHeaders: (submissionData.headers?.length || 0) > 0,
        hasFooters: (submissionData.footers?.length || 0) > 0,
        hasToc: (submissionData.toc?.length || 0) > 0,
        metadata: submissionData.metadata,
      };
    }

    return baseSummary;
  }

  private getFileType(filename: string): "docx" | "pptx" {
    const extension = path.extname(filename).toLowerCase();
    if (extension === ".docx") return "docx";
    if (extension === ".pptx") return "pptx";
    throw new Error(`Unsupported file type: ${extension}`);
  }

  private async generateBatchReport(
    c: Context,
    results: FileProcessingResult[],
    format: string
  ): Promise<Response> {
    if (format === "excel") {
      // Create summary report
      const workbook = this.createBatchReportWorkbook(results);
      const buffer = await generateExcelBuffer(workbook);

      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename="batch-processing-report-${Date.now()}.xlsx"`
      );

      return c.body(buffer);
    } else {
      // JSON format
      const report = {
        summary: {
          totalFiles: results.length,
          successfulFiles: results.filter(r => r.success).length,
          failedFiles: results.filter(r => !r.success).length,
          averageProcessingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length,
        },
        results,
        generatedAt: new Date().toISOString(),
      };

      return successResponse(c, report, "Batch report generated successfully.");
    }
  }

  private async generateExcelExport(
    c: Context,
    submissionResult: FileProcessingResult,
    filename: string
  ): Promise<Response> {
    const workbook = exportDetailsToExcel(
      { data: submissionResult.data },
      submissionResult.data,
      filename
    );
    const buffer = await generateExcelBuffer(workbook);

    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    c.header(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(`export-${filename}.xlsx`)}"`
    );

    return c.body(buffer);
  }

  private async generateJsonExport(
    c: Context,
    submissionResult: FileProcessingResult,
    filename: string
  ): Promise<Response> {
    const exportData = {
      filename,
      exportedAt: new Date().toISOString(),
      data: submissionResult.data,
    };

    c.header("Content-Type", "application/json");
    c.header(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(`export-${filename}.json`)}"`
    );

    return c.json(exportData);
  }

  private createBatchReportWorkbook(results: FileProcessingResult[]): any {
    // This would create a detailed Excel workbook with batch processing results
    // For now, return a placeholder - this would be implemented with the actual Excel library
    return {
      summary: {
        totalFiles: results.length,
        successfulFiles: results.filter(r => r.success).length,
        failedFiles: results.filter(r => !r.success).length,
      },
      details: results,
    };
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Cannot cleanup temporary directory:", error);
    }
  }
}