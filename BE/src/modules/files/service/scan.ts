import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { ScannedFile } from '../../../types/domain/files.ts';

/**
 * Duyệt thư mục và lọc file Office.
 */
export async function scan(dirPath: string): Promise<ScannedFile[]> {
  const allowed = ['.docx', '.pptx', '.xlsx'];
  const files: ScannedFile[] = [];

  async function walk(current: string) {
    try {
      const entries = await readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) await walk(full);
        else {
          const ext = path.extname(entry.name).toLowerCase();
          if (allowed.includes(ext)) files.push({ name: entry.name, path: full, extension: ext });
        }
      }
    } catch {
      // ignore folder lỗi permission
    }
  }

  await walk(dirPath);
  return files;
}
