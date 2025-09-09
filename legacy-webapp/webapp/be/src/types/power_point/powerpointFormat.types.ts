/**
 * Core types for PowerPoint format parsing
 */

import type { ChartData } from './chart.types';

// ===== Basic Structures =====

/**
 * Thông tin vị trí và kích thước
 */
export interface ShapeTransform {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Thông tin hiển thị của slide
 */
export interface SlideDisplayInfo {
  showsFooter: boolean;
  showsDate: boolean;
  showsSlideNumber: boolean;
}

// ===== Text & Formatting =====

/**
 * Một đoạn text và định dạng của nó
 */
export interface FormattedTextRun {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  font?: string;   
  size?: number;
  color?: string;
  hyperlink?: string; // Chỉ hỗ trợ string trong base type
}

/**
 * Dữ liệu bảng trong slide
 */
export interface TableData {
  rows: string[][];
}

// ===== Visual Effects =====

/**
 * Define các hiệu ứng WordArt có thể có
 */
export interface WordArtEffect {
  fill?: { 
    type: string; 
    colors?: string[]; 
  };
  shadow?: { 
    type: string; 
    color?: string; 
    blur?: number; 
    direction?: number 
  };
  // Có thể thêm các hiệu ứng khác như 3D, glow, reflection...
}

/**
 * Hiệu ứng chuyển cảnh giữa các slide
 */
export interface TransitionEffect {
  type: string; // Tên hiệu ứng (ví dụ: 'fade', 'push')
  duration?: number; // Thời gian (ms)
  sound?: { 
    name: string; // Ví dụ: 'applause', 'click'
  };
}

// ===== SmartArt Structures =====

/**
 * Node trong SmartArt có thể chứa các node con
 */
export interface SmartArtNode {
  text: string;
  children: SmartArtNode[];
}

/**
 * Dữ liệu tổng thể của một đối tượng SmartArt
 */
export interface SmartArtData {
  layout?: string; // Tên layout của SmartArt
  nodes: SmartArtNode[]; // Các node gốc của cây
}

// ===== Animation Structures =====

/**
 * Một hiệu ứng animation cụ thể
 */
export interface AnimationEffect {
  shapeId: string;      // ID của shape được áp dụng hiệu ứng
  effectType?: string;  // Loại hiệu ứng, ví dụ: 'flyIn', 'wipe'
  direction?: string;   // Hướng của hiệu ứng, ví dụ: 'fromBottom'
  wordArt?: WordArtEffect; // Hiệu ứng đặc biệt cho WordArt
  smartArt?: SmartArtData; // Dữ liệu SmartArt nếu có
}

/**
 * Một node trong cây animation
 */
export interface AnimationNode {
  type: 'parallel' | 'sequence' | 'effect';
  trigger: string;       // 'onClick', 'withPrev', 'afterPrev'
  duration?: number;
  delay?: number;
  effect?: AnimationEffect; // Chỉ chứa thông tin về hiệu ứng
  children?: AnimationNode[];
}

// ===== Theme Structures =====

/**
 * Thông tin cơ bản về PowerPoint theme
 */
export interface PowerPointTheme {
  name: string;
}

/**
 * Scheme màu sắc trong theme
 */
export interface ColorScheme {
  [name: string]: string; // Ví dụ: { accent1: 'FFFFFF', dk1: '000000' }
}

/**
 * Scheme font trong theme
 */
export interface FontScheme {
  majorFont: string;
  minorFont: string;
}

/**
 * Dữ liệu đầy đủ của theme
 */
export interface ThemeData {
  name: string;
  colorScheme: ColorScheme;
  fontScheme: FontScheme;
}

// ===== Media Files =====

/**
 * Thông tin file media trong PowerPoint
 */
export interface PowerPointMediaFiles {
  name: string;
}

// ===== Core Shapes & Slides =====

/**
 * Một hình khối (shape) trong slide
 */
export interface Shape {
  id: string;
  name: string;
  transform: ShapeTransform;
  textRuns: FormattedTextRun[];
  tableData?: TableData;
  chartData?: ChartData;
  wordArt?: WordArtEffect;
  smartArt?: SmartArtData;
}

/**
 * Một slide đã được phân tích định dạng
 */
export interface FormattedSlide {
  slideNumber: number;
  layout?: string;
  notes?: string;
  transition?: {
    type?: string;
    sound?: { name?: string };
  };
  shapes?: Shape[];
  displayInfo?: SlideDisplayInfo;
}

/**
 * Cấu trúc data cuối cùng cho file PowerPoint
 */
export interface ParsedPowerPointFormatData {
  fileName: string;
  slideCount: number;
  slides?: FormattedSlide[];
  theme?: PowerPointTheme;
}

