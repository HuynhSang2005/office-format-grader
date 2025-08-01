import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { gradeSubmissionWithAI } from '../services/aiChecker';
import { parseWordWithFormat } from '../services/word/format/wordFormatParser';
import { parsePowerPointFormat } from '../services/power_point/format/powerpointFormatParser';
import { parseWordFile as parseWordContentOnly } from '../services/word/parsers/docxParser';
import { createSubmissionSummary } from '../services/submissionSummarizer';

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

    // 2. Dùng các parser để lấy dữ liệu thô, chi tiết
    const rubricTextData = await parseWordContentOnly(rubricPath);

    let submissionRawData;
    const submissionExt = path.extname(submissionFile.filename).toLowerCase();

    if (submissionExt === '.docx') {
      submissionRawData = await parseWordWithFormat(submissionPath);
    } else if (submissionExt === '.pptx') {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip(submissionPath);
      submissionRawData = await parsePowerPointFormat(zip, submissionPath);
    } else {
      throw new Error("Định dạng file bài nộp không được hỗ trợ.");
    }

    // 3. Gọi Summarizer để biến đổi dữ liệu
    // Sửa lỗi: ép kiểu type cho submissionExt.slice(1)
    const submissionType = submissionExt === '.docx' ? 'docx' : submissionExt === '.pptx' ? 'pptx' : undefined;
    if (!submissionType) {
      throw new Error("Định dạng file bài nộp không được hỗ trợ.");
    }

    const submissionSummary = createSubmissionSummary(
      [{ filename: submissionFile.filename, type: submissionType, rawData: submissionRawData }],
      { filename: rubricFile.filename, rawData: { paragraphs: rubricTextData?.paragraphs?.join('\n') ?? '' } }
    );

    // 4. Chuẩn bị dữ liệu cho AI và Client
    // Sửa lỗi: kiểm tra undefined trước khi truy cập property
    const summarizedJsonForAI = JSON.stringify(submissionSummary?.submission?.files?.[0]?.format ?? {}, null, 2);
    const rubricTextForAI = submissionSummary?.submission?.rubric?.content ?? '';

    // 5. Gọi AI với dữ liệu đã tóm tắt
    const result = await gradeSubmissionWithAI(rubricTextForAI, summarizedJsonForAI);

    // 6. Trả về kết quả cuối cùng cho client
    return successResponse(
      c,
      { gradingResult: result, submissionDetails: submissionSummary },
      "AI đã hoàn thành việc chấm điểm."
    );

  } catch (error: any) {
    return errorResponse(c, error.message, 500);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

export default aiRoutes;