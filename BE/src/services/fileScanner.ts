import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Định nghĩa cấu trúc dữ liệu cho một file được quét.
 */
export interface ScannedFile {
  name: string;
  path: string;
  extension: string;
}


export async function scanOfficeFiles(dirPath: string): Promise<ScannedFile[]> {
  // Các định dạng file chúng ta muốn tìm
  const allowedExtensions = ['.docx', '.pptx', '.xlsx'];
  const filesFound: ScannedFile[] = [];

  async function recursiveScan(currentPath: string) {
    try {
      // Đọc tất cả các mục trong thư mục hiện tại
      const entries = await readdir(currentPath, { withFileTypes: true });

      // Lặp qua từng mục
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          // Nếu là thư mục, tiếp tục đệ quy bên trong
          await recursiveScan(fullPath);
        } else {
          // Nếu là file, kiểm tra đuôi file
          const extension = path.extname(entry.name).toLowerCase();
          if (allowedExtensions.includes(extension)) {
            // Nếu đúng định dạng, thêm vào danh sách kết quả
            filesFound.push({
              name: entry.name,
              path: fullPath,
              extension: extension,
            });
          }
        }
      }
    } catch (error) {
        console.error(`Lỗi khi quét thư mục ${currentPath}:`, error);
        // Bỏ qua thư mục không thể truy cập và tiếp tục
    }
  }

  await recursiveScan(dirPath);
  return filesFound;
}