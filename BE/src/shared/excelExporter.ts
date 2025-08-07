import ExcelJS from 'exceljs';
import { isTextRun } from '../types/word/guards/wordGuards';
import type { ParsedWordData, Paragraph, Table, TableCell, TextRun, Drawing } from '../types/word/wordFormat.types';
import type { 
    ParsedPowerPointFormatData, 
    FormattedSlide, 
    Shape,
    FormattedTextRun 
} from '../types/power_point';

import type { GradingResult } from "../types/grading.types";

export function createWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Office Format Analyzer';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    return workbook;
}

export function styleHeaderRow(row: ExcelJS.Row): void {
    row.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    row.eachCell(cell => {
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
    });
}

export async function generateExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export function exportDetailsToExcel(
    gradingResult: GradingResult,
    parsedData: ParsedPowerPointFormatData | ParsedWordData,
    originalFilename: string
): ExcelJS.Workbook {
    const workbook = createWorkbook();

    // --- Sheet 1: Tổng quan ---
    const overviewSheet = workbook.addWorksheet('Tổng quan');
    overviewSheet.addRow(['Tên File Gốc', originalFilename]);
    overviewSheet.addRow(['Thời Gian Phân Tích', new Date().toLocaleString()]);

    // Phân biệt giữa PowerPoint và Word sử dụng type guard
    const isPowerPoint = 'slideCount' in parsedData;
    
    if (isPowerPoint) {
        // Xử lý dữ liệu PowerPoint
        const pptxData = parsedData as ParsedPowerPointFormatData;
        
        overviewSheet.addRow(['Loại File', 'PowerPoint']);
        overviewSheet.addRow(['Tổng số Slide', pptxData.slideCount]);
        
        // Sử dụng optional chaining và kiểm tra tồn tại của mediaFiles
        const mediaFilesCount = pptxData.mediaFiles?.length || 0;
        overviewSheet.addRow(['Số lượng Media', mediaFilesCount]);
        
        overviewSheet.addRow(['Tên Theme', pptxData.theme?.name || 'Không xác định']);
    } else {
        // Xử lý dữ liệu Word
        const wordData = parsedData as ParsedWordData;
        
        overviewSheet.addRow(['Loại File', 'Word']);
        overviewSheet.addRow(['Tác giả', wordData.metadata?.author || 'Không xác định']);
        overviewSheet.addRow(['Tổng số trang', wordData.metadata?.pageCount || 0]);
        overviewSheet.addRow(['Tổng số từ', wordData.metadata?.wordCount || 0]);
    }
    
    overviewSheet.getColumn(1).font = { bold: true };
    overviewSheet.getColumn(1).width = 20;
    overviewSheet.getColumn(2).width = 50;

    // --- Sheet 2: Kết quả chấm điểm ---
    const gradingSheet = workbook.addWorksheet('Kết quả chấm điểm');
    const gradingHeader = gradingSheet.addRow(['Tiêu chí', 'Điểm tối đa', 'Điểm đạt', 'Lý do/Nhận xét']);
    styleHeaderRow(gradingHeader);

    gradingResult.details.forEach((detail) => {
        gradingSheet.addRow([
            detail.criterion,
            detail.maxScore,
            detail.achievedScore,
            detail.reason
        ]);
    });

    // Thêm dòng tổng điểm
    const totalRow = gradingSheet.addRow([
        'TỔNG ĐIỂM',
        gradingResult.totalMaxScore,
        gradingResult.totalAchievedScore,
        `Đạt ${Math.round((gradingResult.totalAchievedScore / gradingResult.totalMaxScore) * 100)}%`
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEBF7' }
    };

    gradingSheet.getColumn(1).width = 40;
    gradingSheet.getColumn(2).width = 15;
    gradingSheet.getColumn(3).width = 15;
    gradingSheet.getColumn(4).width = 70;

    // --- Sheet chi tiết ---
    if (isPowerPoint && 'slides' in parsedData && Array.isArray(parsedData.slides)) {
        const pptxData = parsedData as ParsedPowerPointFormatData;
        const slides = pptxData.slides as FormattedSlide[];
        
        // Sheet 3: Cấu trúc Slide
        const slidesSheet = workbook.addWorksheet('Cấu trúc Slide');
        const slidesHeader = slidesSheet.addRow(['Slide #', 'Layout', 'Ghi chú (Notes)', 'Hiệu ứng Transition', 'Có Âm thanh']);
        styleHeaderRow(slidesHeader);
        
        slides.forEach((slide: FormattedSlide) => {
            slidesSheet.addRow([
                slide.slideNumber,
                slide.layout,
                slide.notes,
                slide.transition?.type,
                slide.transition?.sound?.name,
            ]);
        });
        slidesSheet.columns.forEach(c => { c.width = 25; });

        // Sheet 4: Chi tiết Text & Format
        const textSheet = workbook.addWorksheet('Chi tiết Text');
        const textHeader = textSheet.addRow(['Slide #', 'Shape ID', 'Shape Name', 'Loại Run', 'Nội dung', 'Font', 'Size', 'Bold', 'Italic', 'Color', 'Hyperlink']);
        styleHeaderRow(textHeader);
        
        slides.forEach((slide: FormattedSlide) => {
            if (Array.isArray(slide.shapes)) {
                slide.shapes.forEach((shape: Shape) => {
                    if (Array.isArray(shape.textRuns)) {
                        shape.textRuns.forEach((run: FormattedTextRun) => {
                            // Nếu run là FormattedTextRun (có thuộc tính text)
                            textSheet.addRow([
                                slide.slideNumber, 
                                shape.id, 
                                shape.name, 
                                'Text',
                                run.text, 
                                run.font, 
                                run.size, 
                                run.isBold, 
                                run.isItalic, 
                                run.color, 
                                run.hyperlink
                            ]);
                        });
                    }
                });
            }
        });
        textSheet.columns.forEach(c => { c.width = 20; });
    } else if (!isPowerPoint && 'content' in parsedData && Array.isArray(parsedData.content)) {
        const wordData = parsedData as ParsedWordData;
        const content = wordData.content;
        
        // Sheet 3: Paragraphs & Text Runs
        const contentSheet = workbook.addWorksheet('Paragraphs & Text Runs');
        const contentHeader = contentSheet.addRow(['Block #', 'Loại Block', 'Nội dung Text', 'Style', 'Căn lề', 'Font', 'Size', 'Bold', 'Italic', 'Color', 'Hyperlink']);
        styleHeaderRow(contentHeader);
        
        content.forEach((block: Paragraph | Table, index: number) => {
            if ('runs' in block && Array.isArray(block.runs)) {
                if (block.runs.length === 0) {
                    contentSheet.addRow([index + 1, 'Paragraph', '', block.styleName, block.alignment]);
                } else {
                    block.runs.forEach((run: TextRun | Drawing, runIndex: number) => {
                        if (isTextRun(run)) {
                            contentSheet.addRow([
                                runIndex === 0 ? index + 1 : '',
                                runIndex === 0 ? 'Paragraph' : '',
                                run.text,
                                runIndex === 0 ? block.styleName : '',
                                runIndex === 0 ? block.alignment : '',
                                run.font, run.size, run.isBold, run.isItalic, run.color, run.hyperlink
                            ]);
                        }
                    });
                }
            }
        });
        contentSheet.columns.forEach(c => { c.width = 20; });

        // Sheet 4: Tables
        const tablesSheet = workbook.addWorksheet('Tables');
        const tablesHeader = tablesSheet.addRow(['Block #', 'Row #', 'Cell #', 'Nội dung Cell']);
        styleHeaderRow(tablesHeader);
        
        content.forEach((block: Paragraph | Table, index: number) => {
            if ('type' in block && block.type === 'table' && Array.isArray(block.rows)) {
                block.rows.forEach((row: TableCell[], rowIndex: number) => {
                    row.forEach((cell: TableCell, cellIndex: number) => {
                        const cellText = Array.isArray(cell.content)
                            ? cell.content
                                .map((p: Paragraph) =>
                                    Array.isArray(p.runs)
                                        ? p.runs
                                            .filter(isTextRun)
                                            .map((r: TextRun) => r.text)
                                            .join('')
                                        : ''
                                )
                                .join('\n')
                            : '';
                        tablesSheet.addRow([index + 1, rowIndex + 1, cellIndex + 1, cellText]);
                    });
                });
            }
        });
    }

    // --- Sheet cuối: Tài nguyên ---
    const resourcesSheet = workbook.addWorksheet('Tài nguyên');
    
    if (isPowerPoint && 'mediaFiles' in parsedData && Array.isArray(parsedData.mediaFiles)) {
        const pptxData = parsedData as ParsedPowerPointFormatData;
        const headerRow = resourcesSheet.addRow(['Loại', 'Tên File']);
        styleHeaderRow(headerRow);
        
        if (pptxData.mediaFiles) {
            pptxData.mediaFiles.forEach((filename: string) => 
                resourcesSheet.addRow(['Media', filename])
            );
        }
    }

    return workbook;
}
