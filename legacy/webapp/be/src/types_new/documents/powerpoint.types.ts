/**
 * PowerPoint document types and interfaces
 * Consolidated from existing PowerPoint types with better organization
 */

/**
 * Document properties common to all Office documents
 */
export interface DocumentProperties {
  title?: string;
  creator?: string;
  lastModifiedBy?: string;
  revision?: number;
  created?: string;
  modified?: string;
  company?: string;
  category?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
  language?: string;
}

/**
 * Shape transformation properties
 */
export interface ShapeTransform {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

/**
 * Color scheme for themes
 */
export interface ColorScheme {
  dk1?: string; // Dark 1
  lt1?: string; // Light 1
  dk2?: string; // Dark 2
  lt2?: string; // Light 2
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;
  accent6?: string;
  hlink?: string; // Hyperlink
  folHlink?: string; // Followed hyperlink
}

/**
 * Font scheme for themes
 */
export interface FontScheme {
  majorFont?: string;
  minorFont?: string;
  majorComplexFont?: string;
  minorComplexFont?: string;
}

/**
 * Theme data
 */
export interface ThemeData {
  name?: string;
  colorScheme?: ColorScheme;
  fontScheme?: FontScheme;
  formatScheme?: any;
}

/**
 * Hyperlink information
 */
export interface HyperlinkData {
  id?: string;
  target?: string;
  action?: string;
  tooltip?: string;
  type?: "external" | "internal" | "email" | "slide";
}

/**
 * Shape fill properties
 */
export interface ShapeFill {
  type?: "solid" | "gradient" | "pattern" | "picture" | "none";
  color?: string;
  transparency?: number;
  gradientStops?: Array<{
    position: number;
    color: string;
  }>;
}

/**
 * Shape outline properties
 */
export interface ShapeOutline {
  color?: string;
  width?: number;
  style?: "solid" | "dashed" | "dotted" | "double";
  transparency?: number;
}

/**
 * Animation effect
 */
export interface AnimationEffect {
  type?: string;
  preset?: string;
  duration?: number;
  delay?: number;
  trigger?: "click" | "withPrevious" | "afterPrevious";
  direction?: string;
  intensity?: "weak" | "medium" | "strong";
}

/**
 * Animation node containing multiple effects
 */
export interface AnimationNode {
  effects?: AnimationEffect[];
  timing?: {
    duration?: number;
    delay?: number;
    repeatCount?: number;
    autoReverse?: boolean;
  };
}

/**
 * Transition effect between slides
 */
export interface TransitionEffect {
  type?: string;
  duration?: number;
  sound?: string;
  soundLoop?: boolean;
  advanceOnClick?: boolean;
  advanceAfterTime?: number;
}

/**
 * Formatted text run with styling
 */
export interface FormattedTextRun {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  hyperlink?: HyperlinkData;
  superscript?: boolean;
  subscript?: boolean;
}

/**
 * Enhanced shape with all properties
 */
export interface Shape {
  id?: string;
  name?: string;
  type?: "rectangle" | "ellipse" | "line" | "freeform" | "textbox" | "picture" | "chart" | "table" | "smartart";
  transform?: ShapeTransform;
  fill?: ShapeFill;
  outline?: ShapeOutline;
  textRuns?: FormattedTextRun[];
  hyperlinks?: HyperlinkData[];
  animations?: AnimationEffect[];
  zOrder?: number;
  visible?: boolean;
  locked?: boolean;
}

/**
 * Table data structure
 */
export interface TableData {
  rows: number;
  columns: number;
  data: string[][];
  cellStyles?: Array<Array<{
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    alignment?: "left" | "center" | "right";
  }>>;
  borders?: {
    style?: "none" | "thin" | "thick" | "double";
    color?: string;
  };
}

/**
 * Chart data (basic structure)
 */
export interface ChartData {
  type?: "column" | "bar" | "line" | "pie" | "area" | "scatter";
  title?: string;
  data?: any[];
  categories?: string[];
  series?: Array<{
    name: string;
    values: number[];
  }>;
}

/**
 * SmartArt node
 */
export interface SmartArtNode {
  id?: string;
  text?: string;
  level?: number;
  children?: SmartArtNode[];
  style?: {
    color?: string;
    shape?: string;
  };
}

/**
 * SmartArt data
 */
export interface SmartArtData {
  type?: string;
  layout?: string;
  nodes?: SmartArtNode[];
  colorScheme?: string;
  style?: string;
}

/**
 * Slide display information
 */
export interface SlideDisplayInfo {
  slideNumber: number;
  hidden?: boolean;
  notes?: string;
  timing?: {
    advanceAfter?: number;
    transitionDuration?: number;
  };
}

/**
 * Complete slide information
 */
export interface FormattedSlide {
  slideNumber: number;
  title?: string;
  content?: string[];
  shapes?: Shape[];
  animations?: AnimationNode;
  transitions?: TransitionEffect;
  headerFooter?: {
    header?: string;
    footer?: string;
    slideNumber?: boolean;
    dateTime?: string;
  };
  layout?: string;
  layoutId?: string;
  background?: {
    type?: "solid" | "gradient" | "picture";
    color?: string;
    image?: string;
  };
  tables?: TableData[];
  charts?: ChartData[];
  smartArt?: SmartArtData[];
  notes?: string;
  hidden?: boolean;
  timing?: {
    advanceOnClick?: boolean;
    advanceAfterTime?: number;
  };
}

/**
 * Complete parsed PowerPoint data
 */
export interface ParsedPowerPointFormatData {
  fileName: string;
  slideCount: number;
  slides?: FormattedSlide[];
  theme?: ThemeData;
  documentProperties?: DocumentProperties;
  mediaFiles?: string[];
  slideLayouts?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  slideMasters?: Array<{
    id: string;
    name: string;
    layouts: string[];
  }>;
  notes?: string[];
  customProperties?: Record<string, any>;
  revision?: number;
  totalEditingTime?: number;
}

/**
 * PowerPoint analysis result
 */
export interface PowerPointAnalysis {
  slideCount: number;
  hasTheme: boolean;
  hasAnimations: boolean;
  hasTransitions: boolean;
  hasHeaderFooter: boolean;
  hasHyperlinks: boolean;
  mediaCount: number;
  tableCount: number;
  chartCount: number;
  smartArtCount: number;
  customLayouts: number;
  uniqueFonts: string[];
  colorPalette: string[];
  estimatedDuration?: number; // in minutes
  accessibilityScore?: number; // 0-100
  designComplexity?: "simple" | "moderate" | "complex";
}

/**
 * PowerPoint processing options
 */
export interface PowerPointProcessingOptions {
  extractText?: boolean;
  extractImages?: boolean;
  extractAnimations?: boolean;
  extractNotes?: boolean;
  analyzeDesign?: boolean;
  checkAccessibility?: boolean;
  includeMetadata?: boolean;
}

/**
 * Media file information
 */
export interface MediaFileInfo {
  id: string;
  name: string;
  type: "image" | "audio" | "video";
  size: number;
  format: string;
  embedded: boolean;
  usage: Array<{
    slideNumber: number;
    shapeId?: string;
  }>;
}

/**
 * Slide master information
 */
export interface SlideMasterInfo {
  id: string;
  name: string;
  backgrounds: string[];
  placeholders: Array<{
    type: string;
    position: ShapeTransform;
  }>;
  usageCount: number;
}

/**
 * Presentation metadata
 */
export interface PresentationMetadata {
  totalSlides: number;
  createdDate?: Date;
  lastModified?: Date;
  author?: string;
  company?: string;
  totalEditingTime?: number; // in minutes
  presentationFormat?: string;
  templateUsed?: string;
  security?: {
    passwordProtected: boolean;
    readOnly: boolean;
    finalVersion: boolean;
  };
}