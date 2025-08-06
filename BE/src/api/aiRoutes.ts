import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { gradeSubmissionWithAI } from '../services/aiChecker';
import { parseWordWithFormat } from '../services/word/format/wordFormatParser';
import { parsePowerPointFormat } from '../services/power_point/format/powerpointFormatParser';
// import { parseWordFile as parseWordContentOnly } from '../services/word/parsers/docxParser';
import { createSubmissionSummary } from '../services/submissionSummarizer';
import { sanitizeFilename } from '../services/shared/sanitizeFilename';
import { exportGradingResultToExcel, generateExcelBuffer } from '../shared/services/excelExporter';

const aiRoutes = new Hono();

aiRoutes.post('/ai-checker', async (c) => {
    const { output } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-checker-'));

    try {
        // --- THAY ĐỔI CHÍNH BẮT ĐẦU TỪ ĐÂY ---
        // 1. Lấy dữ liệu form-data
        const formData = await c.req.formData();
        const rubricFile = formData.get('rubricFile') as File | null;
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!rubricFile || !submissionFile) {
            return errorResponse(c, "Cần cung cấp đủ rubricFile và submissionFile.", 400);
        }

        // 2. Lấy buffer và lưu file tạm
        const rubricBuffer = Buffer.from(await rubricFile.arrayBuffer());
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());

        const rubricPath = path.join(tempDir, rubricFile.name);
        const submissionPath = path.join(tempDir, submissionFile.name);

        await fs.writeFile(rubricPath, rubricBuffer);
        await fs.writeFile(submissionPath, submissionBuffer);

        // 2. Dùng các parser để lấy dữ liệu thô, chi tiết
        let rubricTextData;
        try {
            rubricTextData = await parseWordWithFormat(rubricPath);
        } catch (err: any) {
            return errorResponse(c, "Không thể phân tích file Word: " + (err.message || err), 400);
        }

        let submissionRawData;
        const submissionExt = path.extname(submissionFile.name).toLowerCase();

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
        const submissionType = submissionExt === '.docx' ? 'docx' : submissionExt === '.pptx' ? 'pptx' : undefined;
        if (!submissionType) {
            throw new Error("Định dạng file bài nộp không được hỗ trợ.");
        }

        const rubricText =
            rubricTextData.content
                .filter((block: any) => 'runs' in block)
                .map((block: any) => block.runs.filter((r: any) => r.type === 'text').map((r: any) => r.text).join(''))
                .join('\n');

        const submissionSummary = createSubmissionSummary(
            [{ filename: submissionFile.name, type: submissionType, rawData: submissionRawData }],
            { filename: rubricFile.name, rawData: { paragraphs: rubricText } }
        );

        // 4. Chuẩn bị dữ liệu cho AI và Client
        const summarizedJsonForAI = JSON.stringify(submissionSummary?.submission?.files?.[0]?.format ?? {}, null, 2);
        const rubricTextForAI = submissionSummary?.submission?.rubric?.content ?? '';

        // 5. Gọi AI với dữ liệu đã tóm tắt
        const aiResult = await gradeSubmissionWithAI(rubricTextForAI, summarizedJsonForAI);

        // 6. Nếu yêu cầu xuất Excel, tạo file Excel với kết quả chấm điểm
        if (output === 'excel') {
            console.log("Đang tạo file báo cáo Excel...");
            // Lấy thông tin sinh viên từ summary nếu có
            const submissionInfo = {
                filename: submissionFile.name,
                student: {
                    id: submissionSummary?.submission?.student?.id || 'Unknown',
                    name: submissionSummary?.submission?.student?.name || 'Unknown',
                },
                submittedAt: submissionSummary?.submission?.submittedAt || new Date().toISOString()
            };
            const workbook = exportGradingResultToExcel(aiResult, submissionInfo);
            const buffer = await generateExcelBuffer(workbook);

            c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            c.header(
                'Content-Disposition',
                `attachment; filename="${sanitizeFilename(`grading-report-${submissionFile.name}.xlsx`)}"`
            );
            return c.body(buffer);
        }

        // Nếu không có output=excel, trả về JSON như cũ
        return successResponse(
            c,
            { gradingResult: aiResult, submissionDetails: submissionSummary },
            "AI đã hoàn thành việc chấm điểm."
        );

    } catch (error: any) {
        return errorResponse(c, error.message, 500);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

export default aiRoutes;