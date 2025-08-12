import { getAiModel } from './client.ts';
import { promptTemplate } from './prompt.ts';
import { mapAiResult } from './resultMapper.ts';

/**
 * Gọi Gemini để chấm điểm.
 */
export async function gradeSubmissionWithAI(rubric: string, submissionJson: string) {
  const model = getAiModel();
  const prompt = promptTemplate
    .replace('{rubric_text_placeholder}', rubric)
    .replace('{submission_json_placeholder}', submissionJson);
  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  return mapAiResult(JSON.parse(text));
}
