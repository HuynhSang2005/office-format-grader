import { Hono } from "hono";
import path from "node:path";
import os from "os";
import { promises as fs } from "fs";

import { scanOfficeFiles } from "../services/fileScanner";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { parseExcelFile } from "../services/excel/xlsxParser";
import { parseWordFile } from "../services/word/parsers/docxParser";
import { parsePowerPointFile } from "../services/power_point/parsers/pptxParser";
import { parseExcelFile as parseExcelContentOnly } from "../services/excel/xlsxParser";
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
        // PowerPoint cần truyền zip object và path
        const AdmZip = (await import("adm-zip")).default;
        parsedData = await parsePowerPointFormat(new AdmZip(tempFilePath), tempFilePath);
      } else if (extension === ".xlsx") {
        parsedData = await parseExcelFile(tempFilePath);
      } else {
        throw new Error(`Định dạng file ${extension} không được hỗ trợ.`);
      }
    } else if (mode === "content") {
      if (extension === ".docx") {
        parsedData = await parseWordFile(tempFilePath);
      } else if (extension === ".pptx") {
        parsedData = await parsePowerPointFile(tempFilePath);
      } else if (extension === ".xlsx") {
        parsedData = await parseExcelContentOnly(tempFilePath);
      } else {
        throw new Error(`Định dạng file ${extension} không được hỗ trợ.`);
      }
    } else {
      throw new Error("Chế độ không hợp lệ. Chỉ hỗ trợ 'full' hoặc 'content'.");
    }

    // 4. Xử lý định dạng output
    if (output === "excel") {
      if (extension === ".docx") {
        // parsedData chắc chắn là ParsedWordData
        const workbook = exportDetailsToExcel(parsedData as any, file.filename);
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
      } else if (extension === ".pptx") {
        // parsedData chắc chắn là ParsedPowerPointFormatData
        const workbook = exportDetailsToExcel(parsedData as any, file.filename);
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
      } else if (extension === ".xlsx") {
        // Chưa hỗ trợ xuất lại Excel cho file Excel
        return errorResponse(c, "Export to Excel is not supported for Excel files.", 400);
      }
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
