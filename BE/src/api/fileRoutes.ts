import { Hono } from 'hono';
import path from 'node:path';
import { scanOfficeFiles } from '../services/fileScanner';
import { parseExcelFile } from '../services/xlsxParser';
import { parseWordFile } from '../services/docxParser';
import { parsePowerPointFile } from '../services/pptxParser';

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

fileRoutes.get('/files/details', async (c) => {
  const filename = c.req.query('filename');

  if (!filename) {
    return c.json({ error: 'Tên file là bắt buộc.' }, 400);
  }

  // Biện pháp bảo mật: chỉ cho phép truy cập file trong thư mục 'documents'
  // và ngăn chặn tấn công Path Traversal (vd: ../../tên_file)
  const safeBaseDir = path.resolve('documents');
  const safeFilePath = path.join(safeBaseDir, filename);

  if (!safeFilePath.startsWith(safeBaseDir)) {
      return c.json({ error: 'Truy cập file không hợp lệ.' }, 403);
  }

  const extension = path.extname(filename).toLowerCase();

  try {
    let data;
    switch (extension) {
      case '.xlsx':
        data = await parseExcelFile(safeFilePath);
        break;
      case '.docx':
        data = await parseWordFile(safeFilePath);
        break;
      case '.pptx':
        data = await parsePowerPointFile(safeFilePath);
        break;
      default:
        return c.json({ error: 'Định dạng file không được hỗ trợ.' }, 400);
    }

    return c.json({ filename, data });

  } catch (error: any) {
    // Xử lý lỗi, ví dụ file không tồn tại
    if (error.code === 'ENOENT') {
        return c.json({ error: `File '${filename}' không tồn tại.` }, 404);
    }
    return c.json({ error: error.message || 'Lỗi máy chủ nội bộ.' }, 500);
  }
});



export default fileRoutes;