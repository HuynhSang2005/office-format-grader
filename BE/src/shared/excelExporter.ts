import * as ExcelJS from 'exceljs';
import { isTextRun } from '../types/word/guards/wordGuards';
import type { ParsedWordData, Paragraph, Table, TableCell, TextRun, Drawing } from '../types/word/wordFormat.types';
import type { 
    ParsedPowerPointFormatData, 
    FormattedSlide, 
    Shape,
    FormattedTextRun 
} from '../types/power_point';

import type { GradingResult } from "../types/grading.types";
import { 
    ExcelColorThemes, 
    addConditionalFormatting, 
    createFormattedTable, 
    addAlternatingRow,
    applyNumberFormat,
    addImageFromDataURI
} from './excelStyles';

/**
 * Format ngày giờ theo định dạng Việt Nam (Đông Nam Á)
 * @param date Đối tượng Date cần format
 * @returns Chuỗi ngày giờ đã được format
 */
export function formatVietnameseDateTime(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date);
}

/**
 * Rút gọn văn bản dài thành chuỗi ngắn hơn với dấu "..." nếu cần
 * @param text Văn bản cần rút gọn
 * @param maxLength Độ dài tối đa (mặc định: 50 ký tự)
 * @returns Văn bản đã được rút gọn
 */
export function truncateText(text: string, maxLength: number = 50): string {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Chuyển đổi giá trị boolean thành chuỗi "Có" hoặc "Không"
 * @param value Giá trị boolean
 * @returns "Có" nếu true, "Không" nếu false
 */
export function booleanToString(value: boolean | undefined | null): string {
    if (value === undefined || value === null) return 'Không';
    return value ? 'Có' : 'Không';
}

/**
 * Tạo một workbook mới với thông tin cơ bản
 * @returns Workbook ExcelJS đã tạo
 */
export function createWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Office Format Analyzer';
    workbook.lastModifiedBy = 'API';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Thêm thuộc tính tùy chỉnh
    workbook.properties.date1904 = false; // Sử dụng ngày tháng theo chuẩn 1900
    
    // Các thuộc tính bổ sung (kiểm tra types)
    (workbook.properties as any).title = 'Báo cáo Office Format Analyzer';
    (workbook.properties as any).subject = 'Phân tích và đánh giá tài liệu Office';
    (workbook.properties as any).keywords = 'office, analysis, grading, format';
    
    return workbook;
}

/**
 * Định dạng hàng tiêu đề trong bảng Excel
 * @param row Đối tượng Row cần định dạng
 * @param colorScheme Mã màu tùy chỉnh cho header (mặc định là xanh Office)
 */
export function styleHeaderRow(row: ExcelJS.Row, colorScheme: string = 'FF4472C4'): void {
    row.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorScheme }
    };
    row.eachCell(cell => {
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
    });
    
    // Đặt chiều cao cố định cho hàng tiêu đề
    row.height = 25;
}

export async function generateExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

/**
 * Xuất dữ liệu chi tiết sang Excel
 * Hàm này tạo báo cáo Excel chi tiết từ kết quả đánh giá và dữ liệu phân tích
 * Sử dụng các thành phần từ excelStyles.ts để cải thiện hiển thị và tổ chức tập tin
 * 
 * @param gradingResult Kết quả đánh giá
 * @param parsedData Dữ liệu phân tích từ file PowerPoint hoặc Word
 * @param originalFilename Tên file gốc
 * @returns Workbook ExcelJS đã tạo
 */
export function exportDetailsToExcel(
    gradingResult: GradingResult,
    parsedData: ParsedPowerPointFormatData | ParsedWordData,
    originalFilename: string
): ExcelJS.Workbook {
    const workbook = createWorkbook();
    
    // Thêm định dạng số mặc định cho toàn bộ workbook
    workbook.views = [{
        x: 0, y: 0, width: 10000, height: 20000,
        firstSheet: 0, activeTab: 0,
        visibility: 'visible'
    }];

    // --- Sheet 1: Tổng quan ---
    const overviewSheet = workbook.addWorksheet('Tổng quan', {
        properties: {
            tabColor: { argb: 'FF1F4E79' }
        }
    });
    
    // Thêm logo hoặc tiêu đề lớn (có thể thêm hình ảnh sau này)
    const titleRow = overviewSheet.addRow(['Office Format Analyzer - Báo Cáo Chi Tiết']);
    titleRow.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1F4E79' } };
    titleRow.height = 30;
    
    // Thêm dòng trống
    overviewSheet.addRow([]);
    
    // Thêm thông tin cơ bản
    overviewSheet.addRow(['Tên File Gốc', originalFilename]);
    overviewSheet.addRow(['Thời Gian Phân Tích', formatVietnameseDateTime(new Date())]);

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
    const gradingSheet = workbook.addWorksheet('Kết quả chấm điểm', {
        properties: {
            tabColor: { argb: 'FF548235' }  // Màu xanh lá cây đậm
        }
    });
    
    // Tiêu đề sheet
    const titleGradingRow = gradingSheet.addRow(['BÁO CÁO KẾT QUẢ ĐÁNH GIÁ']);
    titleGradingRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF548235' } };
    titleGradingRow.height = 25;
    gradingSheet.mergeCells('A1:D1');
    titleGradingRow.alignment = { horizontal: 'center' };
    
    // Dòng trống
    gradingSheet.addRow([]);
    
    // Header bảng chấm điểm
    const gradingHeader = gradingSheet.addRow(['Tiêu chí', 'Điểm tối đa', 'Điểm đạt', 'Lý do/Nhận xét']);
    styleHeaderRow(gradingHeader, 'FF548235');  // Sử dụng màu xanh lá

    // Dữ liệu chấm điểm với định dạng xen kẽ
    gradingResult.details.forEach((detail, index) => {
        const detailRow = gradingSheet.addRow([
            detail.criterion,
            detail.maxScore,
            detail.achievedScore,
            detail.reason
        ]);
        
        // Định dạng số cho cột điểm
        detailRow.getCell(2).numFmt = '0.00';
        detailRow.getCell(3).numFmt = '0.00';
        
        // Đổi màu nền các dòng chẵn
        if (index % 2 === 1) {
            detailRow.eachCell({ includeEmpty: true }, cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }  // Xám nhạt
                };
            });
        }
        
        // Đánh dấu màu cho điểm thấp (dưới 50% điểm tối đa)
        if (detail.achievedScore < detail.maxScore * 0.5) {
            detailRow.getCell(3).font = { color: { argb: 'FFFF0000' }, bold: true };
        }
    });

    // Thêm dòng trống
    gradingSheet.addRow([]);
    
    // Thêm dòng tổng điểm với định dạng nổi bật
    const totalRow = gradingSheet.addRow([
        'TỔNG ĐIỂM',
        gradingResult.totalMaxScore,
        gradingResult.totalAchievedScore,
        `Đạt ${Math.round((gradingResult.totalAchievedScore / gradingResult.totalMaxScore) * 100)}%`
    ]);
    
    // Định dạng dòng tổng
    // Định dạng số và phần trăm
    applyNumberFormat(totalRow.getCell(2), 'decimal');
    applyNumberFormat(totalRow.getCell(3), 'decimal');
    
    // Đổi màu nền và font cho dòng tổng điểm
    totalRow.eachCell({ includeEmpty: true }, cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: ExcelColorThemes.green }  // Màu xanh lá đậm
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    
    // Thêm dòng trống
    gradingSheet.addRow([]);
    gradingSheet.addRow([]);
    
    // Tạo biểu đồ từ kết quả đánh giá
    try {
        // Dữ liệu cho biểu đồ
        const chartDataRow = gradingSheet.addRow(['Biểu đồ điểm số', 'Điểm tối đa', 'Điểm đạt được']);
        chartDataRow.font = { bold: true };
        chartDataRow.getCell(1).alignment = { horizontal: 'left' };
        
        // Tạo dữ liệu biểu đồ từ tiêu chí
        const criteriaDataStartRow = gradingSheet.rowCount + 1;
        
        gradingResult.details.forEach((detail) => {
            const shortCriterion = detail.criterion.length > 30 
                ? detail.criterion.substring(0, 30) + '...' 
                : detail.criterion;
            
            gradingSheet.addRow([shortCriterion, detail.maxScore, detail.achievedScore]);
        });
        
        // Định dạng màu và đường viền cho vùng dữ liệu biểu đồ
        for (let i = criteriaDataStartRow; i < criteriaDataStartRow + gradingResult.details.length; i++) {
            const row = gradingSheet.getRow(i);
            
            // Định dạng cho cột điểm đạt được
            row.getCell(3).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9EAD3' }  // Màu xanh lá nhạt
            };
            
            // Định dạng cho cột điểm tối đa
            row.getCell(2).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDEEAF6' }  // Màu xanh dương nhạt
            };
            
            // Định dạng số
            row.getCell(2).numFmt = '0.00';
            row.getCell(3).numFmt = '0.00';
        }
        
        // Thêm định dạng có điều kiện cho điểm thấp
        const criteriaCells = `C${criteriaDataStartRow}:C${criteriaDataStartRow + gradingResult.details.length - 1}`;
        addConditionalFormatting(
            gradingSheet,
            criteriaCells,
            'expression',
            `C${criteriaDataStartRow}<=B${criteriaDataStartRow}*0.5`,
            {
                font: { color: { argb: 'FFFF0000' }, bold: true },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD9D9' } }
            }
        );
    } catch (error) {
        console.error('Không thể tạo biểu đồ từ dữ liệu đánh giá:', error);
    }

    // Thiết lập chiều rộng cột và căn chỉnh
    gradingSheet.getColumn(1).width = 40;
    gradingSheet.getColumn(2).width = 15;
    gradingSheet.getColumn(3).width = 15;
    gradingSheet.getColumn(4).width = 70;
    
    // Căn giữa các cột số liệu
    gradingSheet.getColumn(2).alignment = { horizontal: 'center' };
    gradingSheet.getColumn(3).alignment = { horizontal: 'center' };
    
    // Auto-filter cho phép lọc dữ liệu
    gradingSheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3 + gradingResult.details.length - 1, column: 4 }
    };

    // --- Sheet chi tiết ---
    if (isPowerPoint && 'slides' in parsedData && Array.isArray(parsedData.slides)) {
        const pptxData = parsedData as ParsedPowerPointFormatData;
        const slides = pptxData.slides as FormattedSlide[];
        
        // Sheet 3: Cấu trúc Slide
        const slidesSheet = workbook.addWorksheet('Cấu trúc Slide', {
            properties: { tabColor: { argb: 'FF4472C4' } }
        });
        
        // Tiêu đề sheet
        const titleSlidesRow = slidesSheet.addRow(['CHI TIẾT CẤU TRÚC SLIDE TRONG BÀI TRÌNH BÀY']);
        titleSlidesRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF4472C4' } };
        slidesSheet.mergeCells('A1:E1');
        titleSlidesRow.alignment = { horizontal: 'center' };
        titleSlidesRow.height = 25;
        
        // Dòng trống
        slidesSheet.addRow([]);
        
        // Header bảng slide
        const slidesHeader = slidesSheet.addRow(['Slide #', 'Layout', 'Ghi chú (Notes)', 'Hiệu ứng Transition', 'Có Âm thanh']);
        styleHeaderRow(slidesHeader);
        
        // Thêm dữ liệu các slide với định dạng xen kẽ
        slides.forEach((slide: FormattedSlide, index: number) => {
            const slideRow = addAlternatingRow(
                slidesSheet, 
                [
                    slide.slideNumber,
                    slide.layout,
                    slide.notes || '',
                    slide.transition?.type || 'Không có',
                    slide.transition?.sound?.name ? 'Có' : 'Không',
            // Định dạng màu nền xen kẽ đã được xử lý bởi addAlternatingRow
                ]
            );
            
            // Đánh dấu đặc biệt cho slide đầu tiên và cuối cùng
            if (slide.slideNumber === 1) {
                slideRow.getCell(1).font = { bold: true, color: { argb: 'FF4472C4' } };
                slideRow.getCell(2).font = { bold: true };
            }
            if (slide.slideNumber === slides.length) {
                slideRow.getCell(1).font = { bold: true, color: { argb: 'FF4472C4' } };
                slideRow.getCell(2).font = { bold: true };
            }
        });
        
        // Thiết lập chiều rộng cột và căn chỉnh
        slidesSheet.getColumn(1).width = 10;  // Slide #
        slidesSheet.getColumn(2).width = 25;  // Layout
        slidesSheet.getColumn(3).width = 40;  // Notes
        slidesSheet.getColumn(4).width = 20;  // Transition
        slidesSheet.getColumn(5).width = 15;  // Sound
        
        // Căn giữa cột số slide và cột có/không âm thanh
        slidesSheet.getColumn(1).alignment = { horizontal: 'center' };
        slidesSheet.getColumn(5).alignment = { horizontal: 'center' };
        
        // Auto-filter cho phép lọc dữ liệu
        slidesSheet.autoFilter = {
            from: { row: 3, column: 1 },
            to: { row: 3 + slides.length - 1, column: 5 }
        };

        // Sheet 4: Chi tiết Text & Format
        const textSheet = workbook.addWorksheet('Chi tiết Text', {
            properties: { tabColor: { argb: 'FF7030A0' } }  // Màu tím
        });
        
        // Tiêu đề sheet
        const titleTextRow = textSheet.addRow(['CHI TIẾT ĐỊNH DẠNG TEXT TRONG SLIDES']);
        titleTextRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF7030A0' } };
        textSheet.mergeCells('A1:K1');
        titleTextRow.alignment = { horizontal: 'center' };
        titleTextRow.height = 25;
        
        // Dòng trống
        textSheet.addRow([]);
        
        // Header bảng text
        const textHeader = textSheet.addRow(['Slide #', 'Shape ID', 'Shape Name', 'Loại Run', 'Nội dung', 'Font', 'Size', 'Bold', 'Italic', 'Color', 'Hyperlink']);
        styleHeaderRow(textHeader, 'FF7030A0');  // Sử dụng màu tím
        
        // Biến để đếm số lượng dòng text
        let textRowCount = 0;
        
        // Thêm dữ liệu text từ các slide
        slides.forEach((slide: FormattedSlide) => {
            // Kiểm tra slide có shapes không
            if (slide.shapes && Array.isArray(slide.shapes)) {
                slide.shapes.forEach((shape) => {
                    // Kiểm tra shape có text runs không
                    if (shape.textRuns && Array.isArray(shape.textRuns)) {
                        shape.textRuns.forEach((run) => {
                            // Nếu run là FormattedTextRun (có thuộc tính text)
                            const textRow = addAlternatingRow(
                                textSheet,
                                [
                                    slide.slideNumber, 
                                    shape.id, 
                                    shape.name, 
                                    'Text',
                                    run.text, 
                                    run.font, 
                                    run.size, 
                                    run.isBold ? 'Có' : 'Không', 
                                    run.isItalic ? 'Có' : 'Không', 
                                    run.color, 
                                    run.hyperlink || ''
                                ],
                                (textRowCount % 2 === 1) // Alternate rows
                            );
                            
                            // Đánh dấu các tiêu đề bằng màu đậm
                            if (run.isBold && run.size && run.size >= 20) {
                                textRow.getCell(5).font = { bold: true, color: { argb: 'FF7030A0' } };
                            }
                            
                            // Đánh dấu hyperlink bằng màu xanh và gạch chân
                            if (run.hyperlink) {
                                textRow.getCell(11).font = { 
                                    color: { argb: 'FF0563C1' }, 
                                    underline: true 
                                };
                            }
                            
                            textRowCount++;
                        });
                    }
                });
            }
        });
        
        // Thiết lập chiều rộng và căn chỉnh các cột
        textSheet.getColumn(1).width = 10;  // Slide #
        textSheet.getColumn(2).width = 15;  // Shape ID
        textSheet.getColumn(3).width = 25;  // Shape Name
        textSheet.getColumn(4).width = 10;  // Loại Run
        textSheet.getColumn(5).width = 40;  // Nội dung
        textSheet.getColumn(6).width = 15;  // Font
        textSheet.getColumn(7).width = 10;  // Size
        textSheet.getColumn(8).width = 10;  // Bold
        textSheet.getColumn(9).width = 10;  // Italic
        textSheet.getColumn(10).width = 15; // Color
        textSheet.getColumn(11).width = 30; // Hyperlink
        
        // Căn giữa một số cột
        textSheet.getColumn(1).alignment = { horizontal: 'center' };  // Slide #
        textSheet.getColumn(7).alignment = { horizontal: 'center' };  // Size
        textSheet.getColumn(8).alignment = { horizontal: 'center' };  // Bold
        textSheet.getColumn(9).alignment = { horizontal: 'center' };  // Italic
        
        // Auto-filter
        if (textRowCount > 0) {
            textSheet.autoFilter = {
                from: { row: 3, column: 1 },
                to: { row: 3 + textRowCount - 1, column: 11 }
            };
        }
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
    const resourcesSheet = workbook.addWorksheet('Tài nguyên', {
        properties: { tabColor: { argb: 'FFC65911' } }  // Màu cam
    });
    
    // Tiêu đề sheet
    const titleResourcesRow = resourcesSheet.addRow(['TÀI NGUYÊN ĐA PHƯƠNG TIỆN']);
    titleResourcesRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFC65911' } };
    resourcesSheet.mergeCells('A1:D1');
    titleResourcesRow.alignment = { horizontal: 'center' };
    titleResourcesRow.height = 25;
    
    // Dòng trống
    resourcesSheet.addRow([]);
    
    if (isPowerPoint && 'mediaFiles' in parsedData && Array.isArray(parsedData.mediaFiles)) {
        const pptxData = parsedData as ParsedPowerPointFormatData;
        const headerRow = resourcesSheet.addRow(['STT', 'Loại', 'Tên File', 'Kích thước (ước tính)']);
        styleHeaderRow(headerRow, 'FFC65911');  // Sử dụng màu cam
        
        if (pptxData.mediaFiles) {
            pptxData.mediaFiles.forEach((filename: string, index: number) => {
                // Xác định loại file dựa trên phần mở rộng
                const extension = filename.split('.').pop()?.toLowerCase() || '';
                let fileType = 'Khác';
                
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension)) {
                    fileType = 'Hình ảnh';
                } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
                    fileType = 'Video';
                } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
                    fileType = 'Âm thanh';
                }
                
                // Ước tính kích thước dựa trên loại file (đơn vị KB)
                const estimatedSize = `${Math.round(filename.length * 1.5)} KB (ước tính)`;
                
                const resourceRow = addAlternatingRow(
                    resourcesSheet,
                    [
                        index + 1,
                        fileType,
                        filename,
                        estimatedSize
                    ],
                    index % 2 === 1 // Xen kẽ dòng lẻ
                );
                
                // Định dạng màu nền xen kẽ
                if (index % 2 === 1) {
                    resourceRow.eachCell({ includeEmpty: true }, cell => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF2F2F2' }  // Xám nhạt
                        };
                    });
                }
            });
            
            // Thiết lập chiều rộng và căn chỉnh cột
            resourcesSheet.getColumn(1).width = 10;   // STT
            resourcesSheet.getColumn(2).width = 15;   // Loại
            resourcesSheet.getColumn(3).width = 40;   // Tên file
            resourcesSheet.getColumn(4).width = 20;   // Kích thước
            
            // Căn giữa một số cột
            resourcesSheet.getColumn(1).alignment = { horizontal: 'center' };   // STT
            resourcesSheet.getColumn(2).alignment = { horizontal: 'center' };   // Loại
            resourcesSheet.getColumn(4).alignment = { horizontal: 'center' };   // Kích thước
            
            // Auto-filter
            resourcesSheet.autoFilter = {
                from: { row: 3, column: 1 },
                to: { row: 3 + pptxData.mediaFiles.length - 1, column: 4 }
            };
            
            // Thêm tổng kết
            const summaryRow = resourcesSheet.addRow(['']);
            summaryRow.height = 5;
            
            const totalRow = resourcesSheet.addRow([
                'Tổng cộng:',
                '',
                `${pptxData.mediaFiles.length} tập tin`,
                ''
            ]);
            totalRow.font = { bold: true };
            totalRow.getCell(1).alignment = { horizontal: 'right' };
            totalRow.getCell(3).alignment = { horizontal: 'left' };
        } else {
            // Không tìm thấy tài nguyên
            const noResourcesRow = resourcesSheet.addRow(['', 'Không tìm thấy tài nguyên đa phương tiện nào trong file']);
            resourcesSheet.mergeCells(`B4:D4`);
            noResourcesRow.getCell(2).font = { italic: true };
        }
    } else {
        // Không có thông tin tài nguyên
        const noDataRow = resourcesSheet.addRow(['Không có thông tin về tài nguyên đa phương tiện']);
        resourcesSheet.mergeCells('A3:D3');
        noDataRow.alignment = { horizontal: 'center' };
        noDataRow.font = { italic: true };
    }
    
    // Thêm sheet thông tin phiên bản
    const infoSheet = workbook.addWorksheet('Thông tin', {
        properties: { tabColor: { argb: 'FF808080' } }  // Màu xám
    });
    
    infoSheet.addRow(['Office Format Analyzer - Thông tin']);
    infoSheet.addRow(['Phiên bản', '1.2.0']);
    infoSheet.addRow(['Ngày xuất báo cáo', formatVietnameseDateTime(new Date())]);
    infoSheet.addRow(['Người xuất báo cáo', 'Hệ thống tự động']);
    infoSheet.addRow(['']);
    infoSheet.addRow(['Ghi chú', 'Báo cáo này được tạo tự động bởi Office Format Analyzer.']);
    infoSheet.addRow(['', 'Vui lòng không chỉnh sửa thủ công các dữ liệu trong báo cáo này.']);
    
    // Định dạng cho sheet thông tin
    infoSheet.getRow(1).font = { bold: true, size: 14 };
    infoSheet.getRow(1).height = 30;
    infoSheet.getColumn(1).width = 20;
    infoSheet.getColumn(2).width = 50;

    return workbook;
}
