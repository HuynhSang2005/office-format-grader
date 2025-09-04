/**
 * @file openxml.util.ts
 * @description Helper functions để đọc và parse XML từ file OpenXML (DOCX) với fast-xml-parser
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { XMLParser, XMLValidator, X2jOptions } from 'fast-xml-parser';
import type { XMLNode, OpenXMLRelationship } from '@/types/docx-xml.types';

// XML Parser configuration for Office documents
const parserOptions: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  alwaysCreateTextNode: false,
  removeNSPrefix: false, // Keep namespace prefixes for Office XML
  parseTagValue: false,
  cdataPropName: '__cdata',
  processEntities: true,
  htmlEntities: false,
  allowBooleanAttributes: false,
  unpairedTags: [],
  preserveOrder: false,
  commentPropName: false,
  stopNodes: [],
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Office XML elements that should always be arrays
    const arrayElements = [
      'w:p', 'w:r', 'w:t', 'w:tr', 'w:tc', 'w:tbl', 'w:sectPr', 
      'w:pPr', 'w:rPr', 'w:hyperlink', 'w:fldSimple', 'w:instrText',
      'w:drawing', 'w:pic', 'Relationship'
    ];
    return arrayElements.includes(name);
  }
};

const parser = new XMLParser(parserOptions);

// Parse XML string thành XMLNode tree
export function parseXML(xmlString: string): XMLNode | null {
  try {
    logger.debug('Đang parse XML content với fast-xml-parser');
    
    // Validate XML first
    const validation = XMLValidator.validate(xmlString);
    if (validation !== true) {
      logger.error('XML không hợp lệ:', validation);
      return null;
    }
    
    // Parse XML
    const parsed = parser.parse(xmlString);
    
    logger.debug('Parse XML thành công');
    return parsed as XMLNode;
    
  } catch (error) {
    logger.error('Lỗi khi parse XML:', error);
    return null;
  }
}

// Tìm elements theo tag name (với namespace support)
export function findElementsByTagName(node: XMLNode, tagName: string): XMLNode[] {
  const results: XMLNode[] = [];
  
  function traverse(obj: any, currentPath: string = '') {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === tagName || key.endsWith(':' + tagName)) {
          const value = obj[key];
          if (Array.isArray(value)) {
            results.push(...value);
          } else {
            results.push(value);
          }
        }
        
        // Recursively traverse nested objects
        if (typeof obj[key] === 'object') {
          traverse(obj[key], currentPath + '.' + key);
        }
      }
    }
  }
  
  traverse(node);
  return results;
}

// Tìm element đầu tiên theo tag name
export function findElementByTagName(node: XMLNode, tagName: string): XMLNode | null {
  const results = findElementsByTagName(node, tagName);
  return results.length > 0 ? results[0] : null;
}

// Lấy text content từ node (Office XML structure)
export function getTextContent(node: XMLNode): string {
  if (!node) return '';
  
  let text = '';
  
  // Handle direct text content
  if (typeof node === 'string') {
    return node;
  }
  
  // Handle #text property
  if (node['#text']) {
    text += node['#text'];
  }
  
  // Handle w:t elements (Word text)
  const textElements = findElementsByTagName(node, 't');
  for (const textEl of textElements) {
    if (typeof textEl === 'string') {
      text += textEl;
    } else if (textEl['#text']) {
      text += textEl['#text'];
    }
  }
  
  // Recursively get text from all properties
  if (typeof node === 'object') {
    for (const key in node) {
      if (key !== '@_' && typeof node[key] === 'object') {
        text += getTextContent(node[key]);
      }
    }
  }
  
  return text.trim();
}

// Lấy attribute value (với namespace support)
export function getAttribute(node: XMLNode, attributeName: string): string | null {
  if (!node || typeof node !== 'object') return null;
  
  // Try direct attribute access
  const directAttr = node['@_' + attributeName];
  if (directAttr !== undefined) {
    return String(directAttr);
  }
  
  // Try with various namespace prefixes
  const prefixes = ['w:', 'r:', 'a:', 'p:', ''];
  for (const prefix of prefixes) {
    const attr = node['@_' + prefix + attributeName];
    if (attr !== undefined) {
      return String(attr);
    }
  }
  
  return null;
}

// Kiểm tra node có attribute không
export function hasAttribute(node: XMLNode, attributeName: string): boolean {
  return getAttribute(node, attributeName) !== null;
}

// Parse relationships từ .rels file
export function parseRelationships(relsXml: string): OpenXMLRelationship[] {
  try {
    const relationships: OpenXMLRelationship[] = [];
    const doc = parseXML(relsXml);
    
    if (!doc) return relationships;
    
    // Navigate to Relationships element
    const relationshipsRoot = doc['Relationships'] || doc['ns0:Relationships'];
    if (!relationshipsRoot) return relationships;
    
    const relationshipNodes = findElementsByTagName(relationshipsRoot, 'Relationship');
    
    for (const node of relationshipNodes) {
      const id = getAttribute(node, 'Id');
      const type = getAttribute(node, 'Type');
      const target = getAttribute(node, 'Target');
      
      if (id && type && target) {
        relationships.push({ id, type, target });
      }
    }
    
    logger.debug(`Parse được ${relationships.length} relationships`);
    return relationships;
  } catch (error) {
    logger.error('Lỗi khi parse relationships:', error);
    return [];
  }
}

// Kiểm tra XML có chứa các elements cần thiết không
export function hasRequiredElements(xmlNode: XMLNode, requiredElements: string[]): boolean {
  const foundElements = new Set<string>();
  
  function traverse(node: any) {
    if (typeof node === 'object' && node !== null) {
      for (const key in node) {
        // Check if this is an element we're looking for
        for (const required of requiredElements) {
          if (key === required || key.endsWith(':' + required)) {
            foundElements.add(required);
          }
        }
        
        // Continue traversing
        traverse(node[key]);
      }
    }
  }
  
  traverse(xmlNode);
  
  return requiredElements.every(element => 
    Array.from(foundElements).some(found => 
      found === element || found.endsWith(':' + element)
    )
  );
}

// Safe XML parsing với error recovery
export function safeParseXML(xmlString: string, fallbackValue: XMLNode): XMLNode {
  const parsed = parseXML(xmlString);
  if (parsed) {
    return parsed;
  }
  
  logger.warn('XML parse thất bại, sử dụng fallback value');
  return fallbackValue;
}

// Helper to extract Word document structure elements
export function findDocumentBody(doc: XMLNode): XMLNode | null {
  // Navigate to w:document -> w:body
  const document = doc['w:document'] || doc.document;
  if (!document) return null;
  
  return document['w:body'] || document.body || null;
}

// Helper to count specific elements
export function countElements(node: XMLNode, tagName: string): number {
  return findElementsByTagName(node, tagName).length;
}

// Helper to check if element exists
export function hasElement(node: XMLNode, tagName: string): boolean {
  return findElementByTagName(node, tagName) !== null;
}