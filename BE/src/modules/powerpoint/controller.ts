import type { Context } from 'hono';
import { success } from '../../core/responses.ts';
import { AppError } from '../../core/errors.ts';
import { parsePowerPointFormat } from './service/parseFormat.ts';

export const analyze = async (c: Context) => {
  const form = await c.req.formData();
  const file = form.get('file') as File | null;
  if (!file) throw new AppError('Thiếu file PowerPoint', 400);
  const result = await parsePowerPointFormat(file.name);
  return success(c, result);
};
