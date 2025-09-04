/**
 * @file openxml.util.ts
 * @description Helper functions để đọc và parse XML từ file OpenXML (PPTX) với fast-xml-parser
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { XMLParser, XMLValidator, X2jOptions } from 'fast-xml-parser';
import type { 
  PPTXXMLNode, 
  PPTXRelationship, 
  SlideRelationship, 
  ThemeDefinition 
} from '@/types/pptx-xml.types';

// XML Parser configuration for PowerPoint documents
const parserOptions: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  alwaysCreateTextNode: false,
  removeNSPrefix: false, // Keep namespace prefixes for PowerPoint XML
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
    // PowerPoint XML elements that should always be arrays
    const arrayElements = [
      'p:sp', 'p:pic', 'p:graphicFrame', 'p:grpSp', 'p:cxnSp',
      'p:sld', 'p:sldLayout', 'p:sldMaster', 'a:p', 'a:r', 'a:t',
      'p:txBody', 'p:spPr', 'p:nvSpPr', 'Relationship'
    ];
    return arrayElements.includes(name);
  }
};

const parser = new XMLParser(parserOptions);

// Parse XML string thành PPTXXMLNode tree
export function parsePPTXXML(xmlString: string): PPTXXMLNode | null {
  try {
    logger.debug('Đang parse PowerPoint XML content với fast-xml-parser');
    
    // Validate XML first
    const validation = XMLValidator.validate(xmlString);
    if (validation !== true) {
      logger.error('PowerPoint XML không hợp lệ:', validation);
      return null;
    }
    
    // Parse XML
    const parsed = parser.parse(xmlString);
    
    logger.debug('Parse PowerPoint XML thành công');
    return parsed as PPTXXMLNode;
    
  } catch (error) {
    logger.error('Lỗi khi parse PowerPoint XML:', error);
    return null;
  }
}

// Tìm elements theo tag name với namespace support
export function findElementsByNamespace(node: PPTXXMLNode, namespace: string, tagName: string): PPTXXMLNode[] {
  const results: PPTXXMLNode[] = [];
  const fullTagName = `${namespace}:${tagName}`;
  
  function traverse(obj: any) {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === fullTagName || key === tagName) {
          const value = obj[key];
          if (Array.isArray(value)) {
            results.push(...value);
          } else {
            results.push(value);
          }
        }
        
        // Recursively traverse nested objects
        if (typeof obj[key] === 'object') {
          traverse(obj[key]);
        }
      }
    }
  }
  
  traverse(node);
  return results;
}

// Tìm element đầu tiên theo namespace và tag name
export function findElementByNamespace(node: PPTXXMLNode, namespace: string, tagName: string): PPTXXMLNode | null {
  const results = findElementsByNamespace(node, namespace, tagName);
  return results.length > 0 ? results[0] : null;
}

// Lấy text content từ PowerPoint text elements
export function extractPPTXText(node: PPTXXMLNode): string {
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
  
  // Handle a:t elements (PowerPoint text)
  const textElements = findElementsByNamespace(node, 'a', 't');
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
        text += extractPPTXText(node[key]);
      }
    }
  }
  
  return text.trim();
}

// Lấy attribute value với namespace support
export function getPPTXAttribute(node: PPTXXMLNode, attributeName: string): string | null {
  if (!node || typeof node !== 'object') return null;
  
  // Try direct attribute access
  const directAttr = node['@_' + attributeName];
  if (directAttr !== undefined) {
    return String(directAttr);
  }
  
  // Try with various namespace prefixes
  const prefixes = ['p:', 'a:', 'r:', 'w:', ''];
  for (const prefix of prefixes) {
    const attr = node['@_' + prefix + attributeName];
    if (attr !== undefined) {
      return String(attr);
    }
  }
  
  return null;
}

// Kiểm tra node có attribute không
export function hasPPTXAttribute(node: PPTXXMLNode, attributeName: string): boolean {
  return getPPTXAttribute(node, attributeName) !== null;
}

// Parse PowerPoint relationships từ .rels file
export function parsePPTXRelationships(relsXml: string): PPTXRelationship[] {
  try {
    const relationships: PPTXRelationship[] = [];
    const doc = parsePPTXXML(relsXml);
    
    if (!doc) return relationships;
    
    // Navigate to Relationships element
    const relationshipsRoot = doc['Relationships'] || doc['ns0:Relationships'];
    if (!relationshipsRoot) return relationships;
    
    const relationshipNodes = findElementsByNamespace(relationshipsRoot, '', 'Relationship');
    
    for (const node of relationshipNodes) {
      const id = getPPTXAttribute(node, 'Id');
      const type = getPPTXAttribute(node, 'Type');
      const target = getPPTXAttribute(node, 'Target');
      
      if (id && type && target) {
        relationships.push({ id, type, target });
      }
    }
    
    logger.debug(`Parse được ${relationships.length} PowerPoint relationships`);
    return relationships;
  } catch (error) {
    logger.error('Lỗi khi parse PowerPoint relationships:', error);
    return [];
  }
}

// Extract theme information from theme XML
export function extractThemeInfo(themeXml: string): ThemeDefinition | null {
  try {
    const doc = parsePPTXXML(themeXml);
    if (!doc) return null;
    
    // Extract theme name
    const themeElement = findElementByNamespace(doc, 'a', 'theme');
    const themeName = themeElement ? getPPTXAttribute(themeElement, 'name') || 'Unknown Theme' : 'Unknown Theme';
    
    // Extract color scheme
    const colorScheme: Record<string, string> = {};
    const colorSchemeEl = findElementByNamespace(doc, 'a', 'clrScheme');
    if (colorSchemeEl) {
      const colors = findElementsByNamespace(colorSchemeEl, 'a', 'srgbClr');
      for (const color of colors) {
        const name = getPPTXAttribute(color, 'name') || 'unknown';
        const val = getPPTXAttribute(color, 'val') || '';
        colorScheme[name] = val;
      }
    }
    
    // Extract font scheme
    let majorFont = 'Unknown';
    let minorFont = 'Unknown';
    const fontSchemeEl = findElementByNamespace(doc, 'a', 'fontScheme');
    if (fontSchemeEl) {
      const majorFontEl = findElementByNamespace(fontSchemeEl, 'a', 'majorFont');
      const minorFontEl = findElementByNamespace(fontSchemeEl, 'a', 'minorFont');
      
      if (majorFontEl) {
        const latinFont = findElementByNamespace(majorFontEl, 'a', 'latin');
        majorFont = latinFont ? (getPPTXAttribute(latinFont, 'typeface') || 'Unknown') : 'Unknown';
      }
      
      if (minorFontEl) {
        const latinFont = findElementByNamespace(minorFontEl, 'a', 'latin');
        minorFont = latinFont ? (getPPTXAttribute(latinFont, 'typeface') || 'Unknown') : 'Unknown';
      }
    }
    
    return {
      name: themeName,
      colorScheme,
      fontScheme: {
        majorFont,
        minorFont
      }
    };
  } catch (error) {
    logger.error('Lỗi khi extract theme info:', error);
    return null;
  }
}

// Extract slide objects information
export function extractSlideObjects(slideXml: string): Array<{ type: string; name?: string }> {
  const objects: Array<{ type: string; name?: string }> = [];
  
  try {
    const doc = parsePPTXXML(slideXml);
    if (!doc) return objects;
    
    // Extract shapes
    const shapes = findElementsByNamespace(doc, 'p', 'sp');
    for (const shape of shapes) {
      const name = getPPTXAttribute(shape, 'name');
      objects.push({
        type: 'shape',
        name: name || undefined
      });
    }
    
    // Extract pictures
    const pics = findElementsByNamespace(doc, 'p', 'pic');
    for (const pic of pics) {
      objects.push({
        type: 'image',
        name: 'Picture'
      });
    }
    
    // Extract graphic frames (charts, tables, etc.)
    const graphicFrames = findElementsByNamespace(doc, 'p', 'graphicFrame');
    for (const frame of graphicFrames) {
      const graphic = findElementByNamespace(frame, 'a', 'graphic');
      if (graphic) {
        const graphicData = findElementByNamespace(graphic, 'a', 'graphicData');
        const uri = graphicData ? getPPTXAttribute(graphicData, 'uri') : '';
        
        if (uri?.includes('chart')) {
          objects.push({ type: 'chart', name: 'Chart' });
        } else if (uri?.includes('table')) {
          objects.push({ type: 'table', name: 'Table' });
        } else if (uri?.includes('smartart') || uri?.includes('diagram')) {
          objects.push({ type: 'smartart', name: 'SmartArt' });
        } else {
          objects.push({ type: 'shape', name: 'Graphic' });
        }
      }
    }
    
    return objects;
  } catch (error) {
    logger.error('Lỗi khi extract slide objects:', error);
    return objects;
  }
}

// Safe XML parsing với error recovery
export function safeParsePPTXXML(xmlString: string, fallbackValue: PPTXXMLNode): PPTXXMLNode {
  const parsed = parsePPTXXML(xmlString);
  if (parsed) {
    return parsed;
  }
  
  logger.warn('PowerPoint XML parse thất bại, sử dụng fallback value');
  return fallbackValue;
}

// Helper to count specific elements
export function countPPTXElements(node: PPTXXMLNode, namespace: string, tagName: string): number {
  return findElementsByNamespace(node, namespace, tagName).length;
}

// Helper to check if element exists
export function hasPPTXElement(node: PPTXXMLNode, namespace: string, tagName: string): boolean {
  return findElementByNamespace(node, namespace, tagName) !== null;
}