/**
 * @file features.docx.ts
 * @description Định nghĩa các tính năng có thể trích xuất từ file Word
 * @author Nguyễn Huỳnh Sang
 */

// Thông tin Table of Contents
export interface TocInfo {
  exists: boolean;
  isAutomatic: boolean;
  entryCount: number;
  maxLevel: number;
  hasPageNumbers: boolean;
  isUpdated: boolean; // TOC có được cập nhật gần đây không
}

// Header và Footer
export interface DOCXHeaderFooterInfo {
  hasHeader: boolean;
  hasFooter: boolean;
  headerContent?: string;
  footerContent?: string;
  hasPageNumbers: boolean;
  pageNumberFormat?: string;
  isConsistent: boolean; // Nhất quán trên tất cả trang
}

// Columns layout
export interface ColumnsInfo {
  hasColumns: boolean;
  columnCount: number;
  isBalanced: boolean;
  spacing?: number;
  hasColumnBreaks: boolean;
}

// Drop Cap
export interface DropCapInfo {
  exists: boolean;
  type?: 'dropped' | 'in-margin';
  linesCount?: number;
  characterCount?: number;
}

// Pictures/Images
export interface PictureInfo {
  count: number;
  formats: string[]; // jpg, png, gif, etc.
  hasWrapping: boolean;
  hasCaptions: boolean;
  averageSize?: number;
}

// WordArt
export interface WordArtInfo {
  count: number;
  styles: string[];
  hasEffects: boolean;
}

// Tables
export interface TableInfo {
  count: number;
  totalRows: number;
  totalColumns: number;
  hasFormatting: boolean;
  hasBorders: boolean;
  hasShading: boolean;
  hasHeaderRow: boolean;
}

// Equations
export interface EquationInfo {
  count: number;
  isUsingEquationEditor: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  hasInlineEquations: boolean;
  hasDisplayEquations: boolean;
}

// Tab stops
export interface TabStopsInfo {
  hasCustomTabs: boolean;
  tabCount: number;
  types: ('left' | 'center' | 'right' | 'decimal' | 'bar')[];
  isConsistent: boolean;
  hasLeaders: boolean;
}

// SmartArt
export interface SmartArtInfo {
  count: number;
  types: string[]; // process, hierarchy, cycle, etc.
  hasCustomContent: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Hyperlinks
interface HyperlinkInfo {
  count: number;
  hasExternalLinks: boolean;
  hasInternalLinks: boolean;
  externalDomains: string[];
  isWorking: boolean; // Có hoạt động không
  hasEmailLinks: boolean;
}

// Export with a more specific name for the index file
export type DOCXHyperlinkInfo = HyperlinkInfo;

// Document structure
export interface DocumentStructure {
  pageCount: number;
  wordCount: number;
  paragraphCount: number;
  hasHeadingStyles: boolean;
  headingLevels: number[];
  sectionCount: number;
}

// Styles và formatting
export interface StylesInfo {
  builtInStyles: string[];
  customStyles: string[];
  hasConsistentFormatting: boolean;
  fontCount: number;
  primaryFonts: string[];
}

// Tổng hợp tất cả features của DOCX
export interface FeaturesDOCX {
  // File info
  filename: string;
  fileSize: number;
  
  // Document structure
  structure: DocumentStructure;
  
  // TOC
  toc: TocInfo;
  
  // Header/Footer
  headerFooter: DOCXHeaderFooterInfo;
  
  // Layout elements
  columns: ColumnsInfo;
  dropCap: DropCapInfo;
  
  // Media elements
  pictures: PictureInfo;
  wordArt: WordArtInfo;
  
  // Data elements
  tables: TableInfo;
  equations: EquationInfo;
  
  // Formatting elements
  tabStops: TabStopsInfo;
  smartArt: SmartArtInfo;
  hyperlinks: HyperlinkInfo;
  styles: StylesInfo;
  
  // Export info
  hasPdfExport?: boolean;
  pdfPageCount?: number;
}