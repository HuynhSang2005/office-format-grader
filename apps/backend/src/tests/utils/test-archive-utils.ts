/**
 * @file test-archive-utils.ts
 * @description Utility functions for creating test archives
 * @author Nguyễn Huỳnh Sang
 */

import JSZip from 'jszip';
import { promises as fs } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';

// Create a mock DOCX file structure
export async function createMockDOCX(): Promise<Buffer> {
  const zip = new JSZip();
  
  // Add basic DOCX structure
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><document><body><p>Test document content</p></body></document>');
  zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styles></styles>');
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Create a mock PPTX file structure
export async function createMockPPTX(): Promise<Buffer> {
  const zip = new JSZip();
  
  // Add basic PPTX structure
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships></Relationships>');
  zip.file('ppt/presentation.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><presentation></presentation>');
  zip.file('ppt/slides/slide1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sld><cSld></cSld></sld>');
  zip.file('ppt/theme/theme1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme></a:theme>');
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Create a ZIP archive containing Office files
export async function createZIPWithOfficeFiles(): Promise<Buffer> {
  const zip = new JSZip();
  
  // Add a DOCX file
  const docxBuffer = await createMockDOCX();
  zip.file('document.docx', docxBuffer);
  
  // Add a PPTX file
  const pptxBuffer = await createMockPPTX();
  zip.file('presentation.pptx', pptxBuffer);
  
  // Add a text file (should be ignored during processing)
  zip.file('readme.txt', 'This is a text file');
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Create a ZIP archive containing only non-Office files
export async function createZIPWithoutOfficeFiles(): Promise<Buffer> {
  const zip = new JSZip();
  
  // Add only non-Office files
  zip.file('readme.txt', 'This is a text file');
  zip.file('data.json', '{"test": "data"}');
  zip.file('image.png', Buffer.from([0x89, 0x50, 0x4E, 0x47])); // PNG signature
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Create a RAR-like buffer (simplified for testing)
export function createMockRAR(): Buffer {
  // RAR5 signature
  return Buffer.from([
    0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, // RAR5 signature
    // Mock RAR content
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
  ]);
}