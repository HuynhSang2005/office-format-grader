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
  color?: string;
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
  wordArt?: WordArtEffect;
  smartArt?: SmartArtData;
}

export interface SlideDisplayInfo {
  showsFooter: boolean;
  showsDate: boolean;
  showsSlideNumber: boolean;
}

// Dữ liệu tổng thể của một đối tượng SmartArt
export interface SmartArtData {
  layout?: string; // Tên layout của SmartArt
  nodes: SmartArtNode[]; // Các node gốc của cây
}

// Mỗi node trong SmartArt có thể chứa các node con
export interface SmartArtNode {
  text: string;
  children: SmartArtNode[];
}

export interface TransitionEffect {
  type: string; // Tên hiệu ứng (ví dụ: 'fade', 'push')
  duration?: number; // Thời gian (ms)
  sound?: { 
    name: string; // Ví dụ: 'applause', 'click'
  };
}

// một hiệu ứng animation cụ thể
export interface AnimationEffect {
  shapeId: string;       // ID của shape được áp dụng hiệu ứng
  effectType?: string;    // Loại hiệu ứng, ví dụ: 'flyIn', 'wipe'
  direction?: string;     // Hướng của hiệu ứng, ví dụ: 'fromBottom'
  wordArt?: WordArtEffect; // Hiệu ứng đặc biệt cho WordArt
  smartArt?: SmartArtData; // Dữ liệu SmartArt nếu có
}

// một node trong cây animation
export interface AnimationNode {
  type: 'parallel' | 'sequence' | 'effect';
  trigger: string;       // 'onClick', 'withPrev', 'afterPrev'
  duration?: number;
  delay?: number;
  effect?: AnimationEffect; // Chỉ chứa thông tin về hiệu ứng
  children?: AnimationNode[];
}


// một slide đã được phân tích định dạng
export interface FormattedSlide {
  slideNumber: number;
  layout: string;
  displayInfo: SlideDisplayInfo;
  transition?: TransitionEffect;
  shapes: Shape[];
  animations?: AnimationNode;
  notes?: string;
}

// Cấu trúc data cuối cùng cho file PowerPoint
export interface ParsedPowerPointFormatData {
  slideCount: number;
  mediaFiles: string[];
  theme?: ThemeData;
  slides: FormattedSlide[];
  fileName: string; 
}

// Cấu trúc theme cho PowerPoint
export interface ColorScheme {
  [name: string]: string; // Ví dụ: { accent1: 'FFFFFF', dk1: '000000' }
}

// Cấu trúc font scheme cho PowerPoint
export interface FontScheme {
  majorFont: string;
  minorFont: string;
}

// Cấu trúc theme cho PowerPoint
export interface ThemeData {
  name: string;
  colorScheme: ColorScheme;
  fontScheme: FontScheme;
}
// define các hiệu ứng WordArt có thể có
export interface WordArtEffect {
  fill?: { type: string; colors?: string[] }; // ví dụ: { type: 'gradient', colors: ['#FF0000', '#0000FF'] }
  shadow?: { type: string; color?: string; blur?: number; direction?: number };
  // Có thể thêm các hiệu ứng khác như 3D, glow, reflection...
}