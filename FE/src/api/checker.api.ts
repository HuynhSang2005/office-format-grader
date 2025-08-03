import type { UploadedFile, GradingResult } from "../types/api.types";

interface GradePayload {
  rubricFile: UploadedFile;
  submissionFile: UploadedFile;
}

export async function gradeSubmission(payload: GradePayload): Promise<GradingResult> {
  const response = await fetch('http://localhost:3000/api/ai-checker', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || data.message || 'Có lỗi xảy ra từ server.');
  }

  return data.data;
}