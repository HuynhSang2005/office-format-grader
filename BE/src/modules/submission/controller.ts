import type { Context } from 'hono';
import { successResponse } from '../../core/responses/index.ts';
import { errorResponse } from '../../core/http/errors.ts';
import * as svc from './service.ts';

export const analyze = async (c: Context) => {
  try {
    const form = await c.req.formData();
    const submissionFile = form.get('submissionFile') as File | null;
    const rubricFile = form.get('rubricFile') as File | null;
    if (!submissionFile) {
      throw new Error('Không tìm thấy file nộp bài trong request');
    }
    const summary = await svc.analyzeSubmission(submissionFile, rubricFile ?? undefined);
    return successResponse(c, summary, 'Phân tích file nộp bài thành công');
  } catch (e) {
    return errorResponse(c, e);
  }
};
