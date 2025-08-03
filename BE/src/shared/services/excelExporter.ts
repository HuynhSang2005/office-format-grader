import ExcelJS from 'exceljs';
import type { ParsedWordData } from '../../types/word/wordFormat.types';
import type { ParsedPowerPointFormatData } from '../../types/power_point/powerpointFormat.types';

// Hàm để tạo một workbook mới với các thuộc tính mặc định
// có thể sử dụng để tạo file Excel mới.
export function createWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Office Format Analyzer';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    return workbook;
}

// Hàm để tạo một worksheet mới với tên cụ thể

export function styleHeaderRow(row: ExcelJS.Row) {
    row.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Màu xanh dương đậm
    };
    row.eachCell(cell => {
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
    });
}

// Thêm hàm để xuất workbook thành buffer
// có thể trả về data Excel dưới dạng Buffer
// để gửi qua HTTP response hoặc lưu vào file.
export async function generateExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const buffer = await workbook.xlsx.writeBuffer();
    // Chuyển đổi ArrayBuffer sang Buffer để tương thích tốt nhất
    return Buffer.from(buffer);
}

/**
 * Chuyển đổi dữ liệu phân tích chi tiết thành một workbook Excel.
 * @param parsedData - Dữ liệu JSON từ wordFormatParser hoặc powerpointFormatParser.
 * @param originalFilename - Tên file gốc.
 * @returns Một đối tượng Workbook của exceljs.
 */
export function exportDetailsToExcel(
    parsedData: ParsedWordData | ParsedPowerPointFormatData,
    originalFilename: string
): ExcelJS.Workbook {
    const workbook = createWorkbook();

    // --- Sheet 1: Tổng quan ---
    const overviewSheet = workbook.addWorksheet('Tổng quan');
    overviewSheet.addRow(['Tên File Gốc', originalFilename]);
    overviewSheet.addRow(['Thời Gian Phân Tích', new Date().toLocaleString()]);

    if ('slideCount' in parsedData) { // Dữ liệu PowerPoint
        overviewSheet.addRow(['Loại File', 'PowerPoint']);
        overviewSheet.addRow(['Tổng số Slide', parsedData.slideCount]);
        overviewSheet.addRow(['Số lượng Media', parsedData.mediaFiles?.length || 0]);
        overviewSheet.addRow(['Tên Theme', parsedData.theme?.name || 'Không xác định']);
    } else { // Dữ liệu Word
        overviewSheet.addRow(['Loại File', 'Word']);
        overviewSheet.addRow(['Tác giả', parsedData.metadata?.author || 'Không xác định']);
        overviewSheet.addRow(['Tổng số trang', parsedData.metadata?.pageCount || 0]);
        overviewSheet.addRow(['Tổng số từ', parsedData.metadata?.wordCount || 0]);
    }
    overviewSheet.getColumn(1).font = { bold: true };
    overviewSheet.getColumn(1).width = 20;
    overviewSheet.getColumn(2).width = 50;

    // --- Sheet 2: Nội dung chi tiết ---
    const detailsSheet = workbook.addWorksheet('Nội dung chi tiết');
    if ('slides' in parsedData) { // PowerPoint
        const headerRow = detailsSheet.addRow(['Slide #', 'Layout', 'Loại Đối Tượng', 'Tên Đối Tượng', 'Nội dung Text']);
        styleHeaderRow(headerRow);

        parsedData.slides.forEach(slide => {
            slide.shapes.forEach(shape => {
                const type =
                    (shape.tableData ? 'Table'
                    : (shape.chartData ? 'Chart' : 'Shape'));
                const textContent = Array.isArray(shape.textRuns)
                    ? shape.textRuns
                        .filter(r => typeof r.text === 'string')
                        .map(r => r.text)
                        .join('')
                    : '';
                detailsSheet.addRow([slide.slideNumber, slide.layout, type, shape.name, textContent]);
            });
        });
    } else { // Word
        const headerRow = detailsSheet.addRow(['Loại Block', 'Nội dung Text', 'Chi tiết Style']);
        styleHeaderRow(headerRow);

        parsedData.content.forEach(block => {
            if ('runs' in block) { // Paragraph
                const textContent = block.runs
                    .filter(r => r.type === 'text')
                    .map(r => (r as any).text || '')
                    .join('');
                const styleDetails = JSON.stringify({ alignment: block.alignment, styleName: block.styleName });
                detailsSheet.addRow(['Paragraph', textContent, styleDetails]);
            } else if ('type' in block && block.type === 'table') { // Table
                detailsSheet.addRow(['Table', `Bảng ${block.rows.length}x${block.rows[0]?.length || 0}`, '']);
            }
        });
    }
    detailsSheet.columns.forEach(column => { column.width = 30; });

    // --- Sheet 3: Tài nguyên ---
    const resourcesSheet = workbook.addWorksheet('Tài nguyên');
    if ('mediaFiles' in parsedData) {
        const headerRow = resourcesSheet.addRow(['Loại', 'Tên File']);
        styleHeaderRow(headerRow);
        parsedData.mediaFiles?.forEach(file => resourcesSheet.addRow(['Media', file]));
    }

    return workbook;
}

/**
 * Tạo file Excel báo cáo kết quả chấm điểm của AI.
 * @param aiResult - Đối tượng JSON chứa kết quả chấm điểm từ AI.
 * @param submissionInfo - Thông tin về bài nộp (tên file, sinh viên...).
 * @returns Một đối tượng Workbook của exceljs.
 */
export function exportGradingResultToExcel(aiResult: any, submissionInfo: any): ExcelJS.Workbook {
    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet('Kết quả chấm điểm');

    // --- Vùng Header của báo cáo ---
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÁO CÁO CHẤM ĐIỂM BẰNG AI';
    titleCell.font = { name: 'Calibri', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.addRow([]); // Dòng trống
    sheet.addRow(['Tên file bài nộp:', submissionInfo.filename]);
    sheet.addRow(['Sinh viên:', submissionInfo.student.name]);
    sheet.addRow(['MSSV:', submissionInfo.student.id]);
    sheet.addRow(['Ngày nộp:', new Date(submissionInfo.submittedAt).toLocaleString()]);

    sheet.getCell('A7').value = 'Tổng điểm:';
    sheet.getCell('B7').value = `${aiResult.totalAchievedScore} / ${aiResult.totalMaxScore}`;
    sheet.getCell('A7').font = { bold: true };
    sheet.getCell('B7').font = { bold: true };

    sheet.addRow([]); // Dòng trống

    // --- Bảng điểm chi tiết ---
    const headerRow = sheet.addRow(['STT', 'Tiêu chí', 'Điểm tối đa', 'Điểm đạt được', 'Lý do / Nhận xét của AI']);
    styleHeaderRow(headerRow);

    aiResult.details.forEach((item: any, index: number) => {
        sheet.addRow([
            index + 1,
            item.criterion,
            item.maxScore,
            item.achievedScore,
            item.reason
        ]);
    });

    // --- Định dạng cột ---
    sheet.getColumn('A').width = 5;
    sheet.getColumn('B').width = 40;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 15;
    sheet.getColumn('E').width = 60;
    sheet.getColumn('E').alignment = { wrapText: true }; // Tự động xuống dòng cho lý do dài

    return workbook;
}