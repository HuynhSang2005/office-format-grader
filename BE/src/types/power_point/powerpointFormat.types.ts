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
}

export interface SlideDisplayInfo {
  showsFooter: boolean;
  showsDate: boolean;
  showsSlideNumber: boolean;
}

// một slide đã được phân tích định dạng
export interface FormattedSlide {
  slideNumber: number;
  layout: string;
  displayInfo: SlideDisplayInfo;
  shapes: Shape[];
}

// Cấu trúc data cuối cùng cho file PowerPoint
export interface ParsedPowerPointFormatData {
  slideCount: number;
  mediaFiles: string[];
  slides: FormattedSlide[];
}