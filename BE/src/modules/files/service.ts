import { readdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'os';
import type { ScannedFile } from './types.ts';
import { sanitizeFilename } from '../../shared/file/sanitizeFilename.ts';
import { parseWordWithFormat } from '../word/service/parseFormat.ts';
import { parsePowerPointFormat } from '../powerpoint/service/parseFormat.ts';
import { parseExcelFile } from '../excel/service/parse.ts';
import { exportDetailsToExcel, generateExcelBuffer } from '../../shared/excel/exporter.ts';

export async function scan(dirPath: string): Promise<ScannedFile[]> {
  const allowedExtensions = ['.docx', '.pptx', '.xlsx'];
  const filesFound: ScannedFile[] = [];

  async function recursiveScan(currentPath: string) {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await recursiveScan(fullPath);
        } else {
          const extension = path.extname(entry.name).toLowerCase();
          if (allowedExtensions.includes(extension)) {
            filesFound.push({ name: entry.name, path: fullPath, extension });
          }
        }
      }
    } catch {
      // ignore inaccessible directories
    }
  }

  await recursiveScan(dirPath);
  return filesFound;
}

export async function analyzeFile(file: File, mode: string, output?: string) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'office-analyzer-'));
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(tempDir, file.name);
    await writeFile(tempFilePath, buffer);

    const extension = path.extname(file.name).toLowerCase();
    let parsedData: unknown;
    if (mode === 'full') {
      if (extension === '.docx') parsedData = await parseWordWithFormat(tempFilePath);
      else if (extension === '.pptx') parsedData = await parsePowerPointFormat(tempFilePath);
      else if (extension === '.xlsx') parsedData = await parseExcelFile(tempFilePath);
      else throw new Error(`Định dạng file ${extension} không được hỗ trợ.`);
    } else {
      if (extension === '.docx') parsedData = await parseWordWithFormat(tempFilePath);
      else if (extension === '.pptx') parsedData = await parsePowerPointFormat(tempFilePath);
      else if (extension === '.xlsx') parsedData = await parseExcelFile(tempFilePath);
      else throw new Error(`Định dạng file ${extension} không được hỗ trợ.`);
    }

    if (output === 'excel' && (extension === '.docx' || extension === '.pptx')) {
      const emptyResult = { totalAchievedScore: 0, totalMaxScore: 0, details: [] };
      const workbook = exportDetailsToExcel(emptyResult as any, parsedData as any, file.name);
      const excelBuffer = await generateExcelBuffer(workbook);
      return {
        type: 'excel' as const,
        buffer: excelBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: sanitizeFilename(`analysis-${file.name}.xlsx`),
      };
    }

    return { type: 'json' as const, data: parsedData };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
