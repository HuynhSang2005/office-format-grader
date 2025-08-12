import type { Context } from 'hono';
import { success } from '../../core/responses.ts';
import { gradeSubmissionWithAI } from './ai/service.ts';
import { gradePptxManually } from './manual/service.ts';

export const aiCheck = async (c: Context) => {
  const result = await gradeSubmissionWithAI('', '');
  return success(c, result, 'AI graded');
};

export const manualCheck = async (c: Context) => {
  const result = gradePptxManually({});
  return success(c, result, 'Manual graded');
};
