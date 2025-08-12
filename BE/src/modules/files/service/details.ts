import { writeFile, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { sanitizeFilename } from '../../../shared/file/sanitizeFilename.ts';
import { parseWordFormat } from '../../word/service/parseFormat.ts';
import { parsePowerPointFormat } from '../../powerpoint/service/parseFormat.ts';
import { parseExcelFile } from '../../excel/service/parse.ts';
import { exportAnalysis } from './export.ts';

/**
 * Phân tích file và trả dữ liệu hoặc excel buffer.
 */
export async function analyzeFile(file: File, mode: string, output?: string) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'office-analyzer-'));
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(tempDir, file.name);
    await writeFile(tempFilePath, buffer);

    const ext = path.extname(file.name).toLowerCase();
    let parsed: unknown;
    if (ext === '.docx') parsed = await parseWordFormat(tempFilePath);
    else if (ext === '.pptx') parsed = await parsePowerPointFormat(tempFilePath);
    else if (ext === '.xlsx') parsed = await parseExcelFile(tempFilePath);
    else throw new Error(`Định dạng ${ext} không hỗ trợ.`);

    if (output === 'excel' && (ext === '.docx' || ext === '.pptx')) {
      return exportAnalysis(parsed as any, sanitizeFilename(`analysis-${file.name}.xlsx`));
    }

    return { type: 'json' as const, data: parsed };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
