import { apiUrl } from "../configs/apiUrl";
import { downloadFile } from "../lib/fileUtils";

// Chỉ cần một hàm duy nhất
export async function analyzeFile({ file, mode, output }: { file: File, mode: string, output: string }) {
    const url = apiUrl(`/files/details?mode=${mode}&output=${output}`);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi khi phân tích file.');
    }

    if (output === 'excel') {
        await downloadFile(response, file.name);
        return { message: `File ${file.name}.xlsx đã được tải về.` };
    } else {
        const data = await response.json();
        return data.data.details ?? data.data;
    }
}