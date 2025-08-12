import type { Context } from 'hono';
import { success } from '../../core/responses.ts';
import { AppError } from '../../core/errors.ts';
import { scan } from './service/scan.ts';
import { analyzeFile } from './service/details.ts';

/**
 * GET /files
 */
export const list = async (c: Context) => {
  const dir = c.req.query('path') || 'example';
  const files = await scan(dir);
  return success(c, files, `Tìm thấy ${files.length} file.`);
};

/**
 * POST /files/details
 */
export const details = async (c: Context) => {
  const mode = c.req.query('mode') ?? 'full';
  const output = c.req.query('output');
  const form = await c.req.formData();
  const file = form.get('file') as File | null;
  if (!file) throw new AppError('Không tìm thấy file trong request.', 400);
  const result = await analyzeFile(file, mode, output);
  if (result.type === 'excel') {
    c.header('Content-Type', result.contentType);
    c.header('Content-Disposition', `attachment; filename="${result.filename}"`);
    return c.body(result.buffer);
  }
  return success(c, result.data);
};
