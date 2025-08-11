/**
 * Types for PowerPoint styles and layouts
 */

// Define một style văn bản cơ bản
export interface TextStyle {
  font?: string;
  size?: number; // Đơn vị: point
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

// Define style cho một loại placeholder (ví dụ: title, body)
export interface PlaceholderStyle {
  type: 'title' | 'body' | 'ctrTitle' | 'subTitle' | 'dt' | 'ftr' | 'sldNum' | 'other';
  defaultStyle: TextStyle;
  // Body placeholder có thể có style cho 9 cấp độ danh sách
  levelStyles?: (TextStyle | undefined)[]; 
}

// Dữ liệu trích xuất từ một file Slide Master hoặc Layout
export interface SlideLayoutData {
  styles: PlaceholderStyle[];
}