import { apiUrl } from "../configs/apiUrl";

export async function analyzeSubmission({
  submissionFile,
  rubricFile
}: {
  submissionFile: File,
  rubricFile?: File
}) {
  const url = apiUrl(`/submission/analyze`);
  const formData = new FormData();
  formData.append('submissionFile', submissionFile);
  if (rubricFile) {
    formData.append('rubricFile', rubricFile);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Lỗi khi phân tích bài nộp.');
  }

  const data = await response.json();
  return data.data;
}
