export function encodeFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string | undefined;
      if (!result) {
        reject(new Error('Không thể đọc file'));
        return;
      }
      const base64Content = result.split(',')[1];
      if (!base64Content) {
        reject(new Error('Không thể lấy dữ liệu base64'));
        return;
      }
      resolve(base64Content);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export async function downloadFile(response: Response, filename: string) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}