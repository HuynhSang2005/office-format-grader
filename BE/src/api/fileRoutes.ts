import { Hono } from 'hono';
import { scanOfficeFiles } from '../services/fileScanner';

const fileRoutes = new Hono();

fileRoutes.get('/files', async (c) => {
  // Lấy đường dẫn thư mục từ query param, ví dụ: /api/files?path=./test-docs
  // Nếu không có, dùng thư mục 'documents' làm mặc định
  const dirPath = c.req.query('path') || 'documents';

  try {
    const files = await scanOfficeFiles(dirPath);
    if (files.length === 0) {
        return c.json({
            message: `Không tìm thấy file Office nào trong thư mục '${dirPath}'.`,
            data: []
        });
    }
    return c.json({
        message: `Tìm thấy ${files.length} file.`,
        data: files
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: `Lỗi máy chủ khi quét thư mục '${dirPath}'.` }, 500);
  }
});

export default fileRoutes;