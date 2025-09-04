import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import mammoth from "mammoth";

import { gradeSubmissionWithAI } from '../services/aiChecker';
import { parseWordWithFormat } from '../services/word/format/wordFormatParser';
import { parsePowerPointFormat } from '../services/power_point/format/powerpointFormatParser';
import { createSubmissionSummary } from '../services/submissionSummarizer';
import { sanitizeFilename } from '../services/shared/sanitizeFilename';
import { exportDetailsToExcel, generateExcelBuffer } from '../shared/excelExporter';

const aiRoutes = new Hono();

aiRoutes.post('/ai-checker', async (c) => {
    const { output } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-checker-'));

    try {
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

        const rubricPath = path.join(tempDir, sanitizeFilename(rubricFile.name));
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));

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
            try {
                submissionRawData = await parsePowerPointFormat(submissionPath);
            } catch (err: any) {
                return errorResponse(
                    c, 
                    "Không thể phân tích file PowerPoint: " + (err.message || err), 
                    400
                );
            }
        } else {
            throw new Error("Định dạng file bài nộp không được hỗ trợ.");
        }

        // 3. Gọi Summarizer để biến đổi dữ liệu
        const submissionType = submissionExt === '.docx' ? 'docx' : submissionExt === '.pptx' ? 'pptx' : undefined;
        if (!submissionType) {
            throw new Error("Định dạng file bài nộp không được hỗ trợ.");
        }

        // Đọc nội dung file rubric thành plain text
        let rubricText = '';
        try {
            const { value } = await mammoth.extractRawText({ path: rubricPath });
            rubricText = value;
        } catch (err: any) {
            return errorResponse(c, "Không thể đọc nội dung file Word: " + (err.message || err), 400);
        }

        const submissionSummary = createSubmissionSummary(
            [{ filename: submissionFile.name, type: submissionType, rawData: submissionRawData }],
            { filename: rubricFile.name, rawData: { paragraphs: rubricText } }
        );

        // 4. Chuẩn bị dữ liệu cho AI và Client
        const summarizedJsonForAI = JSON.stringify(submissionSummary?.submission?.files?.[0]?.format ?? {}, null, 2);
        const rubricTextForAI = rubricText;

        // 5. Gọi AI với dữ liệu đã tóm tắt
        const aiResult = await gradeSubmissionWithAI(rubricTextForAI, summarizedJsonForAI);

        // 6. Nếu yêu cầu xuất Excel, tạo file Excel với kết quả chấm điểm
        if (output === 'excel') {
            console.log("Đang tạo file báo cáo Excel...");
            
            // Lấy thông tin sinh viên từ summary nếu có
            const studentId = submissionSummary?.submission?.student?.id || 'Unknown';
            const studentName = submissionSummary?.submission?.student?.name || 'Unknown';
            
            // Sử dụng hàm exportDetailsToExcel thay vì exportGradingResultToExcel
            const workbook = exportDetailsToExcel(
                aiResult, 
                submissionRawData,  // Truyền dữ liệu gốc đã parse
                `${studentName} (${studentId}) - ${submissionFile.name}`  // Tên file với thông tin học sinh
            );
            
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
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Lỗi khi dọn dẹp thư mục tạm:", cleanupError);
        }
    }
});

/**
 * API lấy tóm tắt file để hiển thị
 * Không chấm điểm, chỉ phân tích và tóm tắt
 */
aiRoutes.post('/summarize-submission', async (c) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-summarizer-'));

    try {
        // 1. Lấy dữ liệu form-data
        const formData = await c.req.formData();
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!submissionFile) {
            return errorResponse(c, "Cần cung cấp file submissionFile.", 400);
        }

        // 2. Lấy buffer và lưu file tạm
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
        await fs.writeFile(submissionPath, submissionBuffer);

        // 3. Phân tích file
        let submissionRawData;
        const submissionExt = path.extname(submissionFile.name).toLowerCase();

        if (submissionExt === '.docx') {
            submissionRawData = await parseWordWithFormat(submissionPath);
        } else if (submissionExt === '.pptx') {
            submissionRawData = await parsePowerPointFormat(submissionPath);
        } else {
            throw new Error("Định dạng file không được hỗ trợ. Hỗ trợ: .docx, .pptx");
        }

        // 4. Tạo summary
        const submissionType = submissionExt === '.docx' ? 'docx' : 'pptx';
        
        // Sửa lỗi: Thay null bằng một đối tượng có cấu trúc đúng nhưng với nội dung trống
        const emptyRubric = { filename: '', rawData: { paragraphs: '' } };
        
        const submissionSummary = createSubmissionSummary(
            [{ filename: submissionFile.name, type: submissionType, rawData: submissionRawData }],
            emptyRubric
        );

        return successResponse(
            c,
            { summary: submissionSummary },
            "Đã tóm tắt nội dung file thành công."
        );

    } catch (error: any) {
        return errorResponse(c, error.message, 500);
    } finally {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Lỗi khi dọn dẹp thư mục tạm:", cleanupError);
        }
    }
});

/**
 * API cung cấp thông tin định dạng từ file
 * Trả về dữ liệu thô để hiển thị trong dashboard
 */
aiRoutes.post('/extract-format', async (c) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-extractor-'));

    try {
        // 1. Lấy dữ liệu form-data
        const formData = await c.req.formData();
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!submissionFile) {
            return errorResponse(c, "Cần cung cấp file submissionFile.", 400);
        }

        // 2. Lấy buffer và lưu file tạm
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
        await fs.writeFile(submissionPath, submissionBuffer);

        // 3. Phân tích file
        let formatData;
        const submissionExt = path.extname(submissionFile.name).toLowerCase();

        if (submissionExt === '.docx') {
            formatData = await parseWordWithFormat(submissionPath);
        } else if (submissionExt === '.pptx') {
            formatData = await parsePowerPointFormat(submissionPath);
        } else {
            throw new Error("Định dạng file không được hỗ trợ. Hỗ trợ: .docx, .pptx");
        }

        // 4. Trả về dữ liệu thô
        return successResponse(
            c,
            { 
                fileType: submissionExt.replace('.', ''),
                formatData
            },
            "Đã trích xuất thông tin định dạng thành công."
        );

    } catch (error: any) {
        return errorResponse(c, error.message, 500);
    } finally {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Lỗi khi dọn dẹp thư mục tạm:", cleanupError);
        }
    }
});

export default aiRoutes;