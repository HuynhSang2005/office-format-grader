import { Hono } from "hono";
import path from "node:path";
import os from "os";
import { promises as fs } from "fs";

import { scanOfficeFiles } from "../services/fileScanner";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import {
  exportDetailsToExcel,
  generateExcelBuffer,
} from "../shared/services/excelExporter";

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

/**
 * Route này nhận một file được upload (mã hóa base64),
 * phân tích nó ở chế độ 'full' hoặc 'content',
 * và trả về kết quả dưới dạng JSON hoặc file Excel.
 */
fileRoutes.post("/files/details", async (c) => {
  const { mode = "full", output } = c.req.query();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-analyzer-"));

  try {
    // 1. Nhận payload chứa file từ client
    const { file } = await c.req.json();
    if (!file || !file.filename || !file.content) {
      return errorResponse(c, "Dữ liệu file tải lên không hợp lệ.", 400);
    }

    // 2. Giải mã Base64 và lưu vào file tạm
    const fileBuffer = Buffer.from(file.content, "base64");
    const tempFilePath = path.join(tempDir, file.filename);
    await fs.writeFile(tempFilePath, fileBuffer);

    // 3. Gọi parser phù hợp dựa trên đuôi file
    let parsedData;
    const extension = path.extname(file.filename).toLowerCase();

    if (mode === "full") {
      if (extension === ".docx") {
        parsedData = await parseWordWithFormat(tempFilePath);
      } else if (extension === ".pptx") {
        parsedData = await parsePowerPointFormat(
          new (
            await import("adm-zip")
          ).default(tempFilePath),
          tempFilePath
        );
      } else {
        throw new Error(`Định dạng file ${extension} không được hỗ trợ.`);
      }
    } else {
      // mode === 'content'
      // TODO: Thêm logic gọi các parser content-only nếu cần
      throw new Error(
        "Chế độ 'content' chưa được triển khai cho việc upload file."
      );
    }

    // 4. Xử lý định dạng output
    if (output === "excel") {
      const workbook = exportDetailsToExcel(parsedData, file.filename);
      const buffer = await generateExcelBuffer(workbook);

      c.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      c.header(
        "Content-Disposition",
        `attachment; filename="analysis-${file.filename}.xlsx"`
      );
      return c.body(buffer);
    } else {
      // Mặc định trả về JSON
      return successResponse(c, {
        filename: file.filename,
        mode,
        details: parsedData,
      });
    }
  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  } finally {
    // 5. Luôn luôn dọn dẹp thư mục tạm sau khi xử lý xong
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`Đã dọn dẹp thư mục tạm: ${tempDir}`);
  }
});

export default fileRoutes;
