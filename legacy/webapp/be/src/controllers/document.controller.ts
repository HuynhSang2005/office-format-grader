import type { Context } from "hono";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Import schemas and types
import { PowerPointSchemas, WordSchemas } from "../schemas";
import type { ApiResponse, DocumentType, ProcessingMode } from "../types_new";

// Import services (will be refactored)
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";

// Import utils (will be refactored)
import { successResponse, errorResponse } from "../utils/apiResponse";
import { sanitizeFilename } from "../services/shared/sanitizeFilename";

/**
 * Document Analyzer Controller - Handles document parsing and analysis
 * Supports PowerPoint and Word documents with detailed format extraction
 */
export class DocumentAnalyzerController {

  /**
   * Analyze document format and structure
   * POST /api/documents/analyze
   */
  async analyzeDocument(c: Context): Promise<Response> {
    const { mode = "summary", extractImages = false, extractMetadata = true } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-document-analyzer-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const documentFile = formData.get("documentFile") as File | null;

      if (!documentFile) {
        return errorResponse(c, "documentFile is required.", 400);
      }

      // 2. Validate and determine file type
      const fileInfo = await this.validateAndSaveFile(tempDir, documentFile);

      // 3. Parse document based on type
      const parsedData = await this.parseDocumentByType(
        fileInfo.path,
        fileInfo.type,
        mode as ProcessingMode
      );

      // 4. Create analysis result
      const analysisResult = await this.createAnalysisResult(
        parsedData,
        fileInfo.type,
        documentFile.name,
        {
          mode: mode as ProcessingMode,
          extractImages: extractImages === "true",
          extractMetadata: extractMetadata === "true",
        }
      );

      return successResponse(c, analysisResult, "Document analyzed successfully.");

    } catch (error: any) {
      return errorResponse(c, `Analysis error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Get document metadata only
   * POST /api/documents/metadata
   */
  async getDocumentMetadata(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-metadata-extractor-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const documentFile = formData.get("documentFile") as File | null;

      if (!documentFile) {
        return errorResponse(c, "documentFile is required.", 400);
      }

      // 2. Validate and save file
      const fileInfo = await this.validateAndSaveFile(tempDir, documentFile);

      // 3. Extract metadata only
      const metadata = await this.extractMetadataOnly(fileInfo.path, fileInfo.type);

      return successResponse(c, { metadata }, "Metadata extracted successfully.");

    } catch (error: any) {
      return errorResponse(c, `Metadata extraction error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Compare two documents (structure comparison)
   * POST /api/documents/compare
   */
  async compareDocuments(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-document-comparer-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const document1 = formData.get("document1") as File | null;
      const document2 = formData.get("document2") as File | null;

      if (!document1 || !document2) {
        return errorResponse(c, "Both document1 and document2 are required.", 400);
      }

      // 2. Validate and save both files
      const file1Info = await this.validateAndSaveFile(tempDir, document1, "doc1");
      const file2Info = await this.validateAndSaveFile(tempDir, document2, "doc2");

      // 3. Check if both files are of the same type
      if (file1Info.type !== file2Info.type) {
        return errorResponse(c, "Both documents must be of the same type for comparison.", 400);
      }

      // 4. Parse both documents
      const [parsedData1, parsedData2] = await Promise.all([
        this.parseDocumentByType(file1Info.path, file1Info.type, "summary"),
        this.parseDocumentByType(file2Info.path, file2Info.type, "summary"),
      ]);

      // 5. Compare documents
      const comparisonResult = await this.compareDocumentStructures(
        parsedData1,
        parsedData2,
        file1Info.type
      );

      return successResponse(c, comparisonResult, "Documents compared successfully.");

    } catch (error: any) {
      return errorResponse(c, `Comparison error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  /**
   * Validate document structure
   * POST /api/documents/validate
   */
  async validateDocument(c: Context): Promise<Response> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-document-validator-"));

    try {
      // 1. Parse and validate form data
      const formData = await c.req.formData();
      const documentFile = formData.get("documentFile") as File | null;

      if (!documentFile) {
        return errorResponse(c, "documentFile is required.", 400);
      }

      // 2. Validate and save file
      const fileInfo = await this.validateAndSaveFile(tempDir, documentFile);

      // 3. Parse and validate document
      const parsedData = await this.parseDocumentByType(fileInfo.path, fileInfo.type, "detailed");

      // 4. Run validation checks
      const validationResult = await this.validateDocumentStructure(parsedData, fileInfo.type);

      return successResponse(c, validationResult, "Document validation completed.");

    } catch (error: any) {
      return errorResponse(c, `Validation error: ${error.message}`, 500);
    } finally {
      await this.cleanupTempDirectory(tempDir);
    }
  }

  // Private helper methods

  private async validateAndSaveFile(
    tempDir: string,
    file: File,
    prefix: string = "doc"
  ): Promise<{ path: string; type: DocumentType }> {
    const extension = path.extname(file.name).toLowerCase();
    
    if (extension !== ".pptx" && extension !== ".docx") {
      throw new Error(`Unsupported file type: ${extension}. Only .pptx and .docx files are supported.`);
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(tempDir, `${prefix}_${sanitizeFilename(file.name)}`);
    await fs.writeFile(filePath, fileBuffer);

    return {
      path: filePath,
      type: extension.substring(1) as DocumentType,
    };
  }

  private async parseDocumentByType(
    filePath: string,
    fileType: DocumentType,
    mode: ProcessingMode
  ): Promise<any> {
    const options = this.getParsingOptions(mode);

    if (fileType === "pptx") {
      return await parsePowerPointFormat(filePath);
    } else if (fileType === "docx") {
      return await parseWordWithFormat(filePath);
    } else {
      throw new Error(`Unsupported file type for parsing: ${fileType}`);
    }
  }

  private getParsingOptions(mode: ProcessingMode) {
    switch (mode) {
      case "summary":
        return {
          extractText: true,
          extractImages: false,
          extractMetadata: true,
          preserveFormatting: false,
        };
      case "detailed":
        return {
          extractText: true,
          extractImages: true,
          extractMetadata: true,
          preserveFormatting: true,
        };
      case "full":
        return {
          extractText: true,
          extractImages: true,
          extractMetadata: true,
          preserveFormatting: true,
          includeHiddenContent: true,
        };
      default:
        return {
          extractText: true,
          extractMetadata: true,
        };
    }
  }

  private async createAnalysisResult(
    parsedData: any,
    fileType: DocumentType,
    filename: string,
    options: any
  ): Promise<any> {
    const baseResult = {
      filename,
      fileType,
      analysisMode: options.mode,
      timestamp: new Date().toISOString(),
    };

    if (fileType === "pptx") {
      return {
        ...baseResult,
        slideCount: parsedData.slides?.length || 0,
        hasTheme: !!parsedData.theme,
        hasAnimations: this.hasAnimations(parsedData),
        hasTransitions: this.hasTransitions(parsedData),
        hasHeaderFooter: this.hasHeaderFooter(parsedData),
        hasHyperlinks: this.hasHyperlinks(parsedData),
        mediaCount: parsedData.mediaFiles?.length || 0,
        documentProperties: parsedData.documentProperties,
        ...(options.mode === "detailed" && { parsedData }),
      };
    } else if (fileType === "docx") {
      return {
        ...baseResult,
        pageCount: parsedData.metadata?.pageCount || 0,
        wordCount: parsedData.metadata?.wordCount || 0,
        paragraphCount: parsedData.content?.length || 0,
        hasHeaders: (parsedData.headers?.length || 0) > 0,
        hasFooters: (parsedData.footers?.length || 0) > 0,
        hasToc: (parsedData.toc?.length || 0) > 0,
        metadata: parsedData.metadata,
        ...(options.mode === "detailed" && { parsedData }),
      };
    }

    return { ...baseResult, parsedData };
  }

  private async extractMetadataOnly(filePath: string, fileType: DocumentType): Promise<any> {
    // Quick metadata extraction without full parsing
    if (fileType === "pptx") {
      const parsedData = await parsePowerPointFormat(filePath);
      return parsedData.documentProperties || {};
    } else if (fileType === "docx") {
      const parsedData = await parseWordWithFormat(filePath);
      return parsedData.metadata || {};
    }
    return {};
  }

  private async compareDocumentStructures(
    data1: any,
    data2: any,
    fileType: DocumentType
  ): Promise<any> {
    if (fileType === "pptx") {
      return {
        slidesComparison: {
          document1Slides: data1.slides?.length || 0,
          document2Slides: data2.slides?.length || 0,
          difference: Math.abs((data1.slides?.length || 0) - (data2.slides?.length || 0)),
        },
        themeComparison: {
          document1HasTheme: !!data1.theme,
          document2HasTheme: !!data2.theme,
          themesMatch: this.compareThemes(data1.theme, data2.theme),
        },
        structureSimilarity: this.calculateStructureSimilarity(data1, data2, fileType),
      };
    } else if (fileType === "docx") {
      return {
        contentComparison: {
          document1Paragraphs: data1.content?.length || 0,
          document2Paragraphs: data2.content?.length || 0,
          difference: Math.abs((data1.content?.length || 0) - (data2.content?.length || 0)),
        },
        wordCountComparison: {
          document1Words: data1.metadata?.wordCount || 0,
          document2Words: data2.metadata?.wordCount || 0,
          difference: Math.abs((data1.metadata?.wordCount || 0) - (data2.metadata?.wordCount || 0)),
        },
        structureSimilarity: this.calculateStructureSimilarity(data1, data2, fileType),
      };
    }

    return { similarity: 0, details: "Unsupported file type for comparison" };
  }

  private async validateDocumentStructure(parsedData: any, fileType: DocumentType): Promise<any> {
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    if (fileType === "pptx") {
      // PowerPoint validation
      if (!parsedData.slides || parsedData.slides.length === 0) {
        validationResults.errors.push("No slides found in presentation");
        validationResults.isValid = false;
      }

      if (parsedData.slides && parsedData.slides.length > 100) {
        validationResults.warnings.push("Presentation has more than 100 slides, consider splitting");
      }

      if (!parsedData.theme) {
        validationResults.suggestions.push("Consider applying a consistent theme to the presentation");
      }
    } else if (fileType === "docx") {
      // Word validation
      if (!parsedData.content || parsedData.content.length === 0) {
        validationResults.errors.push("No content found in document");
        validationResults.isValid = false;
      }

      if (parsedData.metadata?.wordCount && parsedData.metadata.wordCount < 100) {
        validationResults.warnings.push("Document appears to be very short");
      }

      if (!parsedData.metadata?.title) {
        validationResults.suggestions.push("Consider adding a document title");
      }
    }

    return validationResults;
  }

  // Helper methods for analysis
  private hasAnimations(data: any): boolean {
    return data.slides?.some((slide: any) => slide.animations && slide.animations.effects?.length > 0) || false;
  }

  private hasTransitions(data: any): boolean {
    return data.slides?.some((slide: any) => slide.transitions) || false;
  }

  private hasHeaderFooter(data: any): boolean {
    return data.slides?.some((slide: any) => slide.headerFooter) || false;
  }

  private hasHyperlinks(data: any): boolean {
    return data.slides?.some((slide: any) => 
      slide.shapes?.some((shape: any) => shape.hyperlinks?.length > 0)
    ) || false;
  }

  private compareThemes(theme1: any, theme2: any): boolean {
    if (!theme1 || !theme2) return false;
    return JSON.stringify(theme1) === JSON.stringify(theme2);
  }

  private calculateStructureSimilarity(data1: any, data2: any, fileType: DocumentType): number {
    // Simple similarity calculation - can be enhanced
    if (fileType === "pptx") {
      const slides1 = data1.slides?.length || 0;
      const slides2 = data2.slides?.length || 0;
      const maxSlides = Math.max(slides1, slides2);
      if (maxSlides === 0) return 1;
      return 1 - Math.abs(slides1 - slides2) / maxSlides;
    } else if (fileType === "docx") {
      const words1 = data1.metadata?.wordCount || 0;
      const words2 = data2.metadata?.wordCount || 0;
      const maxWords = Math.max(words1, words2);
      if (maxWords === 0) return 1;
      return 1 - Math.abs(words1 - words2) / maxWords;
    }
    return 0;
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Cannot cleanup temporary directory:", error);
    }
  }
}