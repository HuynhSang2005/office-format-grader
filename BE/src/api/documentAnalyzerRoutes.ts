import { Hono } from "hono";
import path from "node:path";
import os from "os";
import { promises as fs } from "fs";
import { sanitizeFilename } from '../services/shared/sanitizeFilename'; 
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
} from "../shared/excelExporter";

const documentAnalyzerRoutes = new Hono();

/**
 * API endpoint để quét và phân tích các file Office trong một thư mục
 * GET /api/files?path=example
 * 
 * Trả về danh sách các file Office trong thư mục được chỉ định
 */

documentAnalyzerRoutes.get("/files", async (c) => {
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

documentAnalyzerRoutes.post("/files/details", async (c) => {
  const { mode = "full", output } = c.req.query();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-analyzer-"));

  try {
    // 1. Nhận payload chứa file từ client qua multipart/form-data
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
            return errorResponse(c, "Không tìm thấy file nào trong request.", 400);
        }

    // 2. Lưu dữ liệu từ multipart form vào file tạm
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(tempDir, file.name);
    await fs.writeFile(tempFilePath, fileBuffer);

    // 3. Gọi parser phù hợp dựa trên đuôi file
    let parsedData;
        const extension = path.extname(file.name).toLowerCase();

    if (mode === "full") {
      if (extension === ".docx") {
        parsedData = await parseWordWithFormat(tempFilePath);
      } else if (extension === ".pptx") {
        // PowerPoint chỉ cần truyền path
        parsedData = await parsePowerPointFormat(tempFilePath);
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
        // Tạo một GradingResult rỗng để phù hợp với signature của exportDetailsToExcel
        const emptyGradingResult = { 
          totalAchievedScore: 0, 
          totalMaxScore: 0, 
          details: [] 
        };
        const workbook = exportDetailsToExcel(emptyGradingResult, parsedData as any, file.name);
        const buffer = await generateExcelBuffer(workbook);

        c.header(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        c.header(
          "Content-Disposition",
          `attachment; filename="${sanitizeFilename(`analysis-${file.name}.xlsx`)}"`
        );
        
        return c.body(buffer);
      } else if (extension === ".pptx") {
        // parsedData chắc chắn là ParsedPowerPointFormatData
        // Tạo một GradingResult rỗng để phù hợp với signature của exportDetailsToExcel
        const emptyGradingResult = { 
          totalAchievedScore: 0, 
          totalMaxScore: 0, 
          details: [] 
        };
        const workbook = exportDetailsToExcel(emptyGradingResult, parsedData as any, file.name);
        const buffer = await generateExcelBuffer(workbook);

        c.header(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        c.header(
          "Content-Disposition",
          `attachment; filename="${sanitizeFilename(`analysis-${file.name}.xlsx`)}"`
        );
        return c.body(buffer);
      } else if (extension === ".xlsx") {
        // Chưa hỗ trợ xuất lại Excel cho file Excel
        return errorResponse(c, "Export to Excel is not supported for Excel files.", 400);
      }
    } else {
      // Mặc định trả về JSON
      return successResponse(c, {
        filename: file.name,
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

export default documentAnalyzerRoutes;
