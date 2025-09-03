import { z } from "zod";

/**
 * Schema for Word format data from mammoth
 */
export const WordFormatDataSchema = z.object({
  html: z.string(),
  messages: z.array(z.any()),
});

/**
 * Schema for text run (formatted text segment)
 */
export const TextRunSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  isBold: z.boolean().optional(),
  isItalic: z.boolean().optional(),
  underline: z.string().optional(),
  font: z.string().optional(),
  size: z.number().optional(),
  color: z.string().optional(),
  hyperlink: z.string().optional(),
});

/**
 * Schema for drawing/image in document
 */
export const DrawingSchema = z.object({
  type: z.literal("drawing"),
  drawingType: z.enum(["image", "chart"]),
  imageName: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  chartData: z.any().optional(),
  caption: z.string().optional(),
});

/**
 * Schema for paragraph
 */
export const ParagraphSchema = z.object({
  runs: z.array(z.union([TextRunSchema, DrawingSchema])),
  alignment: z.enum(["left", "right", "center", "justify"]).or(z.string()).optional(),
  indentation: z.object({
    left: z.number().optional(),
    right: z.number().optional(),
    firstLine: z.number().optional(),
    hanging: z.number().optional(),
  }).optional(),
  styleName: z.string().optional(),
  listInfo: z.object({
    listId: z.string(),
    level: z.number(),
  }).optional(),
});

/**
 * Schema for table cell
 */
export const TableCellSchema = z.object({
  content: z.array(ParagraphSchema),
});

/**
 * Schema for table
 */
export const TableSchema = z.object({
  type: z.literal("table"),
  rows: z.array(z.array(TableCellSchema)),
});

/**
 * Schema for document metadata
 */
export const DocumentMetadataSchema = z.object({
  author: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  pageCount: z.number().optional(),
  wordCount: z.number().optional(),
  charCount: z.number().optional(),
});

/**
 * Schema for table of contents item
 */
export const TocItemSchema = z.object({
  level: z.number(),
  text: z.string(),
});

/**
 * Schema for header/footer content
 */
export const HeaderFooterContentSchema = z.object({
  type: z.enum(["default", "first", "even"]),
  content: z.array(z.union([ParagraphSchema, TableSchema])),
});

/**
 * Schema for parsed Word document data
 */
export const ParsedWordDataSchema = z.object({
  content: z.array(z.union([ParagraphSchema, TableSchema])),
  headers: z.array(HeaderFooterContentSchema).optional(),
  footers: z.array(HeaderFooterContentSchema).optional(),
  metadata: DocumentMetadataSchema.optional(),
  toc: z.array(TocItemSchema).optional(),
});

/**
 * Schema for Word analysis request
 */
export const WordAnalysisRequestSchema = z.object({
  submissionFile: z.instanceof(File, { message: "Submission file is required" }),
  mode: z.enum(["summary", "detailed"]).default("summary"),
});

/**
 * Schema for Word analysis response
 */
export const WordAnalysisResponseSchema = z.object({
  fileType: z.literal("docx"),
  formatData: ParsedWordDataSchema,
  analysis: z.object({
    pageCount: z.number().optional(),
    wordCount: z.number().optional(),
    charCount: z.number().optional(),
    paragraphCount: z.number().optional(),
    tableCount: z.number().optional(),
    imageCount: z.number().optional(),
    hasHeaders: z.boolean().optional(),
    hasFooters: z.boolean().optional(),
    hasToc: z.boolean().optional(),
    hyperlinksCount: z.number().optional(),
    stylesUsed: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Schema for Word document summary
 */
export const WordDocumentSummarySchema = z.object({
  filename: z.string(),
  type: z.literal("docx"),
  rawData: ParsedWordDataSchema,
});

// Type exports
export type WordFormatData = z.infer<typeof WordFormatDataSchema>;
export type TextRun = z.infer<typeof TextRunSchema>;
export type Drawing = z.infer<typeof DrawingSchema>;
export type Paragraph = z.infer<typeof ParagraphSchema>;
export type TableCell = z.infer<typeof TableCellSchema>;
export type Table = z.infer<typeof TableSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type TocItem = z.infer<typeof TocItemSchema>;
export type HeaderFooterContent = z.infer<typeof HeaderFooterContentSchema>;
export type ParsedWordData = z.infer<typeof ParsedWordDataSchema>;
export type WordAnalysisRequest = z.infer<typeof WordAnalysisRequestSchema>;
export type WordAnalysisResponse = z.infer<typeof WordAnalysisResponseSchema>;
export type WordDocumentSummary = z.infer<typeof WordDocumentSummarySchema>;