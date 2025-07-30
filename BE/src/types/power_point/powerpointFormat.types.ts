import type { ChartData } from "./chart.types";

// thông tin vị trí và kích thước
export interface ShapeTransform {
  x: number;
  y: number;
  width: number;
  height: number;
}

// một đoạn text và định dạng của nó
export interface FormattedTextRun {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  font?: string;   
  size?: number;
  hyperlink?: string;
}

export interface TableData {
  rows: string[][];
}

// một hình khối (shape)
export interface Shape {
  id: string;
  name: string;
  transform: ShapeTransform;
  textRuns: FormattedTextRun[];
  tableData?: TableData;
  chartData?: ChartData;
}

export interface SlideDisplayInfo {
  showsFooter: boolean;
  showsDate: boolean;
  showsSlideNumber: boolean;
}

export interface TransitionEffect {
  type: string; // Tên hiệu ứng (ví dụ: 'fade', 'push')
  duration?: number; // Thời gian (ms)
}

// một hiệu ứng animation cụ thể
export interface AnimationEffect {
  shapeId: string; // ID của shape được áp dụng hiệu ứng
  type: string;    // Loại hiệu ứng, ví dụ: 'flyIn', 'fadeIn'
}

// một node trong cây animation
export interface AnimationNode {
  type: 'parallel' | 'sequence' | 'effect'; // Loại node
  trigger: string; // 'onClick', 'withPrev', 'afterPrev'
  duration?: number;
  delay?: number;
  effect?: AnimationEffect;
  children?: AnimationNode[]; // Các node con
}


// một slide đã được phân tích định dạng
export interface FormattedSlide {
  slideNumber: number;
  layout: string;
  displayInfo: SlideDisplayInfo;
  transition?: TransitionEffect;
  shapes: Shape[];
  animations?: AnimationNode[];
}

// Cấu trúc data cuối cùng cho file PowerPoint
export interface ParsedPowerPointFormatData {
  slideCount: number;
  mediaFiles: string[];
  slides: FormattedSlide[];
}

