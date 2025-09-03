import type { ParsedPowerPointFormatData } from "../../../types/power_point/powerpointFormat.types";
import type { GradingDetail } from "../../../types/grading.types";
import { powerpointRubric } from "../../../utils/powerpointRubric";

/**
 * Kiểm tra hiệu ứng chuyển cảnh giữa các slide
 */
export function checkTransitions(
  data: ParsedPowerPointFormatData
): GradingDetail {
  const rule = powerpointRubric.find((r) => r.id === "transitions")!;

  if (!data.slides || data.slides.length === 0) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: 0,
      reason: "Không có slide nào để kiểm tra hiệu ứng chuyển cảnh.",
    };
  }

  // Số slide có hiệu ứng chuyển cảnh
  const slidesWithTransition = data.slides.filter((s) => !!s.transition);
  const transitionRatio = slidesWithTransition.length / data.slides.length;

  // Kiểm tra slide 2 có âm thanh kèm theo không
  const hasSlide2WithSound =
    data.slides.length > 1 && !!data.slides[1]?.transition?.sound?.name;

  // Đánh giá kết quả
  if (transitionRatio === 1 && hasSlide2WithSound) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: 1.0,
      reason: `Tất cả ${data.slides.length} slide đều có hiệu ứng chuyển cảnh và slide 2 có âm thanh.`,
    };
  }

  if (transitionRatio === 1 && !hasSlide2WithSound) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: 0.5,
      reason: `Tất cả ${data.slides.length} slide có hiệu ứng chuyển cảnh nhưng slide 2 thiếu âm thanh kèm theo.`,
    };
  }

  if (transitionRatio > 0) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: 0.25,
      reason: `Chỉ ${slidesWithTransition.length}/${data.slides.length} slide có hiệu ứng chuyển cảnh.`,
    };
  }

  return {
    criterion: rule.criterion,
    maxScore: rule.maxScore,
    achievedScore: 0,
    reason: "Không có slide nào được thiết lập hiệu ứng chuyển cảnh.",
  };
}
