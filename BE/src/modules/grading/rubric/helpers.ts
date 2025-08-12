import { defaultRules, type RubricRule } from './rules.ts';

/** Trả về rubric mặc định. */
export function getRubric(): RubricRule[] {
  return defaultRules;
}
