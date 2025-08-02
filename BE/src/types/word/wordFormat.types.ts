import type { ChartData } from "../power_point/chart.types";

export interface WordFormatData {
  html: string;
  messages: any[]; // Để chứa warning cảnh báo hoặc error từ mammoth
}

// define "run" - một chuỗi văn bản có cùng định dạng
export interface TextRun {
  type: "text";
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  underline?: string;
  font?: string;
  size?: number; // Đơn vị: point
  color?: string;
  hyperlink?: string;
}

// define một "paragraph" - chứa một hoặc nhiều "run"
export interface Paragraph {
  runs: (TextRun | Drawing )[];
  alignment?: "left" | "right" | "center" | "justify" | string;
  indentation?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
  styleName?: string; // Để lưu tên style, ví dụ: "Heading1"
  listInfo?: {
    listId: string; // ID của danh sách
    level: number; // Cấp độ của mục trong danh sách
  };
}

// Mỗi ô trong bảng có thể chứa nhiều đoạn văn
export interface TableCell {
  content: Paragraph[];
}

// Bảng là một mảng 2 chiều chứa các ô
export interface Table {
  type: "table"; // Thêm một thuộc tính để dễ phân biệt
  rows: TableCell[][];
}

// content có thể chứa nhiều loại block
export interface ParsedWordData {
  content: (Paragraph | Table)[];
  headers?: HeaderFooterContent[]; 
  footers?: HeaderFooterContent[];
}

// Định nghĩa một "drawing" - chứa hình ảnh trong docx
export interface Drawing {
  type: 'drawing';
  drawingType: 'image' | 'chart';
  imageName?: string;
  width?: number;
  height?: number;
  chartData?: ChartData;
}

// Định nghĩa các thông tin về header và footer
export interface HeaderFooterContent {
    type: 'default' | 'first' | 'even';
    content: (Paragraph | Table)[];
}