/**
 * Excel document types and interfaces
 * For future Excel document support and current Excel export functionality
 */

/**
 * Excel cell value types
 */
export type CellValue = string | number | Date | boolean | null;

/**
 * Excel cell formatting
 */
export interface CellFormat {
  font?: {
    name?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  };
  fill?: {
    type?: "solid" | "gradient" | "pattern";
    color?: string;
    backgroundColor?: string;
  };
  border?: {
    top?: { style?: string; color?: string; };
    bottom?: { style?: string; color?: string; };
    left?: { style?: string; color?: string; };
    right?: { style?: string; color?: string; };
  };
  alignment?: {
    horizontal?: "left" | "center" | "right" | "justify";
    vertical?: "top" | "middle" | "bottom";
    wrapText?: boolean;
    shrinkToFit?: boolean;
    textRotation?: number;
  };
  numberFormat?: string;
}

/**
 * Excel cell with value and formatting
 */
export interface ExcelCell {
  value: CellValue;
  format?: CellFormat;
  formula?: string;
  comment?: string;
  hyperlink?: string;
  dataValidation?: {
    type: "list" | "whole" | "decimal" | "date" | "time" | "textLength" | "custom";
    values?: string[];
    formula?: string;
    showErrorMessage?: boolean;
    errorTitle?: string;
    error?: string;
  };
}

/**
 * Excel row with cells
 */
export interface ExcelRow {
  cells: ExcelCell[];
  height?: number;
  hidden?: boolean;
  outlineLevel?: number;
}

/**
 * Excel column properties
 */
export interface ExcelColumn {
  width?: number;
  hidden?: boolean;
  outlineLevel?: number;
  format?: CellFormat;
}

/**
 * Excel chart data
 */
export interface ExcelChart {
  type: "column" | "bar" | "line" | "pie" | "area" | "scatter" | "bubble" | "doughnut";
  title?: string;
  dataRange: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  series?: Array<{
    name: string;
    values: string;
    color?: string;
  }>;
  legend?: {
    position: "top" | "bottom" | "left" | "right" | "none";
  };
  axes?: {
    x?: { title?: string; min?: number; max?: number; };
    y?: { title?: string; min?: number; max?: number; };
  };
}

/**
 * Excel worksheet
 */
export interface ExcelWorksheet {
  name: string;
  rows: ExcelRow[];
  columns?: ExcelColumn[];
  charts?: ExcelChart[];
  images?: Array<{
    name: string;
    data: Buffer;
    position: { x: number; y: number; width: number; height: number; };
  }>;
  pageSetup?: {
    orientation?: "portrait" | "landscape";
    paperSize?: string;
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      header: number;
      footer: number;
    };
    printArea?: string;
    printTitles?: {
      rows?: string;
      columns?: string;
    };
  };
  protection?: {
    password?: string;
    selectLockedCells?: boolean;
    selectUnlockedCells?: boolean;
    formatCells?: boolean;
    formatColumns?: boolean;
    formatRows?: boolean;
    insertColumns?: boolean;
    insertRows?: boolean;
    insertHyperlinks?: boolean;
    deleteColumns?: boolean;
    deleteRows?: boolean;
    sort?: boolean;
    autoFilter?: boolean;
    pivotTables?: boolean;
  };
  autoFilter?: {
    range: string;
  };
  freezePanes?: {
    row?: number;
    column?: number;
  };
  zoom?: number;
  hidden?: boolean;
  tabColor?: string;
}

/**
 * Excel workbook
 */
export interface ExcelWorkbook {
  worksheets: ExcelWorksheet[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    description?: string;
    category?: string;
    company?: string;
    manager?: string;
    created?: Date;
    modified?: Date;
    lastSavedBy?: string;
    revision?: number;
    version?: string;
  };
  customProperties?: Record<string, any>;
  security?: {
    passwordProtected?: boolean;
    readOnly?: boolean;
    lockStructure?: boolean;
    lockWindows?: boolean;
  };
  calculationProperties?: {
    calcMode?: "auto" | "manual" | "autoNoTable";
    calcOnSave?: boolean;
    fullCalcOnLoad?: boolean;
    iterateCalc?: boolean;
    iterateCount?: number;
    iterateDelta?: number;
  };
}

/**
 * Excel export options
 */
export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeader?: boolean;
  autoFitColumns?: boolean;
  freezeFirstRow?: boolean;
  applyStyles?: boolean;
  password?: string;
  compression?: "none" | "fast" | "maximum";
}

/**
 * Excel report generation options
 */
export interface ExcelReportOptions {
  title?: string;
  author?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeDetails?: boolean;
  groupBy?: string;
  sortBy?: string;
  filterCriteria?: Record<string, any>;
  template?: string;
  styling?: {
    headerBackground?: string;
    headerFont?: string;
    dataFont?: string;
    alternateRowColor?: string;
    borderStyle?: string;
  };
}

/**
 * Excel data analysis result
 */
export interface ExcelAnalysis {
  worksheetCount: number;
  totalRows: number;
  totalColumns: number;
  cellsWithData: number;
  formulaCount: number;
  chartCount: number;
  imageCount: number;
  hyperlinksCount: number;
  namedRanges: string[];
  dataTypes: Record<string, number>;
  hasPassword: boolean;
  hasVBA: boolean;
  hasExternalReferences: boolean;
  fileSize: number;
  complexity: "simple" | "moderate" | "complex";
}

/**
 * Excel processing options
 */
export interface ExcelProcessingOptions {
  readAllSheets?: boolean;
  includeFormulas?: boolean;
  includeComments?: boolean;
  includeImages?: boolean;
  includeCharts?: boolean;
  preserveFormatting?: boolean;
  calculateFormulas?: boolean;
  password?: string;
  maxRows?: number;
  maxColumns?: number;
}