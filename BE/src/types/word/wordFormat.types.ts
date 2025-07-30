export interface WordFormatData {
  html: string;
  messages: any[]; // Để chứa warning cảnh báo hoặc error từ mammoth
}

// define "run" - một chuỗi văn bản có cùng định dạng
export interface TextRun {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  underline?: string;
  font?: string;
  size?: number; // Đơn vị: point
  color?: string;
}

// define một "paragraph" - chứa một hoặc nhiều "run"
export interface Paragraph {
  runs: TextRun[];
  alignment?: 'left' | 'right' | 'center' | 'justify' | string;
  indentation?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
}

// Cấu trúc data cho file Word
export interface ParsedWordData {
  content: Paragraph[];
}