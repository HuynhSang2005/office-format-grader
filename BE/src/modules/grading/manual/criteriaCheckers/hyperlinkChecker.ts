import type { ParsedPowerPointFormatData } from "../../../powerpoint/types.ts";
import type { GradingDetail } from "../../types.ts";
import { powerpointRubric } from "../../rubric/powerpointRubric.ts";
import { checkSlidesForHyperlinks } from "../helpers/slideAnalyzer";

/**
 * Kiểm tra việc sử dụng hyperlink trong bài nộp
 */
export function checkHyperlink(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = powerpointRubric.find(r => r.id === 'hyperlink')!;
    
    // Kiểm tra slides tồn tại
    if (!data.slides || data.slides.length === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Không có slide nào để kiểm tra hyperlink." 
        };
    }
    
    // Phân tích hyperlink trong slides
    const { count, validCount, validTargets } = checkSlidesForHyperlinks(data.slides);
    
    // Đánh giá kết quả
    if (count === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Không tạo/sử dụng liên kết nào." 
        };
    }
    
    if (validCount === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: rule.maxScore * 0.25, 
            reason: `Đã tạo ${count} liên kết nhưng không hoạt động.` 
        };
    }
    
    if (validTargets < validCount) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: rule.maxScore * 0.5, 
            reason: `${validCount}/${count} liên kết hoạt động nhưng ${validCount - validTargets} liên kết sai đích đến.` 
        };
    }
    
    if (validTargets === validCount && validCount < count) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: rule.maxScore * 0.75, 
            reason: `${validCount}/${count} liên kết đúng đích đến, còn lại có lỗi nhỏ.` 
        };
    }
    
    return { 
        criterion: rule.criterion, 
        maxScore: rule.maxScore, 
        achievedScore: rule.maxScore, 
        reason: `Tất cả ${count} liên kết hoàn toàn chính xác, hoạt động tốt và đúng mục đích.` 
    };
}