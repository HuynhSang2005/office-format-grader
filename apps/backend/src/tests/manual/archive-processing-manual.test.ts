/**
 * @file archive-processing-manual.test.ts
 * @description Manual test script for archive processing functionality
 * @author Nguyễn Huỳnh Sang
 */

import { validateFile } from '@services/storage.service';
import { extractAllFilesFromArchive } from '@services/archive.service';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

// This script is meant to be run manually to test archive processing with real files
// It's not part of the automated test suite

async function testArchiveProcessing() {
  console.log('=== Manual Archive Processing Test ===');
  
  try {
    // Test 1: Validate a real ZIP file
    console.log('\n1. Testing ZIP file validation...');
    const zipBuffer = await readFile(join(__dirname, '../../../samples/test.zip'));
    const zipValidation = await validateFile(zipBuffer, 'test.zip');
    console.log('ZIP Validation Result:', zipValidation);
    
    // Test 2: Validate a real RAR file
    console.log('\n2. Testing RAR file validation...');
    const rarBuffer = await readFile(join(__dirname, '../../../samples/test.rar'));
    const rarValidation = await validateFile(rarBuffer, 'test.rar');
    console.log('RAR Validation Result:', rarValidation);
    
    // Test 3: Extract files from ZIP archive
    console.log('\n3. Testing ZIP file extraction...');
    const zipExtracted = await extractAllFilesFromArchive(zipBuffer, '.zip');
    console.log('ZIP Extracted Files:', Object.keys(zipExtracted || {}));
    
    // Test 4: Extract files from RAR archive
    console.log('\n4. Testing RAR file extraction...');
    const rarExtracted = await extractAllFilesFromArchive(rarBuffer, '.rar');
    console.log('RAR Extracted Files:', Object.keys(rarExtracted || {}));
    
    console.log('\n=== Manual Test Complete ===');
  } catch (error) {
    console.error('Error during manual test:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testArchiveProcessing().catch(console.error);
}

export { testArchiveProcessing };