import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Import các service cần thiết
import { parseWordWithFormat } from '../services/word/wordFormatParser';
import { parsePowerPointWithFormat } from '../services/power_point/powerpointFormatParser';
import { gradeSubmissionWithAI } from '../services/aiChecker';
import { parseWordFile } from '../services/word/docxParser';

const aiRoutes = new Hono();

aiRoutes.post('/ai-checker', async (c) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-checker-'));

  try {
    const { rubricFile, submissionFile } = await c.req.json();

    if (!rubricFile || !submissionFile) {
      return errorResponse(c, "Cần cung cấp đủ rubricFile và submissionFile.", 400);
    }

    // 1. Giải mã Base64 và lưu file tạm
    const rubricBuffer = Buffer.from(rubricFile.content, 'base64');
    const submissionBuffer = Buffer.from(submissionFile.content, 'base64');

    const rubricPath = path.join(tempDir, rubricFile.filename);
    const submissionPath = path.join(tempDir, submissionFile.filename);

    await fs.writeFile(rubricPath, rubricBuffer);
    await fs.writeFile(submissionPath, submissionBuffer);

    // 2. Dùng parser để lấy dữ liệu từ file tạm
    console.log("Đang phân tích file...");
    const rubricTextData = await parseWordFile(rubricPath);
    const rubricText = rubricTextData.paragraphs.join('\n');

    let submissionJson;
    const submissionExt = path.extname(submissionFile.filename).toLowerCase();

    if (submissionExt === '.docx') {
      submissionJson = await parseWordWithFormat(submissionPath);
    } else if (submissionExt === '.pptx') {
      submissionJson = await parsePowerPointWithFormat(submissionPath);
    } else {
      throw new Error("Định dạng file bài nộp không được hỗ trợ.");
    }

    // 3. Gọi service AI để chấm điểm
    const result = await gradeSubmissionWithAI(rubricText, JSON.stringify(submissionJson, null, 2));

    return successResponse(c, result, "AI đã hoàn thành việc chấm điểm.");

  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  } finally {
    // 4. Luôn luôn xóa thư mục tạm sau khi hoàn thành
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

export default aiRoutes;