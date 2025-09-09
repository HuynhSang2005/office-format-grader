/**
 * Word document types and interfaces
 * Consolidated from existing Word types with better organization
 */

import type { ChartData } from "./powerpoint.types";

/**
 * Word format data from mammoth parser
 */
export interface WordFormatData {
  html: string;
  messages: any[]; // Warnings and errors from mammoth
  value?: string; // Raw text content
}

/**
 * Text run with formatting
 */
export interface TextRun {
  type: "text";
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  underline?: string;
  strikethrough?: boolean;
  font?: string;
  size?: number; // In points
  color?: string;
  backgroundColor?: string;
  hyperlink?: string;
  superscript?: boolean;
  subscript?: boolean;
  smallCaps?: boolean;
  allCaps?: boolean;
  hidden?: boolean;
}

/**
 * Drawing/Image in document
 */
export interface Drawing {
  type: "drawing";
  drawingType: "image" | "chart" | "shape" | "textbox";
  imageName?: string;
  width?: number;
  height?: number;
  chartData?: ChartData;
  caption?: string;
  altText?: string;
  title?: string;
  position?: {
    x: number;
    y: number;
  };
  wrapping?: "inline" | "square" | "tight" | "through" | "topAndBottom";
}

/**
 * Paragraph with formatting and content
 */
export interface Paragraph {
  runs: (TextRun | Drawing)[];
  alignment?: "left" | "right" | "center" | "justify" | "distribute";
  indentation?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
  spacing?: {
    before?: number;
    after?: number;
    line?: number;
    lineRule?: "auto" | "exact" | "atLeast";
  };
  styleName?: string;
  styleId?: string;
  outlineLevel?: number;
  listInfo?: {
    listId: string;
    level: number;
    numberFormat?: string;
    bulletText?: string;
  };
  pageBreakBefore?: boolean;
  keepNext?: boolean;
  keepLines?: boolean;
  borders?: {
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
  };
  shading?: {
    color?: string;
    pattern?: string;
  };
}

/**
 * Border style
 */
export interface BorderStyle {
  style?: "single" | "double" | "thick" | "thin" | "dashed" | "dotted";
  color?: string;
  width?: number;
}

/**
 * Table cell content and formatting
 */
export interface TableCell {
  content: Paragraph[];
  colspan?: number;
  rowspan?: number;
  borders?: {
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
  };
  shading?: {
    color?: string;
    pattern?: string;
  };
  verticalAlignment?: "top" | "center" | "bottom";
  textDirection?: "lrTb" | "tbRl" | "btLr";
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Table with rows and formatting
 */
export interface Table {
  type: "table";
  rows: TableCell[][];
  style?: string;
  borders?: {
    insideHorizontal?: BorderStyle;
    insideVertical?: BorderStyle;
    top?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
    right?: BorderStyle;
  };
  alignment?: "left" | "center" | "right";
  indent?: number;
  preferredWidth?: {
    type: "auto" | "percentage" | "dxa";
    value?: number;
  };
  cellMargins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  caption?: string;
  description?: string;
}

/**
 * Header/Footer content
 */
export interface HeaderFooterContent {
  type: "default" | "first" | "even";
  content: (Paragraph | Table)[];
  linkedToPrevious?: boolean;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  description?: string;
  category?: string;
  company?: string;
  manager?: string;
  createdAt?: string;
  modifiedAt?: string;
  lastSavedBy?: string;
  revision?: number;
  totalEditingTime?: number; // in minutes
  pageCount?: number;
  wordCount?: number;
  charCount?: number;
  charCountWithSpaces?: number;
  paragraphCount?: number;
  lineCount?: number;
  language?: string;
  version?: string;
  template?: string;
  security?: {
    passwordProtected: boolean;
    readOnly: boolean;
    trackChanges: boolean;
    finalVersion: boolean;
  };
}

/**
 * Table of Contents item
 */
export interface TocItem {
  level: number;
  text: string;
  pageNumber?: number;
  hyperlink?: string;
  styleId?: string;
}

/**
 * Section properties
 */
export interface SectionProperties {
  pageSize?: {
    width: number;
    height: number;
    orientation: "portrait" | "landscape";
  };
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    header: number;
    footer: number;
    gutter: number;
  };
  headers?: HeaderFooterContent[];
  footers?: HeaderFooterContent[];
  pageNumbering?: {
    start?: number;
    format?: "decimal" | "upperRoman" | "lowerRoman" | "upperLetter" | "lowerLetter";
  };
  columns?: {
    count: number;
    space?: number;
    separator?: boolean;
  };
  titlePage?: boolean;
  differentFirstPage?: boolean;
  differentOddEven?: boolean;
}

/**
 * Style definition
 */
export interface StyleDefinition {
  id: string;
  name: string;
  type: "paragraph" | "character" | "table" | "numbering";
  basedOn?: string;
  next?: string;
  isDefault?: boolean;
  isCustom?: boolean;
  formatting?: {
    font?: {
      name?: string;
      size?: number;
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };
    paragraph?: {
      alignment?: string;
      indentation?: any;
      spacing?: any;
    };
  };
}

/**
 * Comment in document
 */
export interface Comment {
  id: string;
  author: string;
  date: string;
  text: string;
  replied?: Comment[];
  resolved?: boolean;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * Revision/Change tracking
 */
export interface Revision {
  id: string;
  type: "insert" | "delete" | "format";
  author: string;
  date: string;
  text?: string;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * Complete parsed Word document data
 */
export interface ParsedWordData {
  fileName: string;
  content: (Paragraph | Table)[];
  sections?: SectionProperties[];
  headers?: HeaderFooterContent[];
  footers?: HeaderFooterContent[];
  metadata?: DocumentMetadata;
  toc?: TocItem[];
  styles?: StyleDefinition[];
  footnotes?: Paragraph[];
  endnotes?: Paragraph[];
  comments?: Comment[];
  revisions?: Revision[];
  customProperties?: Record<string, any>;
  documentVariables?: Record<string, string>;
}

/**
 * Word document analysis result
 */
export interface WordDocumentAnalysis {
  pageCount: number;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  footnoteCount: number;
  endnoteCount: number;
  commentCount: number;
  revisionCount: number;
  hasHeaders: boolean;
  hasFooters: boolean;
  hasToc: boolean;
  hyperlinksCount: number;
  stylesUsed: string[];
  customStylesCount: number;
  headingStructure: Array<{
    level: number;
    text: string;
    count: number;
  }>;
  languagesDetected: string[];
  readabilityScore?: number;
  averageWordsPerSentence?: number;
  averageSentencesPerParagraph?: number;
  complexityScore?: "simple" | "moderate" | "complex";
  accessibilityScore?: number; // 0-100
}

/**
 * Word processing options
 */
export interface WordProcessingOptions {
  extractText?: boolean;
  extractImages?: boolean;
  extractComments?: boolean;
  extractRevisions?: boolean;
  extractMetadata?: boolean;
  includeHeaders?: boolean;
  includeFooters?: boolean;
  includeFootnotes?: boolean;
  includeEndnotes?: boolean;
  analyzeToc?: boolean;
  analyzeStyles?: boolean;
  checkAccessibility?: boolean;
  preserveFormatting?: boolean;
}

/**
 * Word document summary for grading
 */
export interface WordDocumentSummary {
  filename: string;
  type: "docx";
  rawData: ParsedWordData;
  analysis?: WordDocumentAnalysis;
  processingTime?: number;
  errors?: string[];
  warnings?: string[];
}