import { Hono } from "hono";
import path from "node:path";

import { scanOfficeFiles } from "../services/fileScanner";
import { parseExcelFile } from "../services/excel/xlsxParser";
import { parseWordFile } from "../services/word/parsers/docxParser";
import { parsePowerPointFile } from "../services/power_point/parsers/pptxParser";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { exportDetailsToExcel, generateExcelBuffer } from "../shared/services/excelExporter";
import type { ParsedPowerPointFormatData } from "../types/power_point/powerpointFormat.types";
import type { ParsedWordData } from "../types/word/wordFormat.types";

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
    const output = c.req.query('output');

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
        let parsedData;
        if (mode === 'full') {
            switch (extension) {
                case '.docx':
                    parsedData = await parseWordWithFormat(safeFilePath);
                    break;
                case '.pptx':
                    parsedData = await parsePowerPointFormat(
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
                    parsedData = await parseExcelFile(safeFilePath);
                    break;
                case '.docx':
                    parsedData = await parseWordFile(safeFilePath);
                    break;
                case '.pptx':
                    parsedData = await parsePowerPointFile(safeFilePath);
                    break;
                default:
                    return errorResponse(c, 'Định dạng file không được hỗ trợ.', 400);
            }
        } else {
            return errorResponse(c, `Chế độ (mode) '${mode}' không hợp lệ.`, 400);
        }

        // Nếu yêu cầu xuất Excel, chỉ hỗ trợ cho Word hoặc PowerPoint đã phân tích chi tiết (mode=full)
        if (output === 'excel') {
            console.log("Đang tạo file Excel...");
            // Chỉ hỗ trợ xuất Excel cho Word hoặc PowerPoint đã phân tích chi tiết (mode=full)
            if (
                (mode === 'full' && (extension === '.docx' || extension === '.pptx')) &&
                (parsedData && (
                    ('content' in parsedData && Array.isArray(parsedData.content)) || // Word
                    ('slides' in parsedData && Array.isArray(parsedData.slides))     // PowerPoint
                ))
            ) {
                const workbook = exportDetailsToExcel(parsedData as ParsedWordData | ParsedPowerPointFormatData, filename);
                const buffer = await generateExcelBuffer(workbook);

                c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                c.header('Content-Disposition', `attachment; filename="analysis-${filename}.xlsx"`);
                return c.body(buffer);
            } else {
                return errorResponse(
                    c,
                    'Excel export is only supported for Word (.docx) or PowerPoint (.pptx) files in full mode.',
                    400
                );
            }
        }

        // Nếu không có output=excel, trả về JSON như cũ
        return successResponse(c, { filename, mode, details: parsedData });

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return errorResponse(c, `File '${filename}' không tồn tại.`, 404);
        }
        return errorResponse(c, error.message || 'Lỗi máy chủ nội bộ.', 500);
    }
});

export default fileRoutes;
