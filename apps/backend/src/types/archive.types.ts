/**
 * @file unzip.ts
 * @description Định nghĩa các loại và interface cho chức năng unzip
 * @author Nguyễn Huỳnh Sang
 */

// Interface cho kết quả unzip
export interface UnzipResult {
  success: boolean;
  error?: string;
  extractedPath?: string;
  fileList?: string[];
}

// Interface cho tùy chọn giải nén an toàn
export interface ExtractionOptions {
  maxFiles?: number;        // Giới hạn số file
  maxTotalSize?: number;    // Giới hạn tổng kích thước
  allowedExtensions?: string[]; // Extensions được phép
  maxDepth?: number;        // Độ sâu thư mục tối đa
}

// Interface cho OpenXML relationship (dùng chung cho cả DOCX và PPTX)
export interface OpenXMLRelationship {
  id: string;
  type: string;
  target: string;
}

// Interface cho cấu trúc file DOCX sau khi giải nén
export interface DOCXFileStructure {
  mainDocument: string;         // word/document.xml
  styles: string;              // word/styles.xml
  numbering?: string;          // word/numbering.xml
  settings?: string;           // word/settings.xml
  headerFooters: Record<string, string>; // word/header*.xml, word/footer*.xml
  relationships: OpenXMLRelationship[]; // Relationships từ .rels files
}

// Interface cho cấu trúc file PPTX sau khi giải nén
export interface PPTXFileStructure {
  presentation: string;              // ppt/presentation.xml
  slides: Record<string, string>;    // ppt/slides/slide*.xml
  slideLayouts: Record<string, string>; // ppt/slideLayouts/slideLayout*.xml
  slideMasters: Record<string, string>; // ppt/slideMasters/slideMaster*.xml
  theme: string;                     // ppt/theme/theme1.xml
  relationships: OpenXMLRelationship[]; // Relationships từ .rels files
  headerFooters?: Record<string, string>; // Headers/footers if any
}