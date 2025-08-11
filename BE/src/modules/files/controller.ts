import type { Context } from 'hono';
import { successResponse } from '../../core/responses/index.ts';
import { errorResponse } from '../../core/http/errors.ts';
import * as svc from './service.ts';

export const list = async (c: Context) => {
  try {
    const dirPath = c.req.query('path') || 'example';
    const files = await svc.scan(dirPath);
    return successResponse(c, files, `Tìm thấy ${files.length} file.`);
  } catch (e) {
    return errorResponse(c, e);
  }
};

export const details = async (c: Context) => {
  try {
    const mode = c.req.query('mode') ?? 'full';
    const output = c.req.query('output');
    const form = await c.req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      throw new Error('Không tìm thấy file nào trong request.');
    }
    const result = await svc.analyzeFile(file, mode, output);
    if (result.type === 'excel') {
      c.header('Content-Type', result.contentType);
      c.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      return c.body(result.buffer);
    }
    return successResponse(c, result.data);
  } catch (e) {
    return errorResponse(c, e);
  }
};
