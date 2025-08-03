import type { UploadedFile } from '../types/api.types';

async function downloadFile(response: Response, filename: string) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

// Lấy danh sách file có sẵn trên server
export async function getAvailableFiles(): Promise<string[]> {
    const response = await fetch('http://localhost:3000/api/files');
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Không thể lấy danh sách file.');
    // Giả sử API trả về { data: ['file1.docx', 'file2.pptx'] }
    return data.data.map((file: any) => file.name);
}

// Lấy chi tiết file đã phân tích
export async function getFileDetails({ filename, mode, output }: { filename: string, mode: string, output: string }) {
    const url = `http://localhost:3000/api/files/details?filename=${filename}&mode=${mode}&output=${output}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi khi phân tích file.');
    }

    if (output === 'excel') {
        await downloadFile(response, filename);
        return { message: `File ${filename}.xlsx đã được tải về.` };
    } else {
        const data = await response.json();
        return data.data.details;
    }
}

export async function analyzeFile({ file, mode, output }: { file: UploadedFile, mode: string, output: string }) {
    const url = `http://localhost:3000/api/files/details?mode=${mode}&output=${output}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi khi phân tích file.');
    }
}