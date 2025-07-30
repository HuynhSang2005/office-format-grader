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
  styleName?: string; // Để lưu tên style, ví dụ: "Heading1"
  listInfo?: {
    listId: string; // ID của danh sách
    level: number;  // Cấp độ của mục trong danh sách
  };
}

// Cấu trúc data cho file Word
export interface ParsedWordData {
  content: Paragraph[];
}