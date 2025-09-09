import { Hono } from "hono";
import { promises as fs } from "fs";
import path from "node:path";
import os from "os";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { formatPowerPointResponse, formatOverviewResponse } from "../services/power_point/formatters/powerPointResponseFormatter";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";

const powerPointRoutes = new Hono();

/**
 * GET /api/powerpoint/analyze
 * Phân tích file PowerPoint và trả về kết quả phân tích chi tiết
 * Query params:
 * - path: đường dẫn đến file PowerPoint
 * - mode: 'full' hoặc 'overview' (default: 'full')
 */
powerPointRoutes.get("/powerpoint/analyze", async (c) => {
  try {
    const filePath = c.req.query("path");
    const mode = c.req.query("mode") || "full";
    
    if (!filePath) {
      return errorResponse(c, "Thiếu tham số 'path' cho file PowerPoint", 400);
    }
    
    // Phân tích file PowerPoint
    const parsedData = await parsePowerPointFormat(filePath);
    
    // Định dạng kết quả theo mode yêu cầu
    if (mode === "overview") {
      return successResponse(c, formatOverviewResponse(parsedData), "Phân tích tổng quan file PowerPoint thành công");
    } else {
      return successResponse(c, formatPowerPointResponse(parsedData), "Phân tích chi tiết file PowerPoint thành công");
    }
  } catch (error: any) {
    return errorResponse(c, `Lỗi khi phân tích file PowerPoint: ${error.message}`, 500);
  }
});

/**
 * POST /api/powerpoint/analyze
 * Phân tích file PowerPoint được upload và trả về kết quả phân tích chi tiết
 * Form data:
 * - file: file PowerPoint
 * Query params:
 * - mode: 'full' hoặc 'overview' (default: 'full')
 */
powerPointRoutes.post("/powerpoint/analyze", async (c) => {
  try {
    const mode = c.req.query("mode") || "full";
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return errorResponse(c, "Không tìm thấy file PowerPoint trong request", 400);
    }
    
    // Tạo một file tạm
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ppt-analyzer-"));
    const tempFilePath = path.join(tempDir, file.name);
    
    // Lưu file vào đường dẫn tạm
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);
    
    try {
      // Phân tích file PowerPoint
      const parsedData = await parsePowerPointFormat(tempFilePath);
      
      // Định dạng kết quả theo mode yêu cầu
      if (mode === "overview") {
        return successResponse(c, formatOverviewResponse(parsedData), "Phân tích tổng quan file PowerPoint thành công");
      } else {
        return successResponse(c, formatPowerPointResponse(parsedData), "Phân tích chi tiết file PowerPoint thành công");
      }
    } finally {
      // Dọn dẹp file tạm
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error: any) {
    return errorResponse(c, `Lỗi khi phân tích file PowerPoint: ${error.message}`, 500);
  }
});

export default powerPointRoutes;
