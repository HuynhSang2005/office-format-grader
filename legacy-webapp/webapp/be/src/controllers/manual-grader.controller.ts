import type { Context } from "hono";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Import schemas and types
import { PowerPointSchemas, WordSchemas } from "../schemas";
import type { ApiResponse } from "../types_new";

// Import services (will be refactored)
import { gradePptxManually } from "../services/manual_rubric/manualGrader.service";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { exportDetailsToExcel, generateExcelBuffer } from "../shared/excelExporter";
import { convertToNewFormat } from "../helpers/gradingResultHelper";
import { getRubric } from "../utils/powerpointRubric";

// Import utils (will be refactored)
import { successResponse, errorResponse } from "../utils/apiResponse";
import { sanitizeFilename } from "../services/shared/sanitizeFilename";

/**
 * Manual Grader Controller - Handles manual grading requests
 * Supports both PowerPoint and Word documents with automatic file type detection
 */
export class ManualGraderController {

  /**
   * Grade document manually using rule-based criteria
   * POST /api/manual-grader/check
   */
  async gradeManually(c: Context): Promise<Response> {
    const { output, format } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-manual-checker-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Validate file type and save temporarily
      const fileInfo = await this.validateAndSaveFile(tempDir, submissionFile);

      // 3. Parse document based on file type
      const parsedData = await this.parseDocument(fileInfo.path, fileInfo.type);

      // 4. Grade using manual criteria
      const gradingResult = await this.gradeByFileType(fileInfo.type, parsedData);

      // 5. Handle output format
      if (output === "excel") {
        return await this.generateExcelResponse(c, gradingResult, parsedData, submissionFile.name);
      }

      // 6. Return JSON response based on format
      if (format === "detailed") {
        return await this.generateDetailedResponse(c, gradingResult, parsedData, submissionFile.name);
      }

      return successResponse(c, gradingResult, "Manual grading completed successfully.");

    } catch (error: any) {
      return errorResponse(c, `Grading error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Get current rubric information
   * GET /api/manual-grader/rubric
   */
  async getRubric(c: Context): Promise<Response> {
    try {
      const rubric = getRubric();
      return successResponse(c, { rubric }, "Rubric retrieved successfully.");
    } catch (error: any) {
      return errorResponse(c, `Cannot retrieve rubric: ${error.message}`, 500);
    }
  }

  /**
   * Analyze document without grading (for debugging)
   * POST /api/manual-grader/analyze
   */
  async analyzeOnly(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-analyzer-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required for analysis.", 400);
      }

      // 2. Validate file type and save temporarily
      const fileInfo = await this.validateAndSaveFile(tempDir, submissionFile);

      // 3. Parse document
      const parsedData = await this.parseDocument(fileInfo.path, fileInfo.type);

      // 4. Create simplified analysis data
      const simplifiedData = this.createSimplifiedAnalysis(parsedData, fileInfo.type);

      return successResponse(c, { parsedData: simplifiedData }, "Document analyzed successfully.");

    } catch (error: any) {
      return errorResponse(c, `Analysis error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Check specific criterion
   * POST /api/manual-grader/criterion/:criterionId
   */
  async checkCriterion(c: Context): Promise<Response> {
    const criterionId = c.req.param("criterionId");
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-criterion-checker-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const submissionFile = formData.get("submissionFile") as File | null;

      if (!submissionFile) {
        return errorResponse(c, "submissionFile is required.", 400);
      }

      // 2. Validate file type and save temporarily
      const fileInfo = await this.validateAndSaveFile(tempDir, submissionFile);

      // 3. Parse document
      const parsedData = await this.parseDocument(fileInfo.path, fileInfo.type);

      // 4. Check specific criterion
      const result = await this.checkSpecificCriterion(criterionId, parsedData, fileInfo.type);

      return successResponse(c, result, `Criterion ${criterionId} checked successfully.`);

    } catch (error: any) {
      return errorResponse(c, `Criterion check error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  // Private helper methods

  private async validateAndSaveFile(
    tempDir: string,
    submissionFile: File
  ): Promise<{ path: string; type: "pptx" | "docx" }> {
    const extension = path.extname(submissionFile.name).toLowerCase();
    
    if (extension !== ".pptx" && extension !== ".docx") {
      throw new Error(`Unsupported file type: ${extension}. Only .pptx and .docx files are supported.`);
    }

    const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
    const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
    await fs.writeFile(submissionPath, submissionBuffer);

    return {
      path: submissionPath,
      type: extension.substring(1) as "pptx" | "docx",
    };
  }

  private async parseDocument(filePath: string, fileType: "pptx" | "docx"): Promise<any> {
    if (fileType === "pptx") {
      return await parsePowerPointFormat(filePath);
    } else if (fileType === "docx") {
      return await parseWordWithFormat(filePath);
    } else {
      throw new Error(`Unsupported file type for parsing: ${fileType}`);
    }
  }

  private async gradeByFileType(fileType: "pptx" | "docx", parsedData: any): Promise<any> {
    if (fileType === "pptx") {
      return await gradePptxManually(parsedData);
    } else if (fileType === "docx") {
      // TODO: Implement Word manual grading
      throw new Error("Manual Word document grading is not yet implemented.");
    } else {
      throw new Error(`Unsupported file type for grading: ${fileType}`);
    }
  }

  private createSimplifiedAnalysis(parsedData: any, fileType: "pptx" | "docx"): any {
    if (fileType === "pptx") {
      return {
        fileName: parsedData.fileName,
        documentProperties: parsedData.documentProperties,
        slideCount: parsedData.slides?.length || 0,
        slideInfo: parsedData.slides?.map((slide: any) => ({
          slideNumber: slide.slideNumber,
          layout: slide.layout,
          hasTransition: !!slide.transition,
          objectCount: slide.shapes?.length || 0,
          displayInfo: slide.displayInfo,
        })),
      };
    } else if (fileType === "docx") {
      return {
        fileName: parsedData.fileName || "Unknown",
        documentProperties: parsedData.metadata,
        pageCount: parsedData.metadata?.pageCount || 0,
        wordCount: parsedData.metadata?.wordCount || 0,
        paragraphCount: parsedData.content?.length || 0,
        hasHeaders: (parsedData.headers?.length || 0) > 0,
        hasFooters: (parsedData.footers?.length || 0) > 0,
        hasToc: (parsedData.toc?.length || 0) > 0,
      };
    }
    
    return parsedData;
  }

  private async checkSpecificCriterion(
    criterionId: string,
    parsedData: any,
    fileType: "pptx" | "docx"
  ): Promise<any> {
    if (fileType === "pptx") {
      // Import PowerPoint checker modules dynamically
      const checkers = await import("../services/manual_rubric/criteriaCheckers");

      // Map criterionId to checker function
      const checkerMap: Record<string, any> = {
        filename: checkers.checkFilename,
        headerFooter: checkers.checkHeaderFooter,
        transitions: checkers.checkTransitions,
        objects: checkers.checkObjects,
        slideMaster: checkers.checkSlideMaster,
        themes: checkers.checkThemes,
        hyperlink: checkers.checkHyperlink,
        animations: checkers.checkAnimations,
        slidesFromOutline: checkers.checkSlidesFromOutline,
        creativity: checkers.checkCreativity,
      };

      const checker = checkerMap[criterionId];
      if (!checker) {
        throw new Error(`No checker found for criterion: ${criterionId}`);
      }

      return checker(parsedData);
    } else if (fileType === "docx") {
      // TODO: Implement Word-specific criterion checking
      throw new Error(`Word criterion checking for ${criterionId} is not yet implemented.`);
    } else {
      throw new Error(`Unsupported file type for criterion checking: ${fileType}`);
    }
  }

  private async generateExcelResponse(
    c: Context,
    gradingResult: any,
    parsedData: any,
    filename: string
  ): Promise<Response> {
    const workbook = exportDetailsToExcel(gradingResult, parsedData, filename);
    const buffer = await generateExcelBuffer(workbook);

    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const safeFilename = sanitizeFilename(filename);
    c.header(
      "Content-Disposition",
      `attachment; filename="manual-report-${safeFilename}.xlsx"`
    );

    return c.body(buffer);
  }

  private async generateDetailedResponse(
    c: Context,
    gradingResult: any,
    parsedData: any,
    filename: string
  ): Promise<Response> {
    const detailedResult = {
      result: convertToNewFormat(gradingResult),
      parsedData: {
        fileName: parsedData.fileName || filename,
        slideCount: parsedData.slides?.length || parsedData.content?.length || 0,
        metadata: {
          title: parsedData.documentProperties?.title || parsedData.metadata?.title || "",
          author: parsedData.documentProperties?.creator || parsedData.metadata?.author || "",
          company: parsedData.documentProperties?.company || "",
          createdAt: parsedData.documentProperties?.created || parsedData.metadata?.createdAt || "",
          modifiedAt: parsedData.documentProperties?.modified || parsedData.metadata?.modifiedAt || "",
        },
      },
      rubric: getRubric(),
    };

    return successResponse(c, detailedResult, "Manual grading completed with detailed results.");
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Cannot cleanup temporary directory:", error);
    }
  }
}