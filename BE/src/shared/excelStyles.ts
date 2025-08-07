/**
 * @fileoverview Các tiện ích và hàm hỗ trợ định dạng Excel
 * @author Office Format Analyzer Team
 * @version 1.0
 */

import * as ExcelJS from 'exceljs';

/**
 * Định nghĩa các theme màu cho Excel exports
 * Sử dụng các mã màu ARGB với định dạng "AARRGGBB"
 * Tham khảo: https://www.color-hex.com/ để chọn màu phù hợp
 */
export const ExcelColorThemes = {
    blue: 'FF4472C4',    // Màu xanh dương (Office)
    green: 'FF548235',   // Màu xanh lá
    purple: 'FF7030A0',  // Màu tím
    orange: 'FFC65911',  // Màu cam
    red: 'FFFF0000',     // Màu đỏ
    grey: 'FF808080',    // Màu xám
    lightGrey: 'FFF2F2F2' // Màu xám nhạt cho dòng xen kẽ
};

/**
 * Định nghĩa các loại hàm tổng hợp được hỗ trợ trong Excel
 */
export type ExcelTotalFunction = 
    'none' | 'average' | 'countNums' | 'count' | 
    'max' | 'min' | 'stdDev' | 'var' | 'sum' | 'custom';

/**
 * Định nghĩa cột trong bảng Excel
 */
export interface ExcelTableColumn {
    name: string;
    totalsRowLabel?: string;
    totalsRowFunction?: ExcelTotalFunction;
}

/**
 * Thêm hình ảnh vào worksheet Excel từ Data URI
 * @param worksheet Worksheet cần thêm hình ảnh
 * @param dataUri Data URI của hình ảnh (base64)
 * @param position Vị trí của hình ảnh (tọa độ cột, dòng)
 * @param dimensions Kích thước hình ảnh (rộng x cao)
 */
export function addImageFromDataURI(
    worksheet: ExcelJS.Worksheet,
    dataUri: string,
    position: { column: number; row: number },
    dimensions: { width: number; height: number } = { width: 200, height: 100 }
): void {
    try {
        // Kiểm tra chuỗi data URI
        if (!dataUri || !dataUri.startsWith('data:image')) {
            throw new Error('Data URI không hợp lệ');
        }

        // Trích xuất phần base64 từ data URI
        const matches = dataUri.match(/^data:.+;base64,(.*)$/);
        if (!matches || !matches[1]) {
            throw new Error('Không thể phân tích data URI');
        }

        // Tạo buffer từ chuỗi base64
        const imageData = matches[1];
        
        // Xác định định dạng hình ảnh từ data URI
        const formatMatch = dataUri.match(/^data:image\/(\w+);base64/);
        
        // Chỉ hỗ trợ các định dạng: png, gif, jpeg theo API ExcelJS
        let imageFormat: 'png' | 'gif' | 'jpeg' = 'png'; // Mặc định là png
        
        if (formatMatch && formatMatch[1]) {
            const format = formatMatch[1].toLowerCase();
            if (['png', 'gif', 'jpeg'].includes(format)) {
                imageFormat = format as 'png' | 'gif' | 'jpeg';
            }
        }

        // Thêm hình ảnh vào workbook (dùng type assertion cho buffer vì có vấn đề với types)
        const imageId = worksheet.workbook.addImage({
            buffer: Buffer.from(imageData, 'base64') as any,
            extension: imageFormat
        });

        // Thêm hình ảnh vào worksheet
        worksheet.addImage(imageId, {
            tl: { col: position.column, row: position.row },
            ext: { width: dimensions.width, height: dimensions.height },
            editAs: 'oneCell'
        });
    } catch (error) {
        console.error('Không thể thêm hình ảnh vào worksheet:', error);
    }
}

/**
 * Tạo một bảng dữ liệu trong Excel
 * @param worksheet Worksheet để tạo bảng
 * @param tableRange Phạm vi bảng, ví dụ: "A3:D10"
 * @param options Các tùy chọn cho bảng
 */
export function createFormattedTable(
    worksheet: ExcelJS.Worksheet,
    tableRange: string,
    options: {
        name: string;
        headerRow?: boolean;
        totalsRow?: boolean;
    }
): void {
    try {
        // Sử dụng any type để vượt qua giới hạn của TypeScript với API ExcelJS
        const tableOptions: any = {
            name: options.name,
            ref: tableRange,
            style: 'TableStyleMedium2'
        };
        
        // Thêm các tùy chọn nếu được cung cấp
        if (options.headerRow !== undefined) {
            tableOptions.headerRow = options.headerRow;
        }
        
        if (options.totalsRow !== undefined) {
            tableOptions.totalsRow = options.totalsRow;
        }
        
        // Tạo bảng
        worksheet.addTable(tableOptions);
    } catch (error) {
        console.error('Không thể tạo bảng trong worksheet:', error);
    }
}

/**
 * Thiết lập định dạng có điều kiện cho một phạm vi trong worksheet
 * @param worksheet Worksheet cần thiết lập
 * @param range Phạm vi để áp dụng định dạng có điều kiện
 * @param conditionType Loại điều kiện
 * @param formula Công thức điều kiện
 * @param styles Định dạng sẽ áp dụng khi điều kiện đúng
 */
export function addConditionalFormatting(
    worksheet: ExcelJS.Worksheet,
    range: string,
    conditionType: 'expression' | 'cellIs',
    formula: string,
    styles: {
        font?: Partial<ExcelJS.Font>;
        fill?: ExcelJS.Fill;
    }
): void {
    try {
        // ExcelJS có vấn đề với type cho conditional formatting
        // Sử dụng cast để tránh lỗi TypeScript
        const rule: any = {
            type: conditionType,
            formulae: [formula],
            style: styles,
            priority: 1
        };
        
        worksheet.addConditionalFormatting({
            ref: range,
            rules: [rule]
        });
    } catch (error) {
        console.error('Không thể thêm định dạng có điều kiện:', error);
    }
}

/**
 * Tạo row với màu nền xen kẽ
 * @param worksheet Worksheet cần thao tác
 * @param rowData Dữ liệu cần thêm
 * @param isAlternating Có áp dụng màu nền xen kẽ không
 * @param rowIndex Chỉ số dòng (tùy chọn)
 * @returns Đối tượng Row đã được thêm
 */
export function addAlternatingRow(
    worksheet: ExcelJS.Worksheet,
    rowData: any[],
    isAlternating: boolean = false,
    rowIndex?: number
): ExcelJS.Row {
    // Sử dụng rowIndex nếu được cung cấp hoặc thêm vào dòng mới
    const row = rowIndex ? worksheet.getRow(rowIndex) : worksheet.addRow(rowData);
    
    // Nếu không có rowIndex, cần gán dữ liệu cho dòng mới
    if (rowIndex) {
        // Chỉ định giá trị từ rowData
        rowData.forEach((value, index) => {
            row.getCell(index + 1).value = value;
        });
    }
    
    // Áp dụng màu nền nếu cần
    if (isAlternating) {
        row.eachCell({ includeEmpty: true }, cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: ExcelColorThemes.lightGrey }
            };
        });
    }
    
    return row;
}

/**
 * Áp dụng định dạng số cho một ô Excel
 * @param cell Ô cần định dạng
 * @param formatType Loại định dạng
 */
export function applyNumberFormat(
    cell: ExcelJS.Cell,
    formatType: 'integer' | 'decimal' | 'percent' | 'currency' | 'date' = 'decimal'
): void {
    switch (formatType) {
        case 'integer':
            cell.numFmt = '0';
            break;
        case 'decimal':
            cell.numFmt = '0.00';
            break;
        case 'percent':
            cell.numFmt = '0.00%';
            break;
        case 'currency':
            cell.numFmt = '#,##0.00 ₫';
            break;
        case 'date':
            cell.numFmt = 'dd/mm/yyyy';
            break;
    }
}
