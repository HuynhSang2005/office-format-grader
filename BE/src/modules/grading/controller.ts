import type { Context } from 'hono';
import { successResponse } from '../../core/responses/index.ts';
import { errorResponse } from '../../core/http/errors.ts';
import * as svc from './service.ts';

export const aiCheck = async (c: Context) => {
  try {
    const { output } = c.req.query();
    const form = await c.req.formData();
    const rubricFile = form.get('rubricFile') as File | null;
    const submissionFile = form.get('submissionFile') as File | null;
    if (!rubricFile || !submissionFile) {
      throw new Error('Cần cung cấp đủ rubricFile và submissionFile.');
    }
    const result = await svc.aiCheck(rubricFile, submissionFile, output);
    if (result.type === 'excel') {
      c.header('Content-Type', result.contentType);
      c.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      return c.body(result.buffer);
    }
    return successResponse(c, result.data, 'AI đã hoàn thành việc chấm điểm.');
  } catch (e) {
    return errorResponse(c, e);
  }
};

export const manualCheck = async (c: Context) => {
  try {
    const { output, format } = c.req.query();
    const form = await c.req.formData();
    const submissionFile = form.get('submissionFile') as File | null;
    if (!submissionFile) throw new Error('Cần cung cấp file bài nộp.');
    const result = await svc.manualCheck(submissionFile, output, format);
    if (result.type === 'excel') {
      c.header('Content-Type', result.contentType);
      c.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      return c.body(result.buffer);
    }
    return successResponse(c, result.data, 'Đã hoàn thành chấm điểm thủ công.');
  } catch (e) {
    return errorResponse(c, e);
  }
};

export const checkCriterion = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const form = await c.req.formData();
    const submissionFile = form.get('submissionFile') as File | null;
    if (!submissionFile) throw new Error('Cần cung cấp file bài nộp.');
    const result = await svc.checkCriterion(id, submissionFile);
    return successResponse(c, result.data, `Đã chấm điểm tiêu chí ${id}.`);
  } catch (e) {
    return errorResponse(c, e);
  }
};
