import { downloadFile } from "../lib/fileUtils";

export async function checkManually({
  file,
  output = 'json',
  format = 'standard'
}: {
  file: File,
  output: 'json' | 'excel',
  format?: 'standard' | 'detailed'
}) {
  const url = `http://localhost:3000/api/manual-checker?output=${output}&format=${format}`;
  const formData = new FormData();
  formData.append('submissionFile', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Lỗi khi chấm điểm thủ công.');
  }

  if (output === 'excel') {
    await downloadFile(response, `manual-report-${file.name}.xlsx`);
    return { message: `File manual-report-${file.name}.xlsx đã được tải về.` };
  } else {
    const data = await response.json();
    return data.data;
  }
}
