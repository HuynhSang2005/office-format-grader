import type { ParsedPowerPointFormatData } from "../../../types/power_point/powerpointFormat.types";
import type { GradingDetail } from "../../../types/grading.types";
import { powerpointRubric } from "../../../utils/powerpointRubric";

/**
 * Kiểm tra tên file có đúng quy tắc không
 */
export function checkFilename(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'filename')!;
    const filename = data.fileName || '';

    const pattern = /^\d+-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*-BaiThietKePowerPoint\.pptx$/i;

    if (pattern.test(filename)) {
        return { 
          criterion: rule.criterion, 
          maxScore: rule.maxScore, 
          achievedScore: 0.5, 
          reason: "Tên file tuân thủ đúng quy ước." 
        };
    }
    
    return { 
      criterion: rule.criterion, 
      maxScore: rule.maxScore, 
      achievedScore: 0, 
      reason: "Tên file không đúng cấu trúc yêu cầu (MSSV-HovaTen-...)."
    };
}