/**
 * @file features.pptx.ts
 * @description Định nghĩa các tính năng có thể trích xuất từ file PowerPoint
 * @author Nguyễn Huỳnh Sang
 */

// Thông tin slide cơ bản
export interface SlideInfo {
  index: number;
  title?: string;
  noteText?: string;
  layoutName?: string;
}

// Thông tin theme và master slide
export interface ThemeInfo {
  name?: string;
  isCustom: boolean;
  colorScheme?: string[];
  fontScheme?: {
    majorFont?: string;
    minorFont?: string;
  };
}

// Thông tin slide master
export interface SlideMasterInfo {
  isModified: boolean;
  customLayouts: number;
  hasCustomPlaceholders: boolean;
  backgroundType?: 'solid' | 'gradient' | 'image' | 'pattern';
  detail?: {
    titleSlideFont?: string;
    titleSlideFontSize?: number;
    titleSlideSubTitleFont?: string;
    titleSlideSubTitleFontSize?: number;
    titleAndContentFont?: string;
    titleAndContentFontSize?: number;
    titleAndContentBodyFont?: string;
    titleAndContentBodyFontSize?: number;
  };
}

// Header và footer
export interface PPTXHeaderFooterInfo {
  hasSlideNumber: boolean;
  hasDate: boolean;
  hasFooter: boolean;
  footerText?: string;
  dateFormat?: string;
}

// Hyperlink
interface HyperlinkInfo {
  url: string;
  displayText: string;
  slideIndex: number;
  isInternal: boolean; // Link trong presentation hay external
}

// Export with a more specific name for the index file
export type PPTXHyperlinkInfo = HyperlinkInfo;

// Transition effects
export interface TransitionInfo {
  slideIndex: number;
  type?: string;
  duration?: number;
  hasSound: boolean;
  soundFile?: string;
}

// Animation effects  
export interface AnimationInfo {
  slideIndex: number;
  objectId: string;
  animationType: 'entrance' | 'emphasis' | 'exit' | 'motion';
  effect?: string;
  duration?: number;
  delay?: number;
}

// Các đối tượng trong slide
export interface SlideObject {
  type: 'text' | 'image' | 'shape' | 'chart' | 'table' | 'smartart' | '3dmodel' | 'icon' | 'video' | 'audio';
  slideIndex: number;
  objectId: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string; // Text content nếu có
}

// Outline structure để tạo slide
export interface OutlineStructure {
  hasOutlineSlides: boolean;
  levels: OutlineLevel[];
}

export interface OutlineLevel {
  level: number; // 1, 2, 3...
  text: string;
  slideIndex?: number;
}

// Tổng hợp tất cả features của PPTX
export interface FeaturesPPTX {
  // File info
  filename: string;
  slideCount: number;
  fileSize: number;
  
  // Slides
  slides: SlideInfo[];
  
  // Theme và design
  theme: ThemeInfo;
  slideMaster: SlideMasterInfo;
  
  // Header/Footer
  headerFooter: PPTXHeaderFooterInfo;
  
  // Interactive elements
  hyperlinks: PPTXHyperlinkInfo[];
  
  // Effects
  transitions: TransitionInfo[];
  animations: AnimationInfo[];
  
  // Content objects
  objects: SlideObject[];
  
  // Structure
  outline: OutlineStructure;
  
  // Export info
  hasPdfExport?: boolean;
  pdfPageCount?: number;
}