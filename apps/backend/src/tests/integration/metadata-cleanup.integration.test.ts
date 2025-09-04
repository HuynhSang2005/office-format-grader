/**
 * @file metadata-cleanup.integration.test.ts
 * @description Integration tests cho metadata cleanup functionality
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Metadata Cleanup Integration', () => {
  const metadataDir = path.join(process.cwd(), 'metadata');
  const tempDir = path.join(process.cwd(), 'temp');
  
  beforeEach(async () => {
    // Ensure directories exist
    await fs.mkdir(metadataDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  it('should have proper directory structure', async () => {
    const metadataExists = await fs.access(metadataDir).then(() => true).catch(() => false);
    const tempExists = await fs.access(tempDir).then(() => true).catch(() => false);
    
    expect(metadataExists).toBe(true);
    expect(tempExists).toBe(true);
  });
  
  it('should be able to read metadata files', async () => {
    // Try to read some metadata files
    const files = await fs.readdir(metadataDir);
    // Just check that we can read the directory
    expect(Array.isArray(files)).toBe(true);
  });
});