import type { ParsedPowerPointFormatData } from "../../../types/power_point/powerpointFormat.types";
import type { GradingDetail } from "../../../types/grading.types";
import { findRubricCriterion, calculateScore } from "../../../helpers/rubricHelper";
import { analyzeAnimations } from "../helpers/criteriaHelper";

/**
 * Kiểm tra việc sử dụng animation trong bài nộp
 */
export function checkAnimations(data: ParsedPowerPointFormatData): GradingDetail {
    const criterionId = 'animations';
    const rule = findRubricCriterion(criterionId);
    
    if (!rule) {
        return { 
            criterion: "Animations", 
            maxScore: 1.0, 
            achievedScore: 0, 
            reason: "Lỗi cấu hình: Không tìm thấy tiêu chí đánh giá animations" 
        };
    }
    
    // Kiểm tra slides tồn tại
    if (!data.slides || data.slides.length === 0) {
        return { 
            criterion: rule.criterion, 
            maxScore: rule.maxScore, 
            achievedScore: 0, 
            reason: "Không có slide nào để kiểm tra animation." 
        };
    }
    
    // Sử dụng helper mới để phân tích animations
    const { totalAnimations, slidesWithAnimation, differentAnimationTypes, customAnimations } = analyzeAnimations(data.slides);
    
    // Tính tỷ lệ slide có animation
    const slideRatio = data.slides.length > 0 ? slidesWithAnimation / data.slides.length : 0;
    
    // Tính tỷ lệ animation tùy chỉnh
    const customRatio = totalAnimations > 0 ? customAnimations / totalAnimations : 0;
    
    // Tính điểm dựa trên các tiêu chí khác nhau
    let score = 0;
    let reason = "";
    
    if (totalAnimations === 0) {
        score = 0;
        reason = "Không sử dụng animation.";
    } else if (slideRatio < 0.3 || customRatio === 0) {
        score = 0.25;
        reason = `Có dùng ${totalAnimations} hiệu ứng nhưng sai cách hoặc rất hạn chế.`;
    } else if (slideRatio < 0.5 || customRatio < 0.3) {
        score = 0.5;
        reason = `Áp dụng ${totalAnimations} animation cơ bản nhưng tùy chỉnh còn hạn chế.`;
    } else if (slideRatio < 0.7 || customRatio < 0.5) {
        score = 0.75;
        reason = `Áp dụng ${totalAnimations} animation khá tốt (${differentAnimationTypes.size} loại khác nhau), ${customAnimations} tùy chỉnh ở mức khá.`;
    } else {
        score = 1.0;
        reason = `Thành thạo sử dụng ${totalAnimations} animation (${differentAnimationTypes.size} loại khác nhau) với ${customAnimations} tùy chỉnh hiệu quả và chuyên nghiệp.`;
    }
    
    // Sử dụng calculateScore để ánh xạ vào rubric levels
    return calculateScore(rule, score, reason);
}