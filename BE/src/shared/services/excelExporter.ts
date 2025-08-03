import ExcelJS from 'exceljs';

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