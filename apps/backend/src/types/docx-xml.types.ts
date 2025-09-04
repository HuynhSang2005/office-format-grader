/**
 * @file docx-xml.types.ts
 * @description Định nghĩa các kiểu dữ liệu cho xử lý XML trong DOCX
 * @author Nguyễn Huỳnh Sang
 */

// Interface cho XML node với fast-xml-parser structure
export interface XMLNode {
  [key: string]: any; // Allow dynamic properties for parsed XML
}

// Interface cho OpenXML relationship
export interface OpenXMLRelationship {
  id: string;
  type: string;
  target: string;
}