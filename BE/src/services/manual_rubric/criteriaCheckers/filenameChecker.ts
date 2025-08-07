import type { ParsedPowerPointFormatData } from "../../../types/power_point/powerpointFormat.types";
import type { GradingDetail } from "../../../types/grading.types";
import { powerpointRubric } from "../../../utils/powerpointRubric";

/**
 * Kiểm tra tên file có đúng quy tắc không
 * Format hợp lệ:
 * - 054206000135-DoanDinhHoan-DEPPT01.pptx
 * - 089306003634_Đinh Thị Xuân Nhi_BaiThietKePowerpoint.pptx
 * 
 * Quy tắc:
 * - MSSV là 12 số
 * - Họ và tên có thể có dấu hoặc không, viết hoa/thường/in đậm
 * - Ngăn cách giữa các phần có thể là "-" hoặc "_"
 * - Phần cuối là tên chủ đề hoặc "BaiThietKePowerPoint"
 */
export function checkFilename(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'filename')!;
    const filename = data.fileName || '';

    // Xây dựng regex để kiểm tra cả hai định dạng
    // Thêm flag 'u' để hỗ trợ Unicode property classes
    const pattern = /^(\d{12})([_-])([^\d_\-\s][\p{L}\s\p{M}0-9]+)([_-])([\p{L}0-9]+)\.?(?:pptx)?$/u;

    // Test pattern
    const match = filename.match(pattern);
    
    if (match) {
        // Extract các thành phần để báo cáo chi tiết hơn
        const mssv = match[1];
        const separator1 = match[2];
        const name = match[3];
        const separator2 = match[4];
        const topic = match[5];
        
        return { 
          criterion: rule.criterion, 
          maxScore: rule.maxScore, 
          achievedScore: rule.maxScore, 
          reason: `Tên file hợp lệ. MSSV: ${mssv}, Tên: ${name}, Chủ đề: ${topic}` 
        };
    }
    
    // Báo cáo lỗi chi tiết hơn để người dùng dễ sửa
    let reason = "Tên file không đúng cấu trúc yêu cầu. Cấu trúc phải là: MSSV-HoVaTen-ChuDe";
    
    if (!/^\d{12}/.test(filename)) {
        reason += ". MSSV phải đủ 12 số ở đầu file";
    }
    
    if (!/^(\d{12})([_-])/.test(filename)) {
        reason += ". Cần dấu ngăn cách '-' hoặc '_' sau MSSV";
    }
    
    // Cũng cần thêm flag 'u' vào các regex trong phần kiểm tra lỗi
    if (!new RegExp('^(\\d{12})([_-])([^\\d_\\-\\s][\\p{L}\\s\\p{M}0-9]+)', 'u').test(filename)) {
        reason += ". Phần tên không hợp lệ";
    }
    
    return { 
      criterion: rule.criterion, 
      maxScore: rule.maxScore, 
      achievedScore: 0, 
      reason: reason
    };
}