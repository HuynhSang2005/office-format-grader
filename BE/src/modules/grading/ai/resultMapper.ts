import type { GradingResult } from '../../../types/domain/grading.ts';

/**
 * Chuyển JSON AI trả về sang GradingResult.
 */
export function mapAiResult(raw: any): GradingResult {
  return raw as GradingResult;
}
