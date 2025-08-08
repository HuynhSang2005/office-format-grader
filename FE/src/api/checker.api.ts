import type { GradePayload, GradeResponse } from "../types/api.types";
import { downloadFile } from "../lib/fileUtils";
import { apiUrl } from "../configs/apiUrl";


export async function processGrading({
  rubricFile,
  submissionFile,
  output,
}: GradePayload & { output: "json" | "excel" }): Promise<GradeResponse | { message: string }> {
  const url = apiUrl(`/ai-checker?output=${output}`);
  const formData = new FormData();
  formData.append("rubricFile", rubricFile);
  formData.append("submissionFile", submissionFile);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Có lỗi xảy ra từ server.");
  }

  if (output === "excel") {
    await downloadFile(response, `grading-report-${submissionFile.name}.xlsx`);
    return { message: "Tải file thành công" };
  } else {
    const data = await response.json();
    return data.data;
  }
}