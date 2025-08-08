import { apiUrl } from "../configs/apiUrl";
import { assertOk } from "../lib/http";

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

  await assertOk(response, 'Lỗi khi phân tích bài nộp.');

  const data = await response.json();
  return data.data;
}
