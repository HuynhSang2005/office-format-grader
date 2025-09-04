/**
 * @file pptx-xml.types.ts
 * @description Định nghĩa các kiểu dữ liệu cho xử lý XML trong PPTX
 * @author Nguyễn Huỳnh Sang
 */

// Interface cho XML node với fast-xml-parser structure
export interface PPTXXMLNode {
  [key: string]: any; // Allow dynamic properties for parsed XML
}

// Interface cho PPTX relationship
export interface PPTXRelationship {
  id: string;
  type: string;
  target: string;
}

// Alias for backward compatibility
export type SlideRelationship = PPTXRelationship;

// Interface for theme definition
export interface ThemeDefinition {
  name: string;
  colorScheme: Record<string, string>;
  fontScheme: {
    majorFont: string;
    minorFont: string;
  };
}