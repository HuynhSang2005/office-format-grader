import { gradeSubmissionWithAI } from './ai/service.ts';
import { gradePptxManually } from './manual/service.ts';

export async function aiCheck(rubricFile: File, submissionFile: File, output?: string) {
  // TODO: implement full AI checking logic
  return { type: 'json' as const, data: await gradeSubmissionWithAI('', '') };
}

export async function manualCheck(submissionFile: File, output?: string, format?: string) {
  // TODO: implement manual grading logic
  return { type: 'json' as const, data: await gradePptxManually({} as any) };
}

export async function checkCriterion(id: string, submissionFile: File) {
  // TODO: implement check criterion logic
  return { type: 'json' as const, data: { id } };
}
