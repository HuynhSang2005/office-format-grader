import type { GradingResult, GradingDetail, PowerPointGradingResult } from "../types/grading.types";
import { 
  findRubricCriterion, 
  calculateScore, 
  calculateBooleanScore, 
  calculateSimpleScore 
} from "./rubricHelper";

// Re-export các hàm từ rubricHelper để có thể import từ cả hai module
export { findRubricCriterion, calculateScore, calculateBooleanScore, calculateSimpleScore };


/**
 * Chuyển đổi kết quả đánh giá từ định dạng cũ (GradingResult) sang định dạng mới (PowerPointGradingResult)
 */
export function convertToNewFormat(oldFormat: GradingResult): PowerPointGradingResult {
  const newFormat: PowerPointGradingResult = {
    totalScore: oldFormat.totalAchievedScore,
    maxScore: oldFormat.totalMaxScore,
    percentageScore: Math.round((oldFormat.totalAchievedScore / oldFormat.totalMaxScore) * 100),
    criteria: {}
  };
  
  // Chuyển đổi từng tiêu chí
  oldFormat.details.forEach(detail => {
    // Cố gắng tìm ID từ tên tiêu chí
    const criterion = findRubricCriterion(
      Object.keys(newFormat.criteria || {}).find(id => 
        findRubricCriterion(id)?.criterion === detail.criterion
      ) || ''
    );
    
    // Tạo ID tạm nếu không tìm thấy
    const criterionId = criterion?.id || detail.criterion.replace(/\s+/g, '_').toLowerCase();
    
    if (newFormat.criteria) {
      newFormat.criteria[criterionId] = {
        name: detail.criterion,
        score: detail.achievedScore,
        maxScore: detail.maxScore,
        reason: detail.reason
      };
    }
  });
  
  return newFormat;
}

/**
 * Chuyển đổi kết quả đánh giá từ định dạng mới (PowerPointGradingResult) sang định dạng cũ (GradingResult)
 */
export function convertToOldFormat(newFormat: PowerPointGradingResult): GradingResult {
  const details: GradingDetail[] = [];
  
  if (newFormat.criteria) {
    Object.entries(newFormat.criteria).forEach(([id, criterionData]) => {
      details.push({
        criterion: criterionData.name,
        maxScore: criterionData.maxScore,
        achievedScore: criterionData.score,
        reason: criterionData.reason
      });
    });
  }
  
  return {
    totalAchievedScore: newFormat.totalScore || 0,
    totalMaxScore: newFormat.maxScore || 0,
    details
  };
}

/**
 * Tính toán điểm dựa trên phần trăm hoàn thành và cập nhật kết quả đánh giá
 * @param gradingResult Kết quả đánh giá để cập nhật
 * @param criterionId ID của tiêu chí đánh giá
 * @param completionPercentage Phần trăm hoàn thành (0-100)
 * @param customReason Lý do tùy chỉnh (không bắt buộc)
 */
export function updateScoreByPercentage(
  gradingResult: PowerPointGradingResult,
  criterionId: string,
  completionPercentage: number,
  customReason?: string
): void {
  const criterion = findRubricCriterion(criterionId);
  
  if (!criterion) {
    console.warn(`Không tìm thấy tiêu chí với ID: ${criterionId}`);
    return;
  }
  
  // Giới hạn phần trăm từ 0-100
  const normalizedPercentage = Math.max(0, Math.min(100, completionPercentage));
  
  // Chuyển đổi phần trăm sang tỷ lệ (0-1)
  const ratio = normalizedPercentage / 100;
  
  // Tính toán điểm
  const scoringResult = calculateScore(criterion, ratio, customReason);
  
  // Cập nhật kết quả đánh giá
  if (!gradingResult.criteria) {
    gradingResult.criteria = {};
  }
  
  gradingResult.criteria[criterionId] = {
    name: criterion.criterion,
    score: scoringResult.achievedScore,
    maxScore: scoringResult.maxScore,
    reason: scoringResult.reason
  };
  
  // Tự động cập nhật tổng điểm
  updateTotalScore(gradingResult);
}

/**
 * Cập nhật điểm dựa trên điều kiện Boolean
 * @param gradingResult Kết quả đánh giá để cập nhật
 * @param criterionId ID của tiêu chí đánh giá
 * @param condition Điều kiện đánh giá (true/false)
 * @param reasonIfTrue Lý do khi điều kiện là true
 * @param reasonIfFalse Lý do khi điều kiện là false
 */
export function updateScoreByBoolean(
  gradingResult: PowerPointGradingResult,
  criterionId: string,
  condition: boolean,
  reasonIfTrue: string,
  reasonIfFalse: string
): void {
  const criterion = findRubricCriterion(criterionId);
  
  if (!criterion) {
    console.warn(`Không tìm thấy tiêu chí với ID: ${criterionId}`);
    return;
  }
  
  // Tính toán điểm
  const scoringResult = calculateBooleanScore(criterion, condition, reasonIfTrue, reasonIfFalse);
  
  // Cập nhật kết quả đánh giá
  if (!gradingResult.criteria) {
    gradingResult.criteria = {};
  }
  
  gradingResult.criteria[criterionId] = {
    name: criterion.criterion,
    score: scoringResult.achievedScore,
    maxScore: scoringResult.maxScore,
    reason: scoringResult.reason
  };
  
  // Tự động cập nhật tổng điểm
  updateTotalScore(gradingResult);
}

/**
 * Cập nhật điểm dựa trên các điều kiện và ngưỡng
 * @param gradingResult Kết quả đánh giá để cập nhật
 * @param criterionId ID của tiêu chí đánh giá
 * @param conditions Mảng các điều kiện boolean
 * @param reason Lý do đánh giá
 */
export function updateScoreByConditions(
  gradingResult: PowerPointGradingResult,
  criterionId: string,
  conditions: boolean[],
  reason: string
): void {
  const criterion = findRubricCriterion(criterionId);
  
  if (!criterion) {
    console.warn(`Không tìm thấy tiêu chí với ID: ${criterionId}`);
    return;
  }
  
  // Tính phần trăm điều kiện thỏa mãn
  const trueCount = conditions.filter(Boolean).length;
  const ratio = conditions.length > 0 ? trueCount / conditions.length : 0;
  
  // Tính điểm
  const scoringResult = calculateScore(criterion, ratio, reason);
  
  // Cập nhật kết quả đánh giá
  if (!gradingResult.criteria) {
    gradingResult.criteria = {};
  }
  
  gradingResult.criteria[criterionId] = {
    name: criterion.criterion,
    score: scoringResult.achievedScore,
    maxScore: scoringResult.maxScore,
    reason: scoringResult.reason
  };
  
  // Tự động cập nhật tổng điểm
  updateTotalScore(gradingResult);
}

/**
 * Cập nhật tổng điểm cho kết quả đánh giá
 * @param gradingResult Kết quả đánh giá
 */
export function updateTotalScore(gradingResult: PowerPointGradingResult): void {
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  if (!gradingResult || !gradingResult.criteria) {
    gradingResult.totalScore = 0;
    gradingResult.maxScore = 0;
    return;
  }
  
  // Tính tổng điểm từ tất cả các tiêu chí
  Object.values(gradingResult.criteria).forEach(criterion => {
    if (criterion && typeof criterion === 'object') {
      if (typeof criterion.score === 'number') {
        totalScore += criterion.score;
      }
      
      if (typeof criterion.maxScore === 'number') {
        maxPossibleScore += criterion.maxScore;
      }
    }
  });
  
  // Làm tròn điểm tối đa 2 chữ số thập phân
  totalScore = Math.round(totalScore * 100) / 100;
  maxPossibleScore = Math.round(maxPossibleScore * 100) / 100;
  
  // Cập nhật kết quả
  gradingResult.totalScore = totalScore;
  gradingResult.maxScore = maxPossibleScore;
  
  // Tính điểm phần trăm nếu có điểm tối đa
  if (maxPossibleScore > 0) {
    gradingResult.percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
  } else {
    gradingResult.percentageScore = 0;
  }
}