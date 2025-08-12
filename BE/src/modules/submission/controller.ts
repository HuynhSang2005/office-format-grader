import type { Context } from 'hono';
import { success } from '../../core/responses.ts';
import { AppError } from '../../core/errors.ts';
import { summarize } from './service/summarize.ts';

export const analyze = async (c: Context) => {
  const form = await c.req.formData();
  const submissionFile = form.get('submissionFile') as File | null;
  if (!submissionFile) throw new AppError('Cần file submission.', 400);
  const rubricFile = form.get('rubricFile') as File | null;
  const result = await summarize(submissionFile, rubricFile ?? undefined);
  return success(c, result);
};
