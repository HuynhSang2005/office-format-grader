import { Hono } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { sanitizeFilename } from '../services/shared/sanitizeFilename';

// Import các service cần thiết
import { gradePptxManually } from '../services/manual_rubric/manualGrader.service';
import { parsePowerPointFormat } from '../services/power_point/format/powerpointFormatParser';
import { exportDetailsToExcel, generateExcelBuffer } from '../shared/excelExporter';
import { convertToNewFormat } from '../helpers/gradingResultHelper';
import { getRubric } from '../utils/powerpointRubric';


const manualGraderRoutes = new Hono();

/**
 * API chấm điểm thủ công file PowerPoint
 * Yêu cầu: File .pptx để chấm điểm
 * Tham số query:
 *  - output: Định dạng đầu ra (mặc định json, hoặc 'excel' để xuất file Excel)
 *  - format: Định dạng kết quả (mặc định 'standard', hoặc 'detailed' để trả về kết quả chi tiết hơn)
 */
manualGraderRoutes.post('/manual-checker', async (c) => {
    const { output, format } = c.req.query();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-manual-checker-'));

    try {
        const formData = await c.req.formData();
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!submissionFile) {
            return errorResponse(c, "Cần cung cấp file bài nộp (submissionFile).", 400);
        }

        // 1. Lưu file tạm
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
        await fs.writeFile(submissionPath, submissionBuffer);

        // 2. Phân tích file để lấy dữ liệu JSON chi tiết
        // Hiện tại chỉ hỗ trợ pptx, có thể mở rộng cho docx sau
        const extension = path.extname(submissionFile.name).toLowerCase();
        if (extension !== '.pptx') {
            throw new Error("Chức năng này hiện chỉ hỗ trợ file .pptx");
        }

        // Đảm bảo tham số đúng - chỉ truyền filePath
        const parsedData = await parsePowerPointFormat(submissionPath);

        // 3. Gọi service chấm điểm thủ công
        const gradingResult = await gradePptxManually(parsedData);

        // 4. Xử lý output
        if (output === 'excel') {
            // Cập nhật tạo file Excel với thông tin chi tiết
            const workbook = exportDetailsToExcel(gradingResult, parsedData, submissionFile.name);
            const buffer = await generateExcelBuffer(workbook);

            c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            const safeFilename = sanitizeFilename(submissionFile.name);
            c.header('Content-Disposition', `attachment; filename="manual-report-${safeFilename}.xlsx"`);
            return c.body(buffer);
        }

        // 5. Trả về kết quả JSON theo format yêu cầu
        if (format === 'detailed') {
            // Cung cấp kết quả chi tiết với định dạng mới
            const detailedResult = {
                result: convertToNewFormat(gradingResult),
                parsedData: {
                    fileName: parsedData.fileName,
                    slideCount: parsedData.slides?.length || 0,
                    // Chỉ trả về thông tin cơ bản, không bao gồm toàn bộ nội dung slides để giảm kích thước response
                    metadata: {
                        title: parsedData.documentProperties?.title || '',
                        author: parsedData.documentProperties?.creator || '',
                        company: parsedData.documentProperties?.company || '',
                        createdAt: parsedData.documentProperties?.created || '',
                        modifiedAt: parsedData.documentProperties?.modified || ''
                    }
                },
                rubric: getRubric()
            };
            return successResponse(c, detailedResult, "Đã hoàn thành chấm điểm thủ công với kết quả chi tiết.");
        }

        // Mặc định trả về định dạng standard
        return successResponse(c, gradingResult, "Đã hoàn thành chấm điểm thủ công.");
    } catch (error: any) {
        console.error("Error in manual grader:", error);
        return errorResponse(c, `Lỗi khi chấm điểm: ${error.message}`, 500);
    } finally {
        // Xóa thư mục tạm sau khi xử lý xong
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.error("Không thể xóa thư mục tạm:", error);
        }
    }
});

/**
 * API lấy thông tin rubric hiện tại
 */
manualGraderRoutes.get('/rubric', async (c) => {
    try {
        const rubric = getRubric();
        return successResponse(c, { rubric }, "Lấy rubric thành công.");
    } catch (error: any) {
        return errorResponse(c, `Không thể lấy thông tin rubric: ${error.message}`, 500);
    }
});

/**
 * API phân tích file mà không chấm điểm
 * Phục vụ cho mục đích debug và phát triển
 */
manualGraderRoutes.post('/analyze-only', async (c) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-analyzer-'));

    try {
        const formData = await c.req.formData();
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!submissionFile) {
            return errorResponse(c, "Cần cung cấp file để phân tích (submissionFile).", 400);
        }

        // Lưu file tạm
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
        await fs.writeFile(submissionPath, submissionBuffer);

        // Phân tích file để lấy dữ liệu JSON chi tiết
        const extension = path.extname(submissionFile.name).toLowerCase();
        if (extension !== '.pptx') {
            throw new Error("Chức năng này hiện chỉ hỗ trợ file .pptx");
        }

        const parsedData = await parsePowerPointFormat(submissionPath);
        
        // Tùy chọn: Loại bỏ một số thông tin không cần thiết để giảm kích thước response
        const simplifiedData = {
            fileName: parsedData.fileName,
            documentProperties: parsedData.documentProperties,
            slideCount: parsedData.slides?.length || 0,
            slideInfo: parsedData.slides?.map(slide => ({
                slideNumber: slide.slideNumber,
                layout: slide.layout,
                hasTransition: !!slide.transition,
                objectCount: slide.shapes?.length || 0,
                displayInfo: slide.displayInfo
            }))
        };

        return successResponse(c, { parsedData: simplifiedData }, "Đã phân tích file thành công.");
    } catch (error: any) {
        return errorResponse(c, `Lỗi khi phân tích: ${error.message}`, 500);
    } finally {
        // Xóa thư mục tạm sau khi xử lý xong
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.error("Không thể xóa thư mục tạm:", error);
        }
    }
});

/**
 * API đánh giá một tiêu chí cụ thể
 * Cho phép chấm điểm chỉ một tiêu chí thay vì toàn bộ
 */
manualGraderRoutes.post('/check-criterion/:criterionId', async (c) => {
    const criterionId = c.req.param('criterionId');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'office-criterion-checker-'));

    try {
        const formData = await c.req.formData();
        const submissionFile = formData.get('submissionFile') as File | null;

        if (!submissionFile) {
            return errorResponse(c, "Cần cung cấp file bài nộp (submissionFile).", 400);
        }

        // Lưu file tạm
        const submissionBuffer = Buffer.from(await submissionFile.arrayBuffer());
        const submissionPath = path.join(tempDir, sanitizeFilename(submissionFile.name));
        await fs.writeFile(submissionPath, submissionBuffer);

        // Phân tích file
        const extension = path.extname(submissionFile.name).toLowerCase();
        if (extension !== '.pptx') {
            throw new Error("Chức năng này hiện chỉ hỗ trợ file .pptx");
        }

        const parsedData = await parsePowerPointFormat(submissionPath);

        // Import checker modules dynamically
        const checkers = await import('../services/manual_rubric/criteriaCheckers');

        // Map criterionId to checker function
        const checkerMap: Record<string, any> = {
            'filename': checkers.checkFilename,
            'headerFooter': checkers.checkHeaderFooter,
            'transitions': checkers.checkTransitions,
            'objects': checkers.checkObjects,
            'slideMaster': checkers.checkSlideMaster,
            'themes': checkers.checkThemes,
            'hyperlink': checkers.checkHyperlink,
            'animations': checkers.checkAnimations,
            'slidesFromOutline': checkers.checkSlidesFromOutline,
            'creativity': checkers.checkCreativity
        };

        const checker = checkerMap[criterionId];
        if (!checker) {
            return errorResponse(c, `Không tìm thấy checker cho tiêu chí ${criterionId}`, 400);
        }

        // Chấm điểm tiêu chí cụ thể
        const result = checker(parsedData);
        return successResponse(c, result, `Đã chấm điểm tiêu chí ${criterionId} thành công.`);
    } catch (error: any) {
        return errorResponse(c, `Lỗi khi chấm điểm tiêu chí: ${error.message}`, 500);
    } finally {
        // Xóa thư mục tạm sau khi xử lý xong
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.error("Không thể xóa thư mục tạm:", error);
        }
    }
});

export default manualGraderRoutes;