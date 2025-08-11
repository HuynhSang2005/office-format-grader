import type { ParsedPowerPointFormatData } from "../../../types/power_point";
import type { GradingDetail } from "../../types.ts";
import { 
  findRubricCriterion, 
  createMissingCriterionResult, 
  createNoDataResult,
  calculateScore 
} from "../../rubric/helpers.ts";
import { evaluateThemeConsistency } from "../helpers/formatValidator";

/**
 * Kiểm tra việc thiết kế theme trong bài nộp
 */
export function checkThemes(data: ParsedPowerPointFormatData): GradingDetail {
    const rule = findRubricCriterion('themes');
    
    if (!rule) {
        return createMissingCriterionResult('themes', "Themes");
    }
    
    // Kiểm tra slides tồn tại
    if (!data.slides || data.slides.length === 0) {
        return createNoDataResult(rule, "Không có slide nào để kiểm tra theme.");
    }
    
    // Đánh giá theme dựa trên nhất quán và phù hợp
    const { hasCustomTheme, consistencyScore, colorSchemeQuality } = evaluateThemeConsistency(data.slides);
    
    // Tổng điểm đạt được (max là 1.0)
    const totalScore = (hasCustomTheme ? 0.2 : 0) + consistencyScore * 0.4 + colorSchemeQuality * 0.4;
    
    // Sử dụng helper function để áp dụng điểm từ rubric
    let customReason = "";
    if (totalScore >= 0.9) {
        customReason = "Thiết kế theme phù hợp cả nội dung và bố cục, màu sắc hài hòa.";
    } else if (totalScore >= 0.7) {
        customReason = "Thiết kế theme tương đối hợp nội dung và bố cục.";
    } else if (totalScore >= 0.5) {
        customReason = "Thiết kế theme thiếu màu sắc chủ đạo, bố cục chưa chính xác.";
    } else if (totalScore > 0) {
        customReason = "Thiết kế theme sai bố cục.";
    } else {
        customReason = "Không thiết kế theme.";
    }
    
    return calculateScore(rule, totalScore, customReason);
}