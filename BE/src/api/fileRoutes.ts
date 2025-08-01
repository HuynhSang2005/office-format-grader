import { Hono } from "hono";
import path from "node:path";

import { scanOfficeFiles } from "../services/fileScanner";
import { parseExcelFile } from "../services/excel/xlsxParser";
import { parseWordFile } from "../services/word/parsers/docxParser";
import { parsePowerPointFile } from "../services/power_point/parsers/pptxParser";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";

const fileRoutes = new Hono();

fileRoutes.get("/files", async (c) => {
  const dirPath = c.req.query("path") || "example";
  try {
    const files = await scanOfficeFiles(dirPath);
    if (files.length === 0) {
      return successResponse(
        c,
        [],
        `Không tìm thấy file Office nào trong thư mục '${dirPath}'.`
      );
    }
    return successResponse(c, files, `Tìm thấy ${files.length} file.`);
  } catch (error) {
    return errorResponse(c, `Lỗi máy chủ khi quét thư mục '${dirPath}'.`, 500);
  }
});

fileRoutes.get('/files/details', async (c) => {
  const filename = c.req.query('filename');
  const mode = c.req.query('mode') || 'content';

  if (!filename) {
    return errorResponse(c, 'Tên file là bắt buộc.', 400);
  }

  const safeBaseDir = path.resolve('example');
  const safeFilePath = path.join(safeBaseDir, filename);

  if (!safeFilePath.startsWith(safeBaseDir)) {
      return errorResponse(c, 'Truy cập file không hợp lệ.', 403);
  }

  const extension = path.extname(filename).toLowerCase();

  try {
    let data;
    if (mode === 'full') {
      switch (extension) {
        case '.docx':
          data = await parseWordWithFormat(safeFilePath);
          break;
        case '.pptx':
          // Đổi tên hàm cho đồng bộ, nếu bạn muốn dùng WithFormat thì export lại alias
          data = await parsePowerPointFormat(
            new (await import('adm-zip')).default(safeFilePath),
            safeFilePath
          );
          break;
        case '.xlsx':
          return errorResponse(c, `Chức năng phân tích đầy đủ cho ${extension} chưa được cài đặt.`, 501);
        default:
          return errorResponse(c, 'Định dạng file không được hỗ trợ cho chế độ full.', 400);
      }
    } else if (mode === 'content') {
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
          return errorResponse(c, 'Định dạng file không được hỗ trợ.', 400);
      }
    } else {
      return errorResponse(c, `Chế độ (mode) '${mode}' không hợp lệ.`, 400);
    }
    return successResponse(c, { filename, mode, details: data });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
        return errorResponse(c, `File '${filename}' không tồn tại.`, 404);
    }
    return errorResponse(c, error.message || 'Lỗi máy chủ nội bộ.', 500);
  }
});

export default fileRoutes;
