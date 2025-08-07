import { Hono } from "hono";
import path from "node:path";
import os from "os";
import { promises as fs } from "fs";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { parseWordWithFormat } from "../services/word/format/wordFormatParser";
import { parsePowerPointFormat } from "../services/power_point/format/powerpointFormatParser";
import { createSubmissionSummary } from "../services/submissionSummarizer";

const submissionRoutes = new Hono();

/**
 * POST /api/submission/analyze
 * Nhận file gửi lên (docx, pptx) và rubric (nếu có), phân tích và tạo báo cáo tóm tắt
 * 
 * Form data:
 * - submissionFile: File nộp bài (docx hoặc pptx)
 * - rubricFile: (optional) File rubric
 */
submissionRoutes.post("/submission/analyze", async (c) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "submission-analyzer-"));

  try {
    // Lấy dữ liệu form
    const formData = await c.req.formData();
    const submissionFile = formData.get('submissionFile') as File | null;
    const rubricFile = formData.get('rubricFile') as File | null;

    if (!submissionFile) {
      return errorResponse(c, "Không tìm thấy file nộp bài trong request", 400);
    }

    // Xác định định dạng file
    const extension = path.extname(submissionFile.name).toLowerCase();
    if (extension !== ".docx" && extension !== ".pptx") {
      return errorResponse(c, "Chỉ hỗ trợ định dạng file .docx và .pptx", 400);
    }

    // Lưu file nộp bài vào đường dẫn tạm
    const submissionFilePath = path.join(tempDir, submissionFile.name);
    await fs.writeFile(
      submissionFilePath, 
      Buffer.from(await submissionFile.arrayBuffer())
    );

    // Phân tích file nộp bài
    let parsedSubmissionData;
    let fileType;
    
    if (extension === ".docx") {
      parsedSubmissionData = await parseWordWithFormat(submissionFilePath);
      fileType = "docx";
    } else {
      parsedSubmissionData = await parsePowerPointFormat(submissionFilePath);
      fileType = "pptx";
    }

    // Dữ liệu rubric (nếu có)
    let parsedRubricData;
    let rubricFilePath;

    if (rubricFile) {
      rubricFilePath = path.join(tempDir, rubricFile.name);
      await fs.writeFile(
        rubricFilePath, 
        Buffer.from(await rubricFile.arrayBuffer())
      );

      // Đơn giản hóa: coi như rubric là văn bản có cấu trúc đơn giản
      parsedRubricData = {
        paragraphs: ["Rubric content would be parsed here"]
      };
    }

    // Tạo báo cáo tóm tắt
    const submissionSummary = createSubmissionSummary(
      [{ 
        filename: submissionFile.name, 
        type: fileType as 'docx' | 'pptx', 
        rawData: parsedSubmissionData 
      }],
      rubricFile ? { 
        filename: rubricFile.name, 
        rawData: parsedRubricData 
      } : undefined
    );

    return successResponse(
      c, 
      submissionSummary, 
      "Phân tích file nộp bài thành công"
    );
  } catch (error: any) {
    return errorResponse(c, `Lỗi khi phân tích file: ${error.message}`, 500);
  } finally {
    // Dọn dẹp thư mục tạm
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`Đã dọn dẹp thư mục tạm: ${tempDir}`);
  }
});

export default submissionRoutes;
