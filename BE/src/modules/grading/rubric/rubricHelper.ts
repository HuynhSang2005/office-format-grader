import type { RubricCriterion, GradingDetail, RubricLevel } from "../types/grading.types";
// Import the latest PowerPoint rubric definition from the local rubric module
import { powerpointRubric } from "./powerpointRubric";

/**
 * Tìm tiêu chí từ rubric dựa vào ID
 */
export function findRubricCriterion(criterionId: string): RubricCriterion | undefined {
  return powerpointRubric.find(r => r.id === criterionId);
}

/**
 * Tạo GradingDetail khi không tìm thấy tiêu chí
 */
export function createMissingCriterionResult(criterionId: string, criterionName: string): GradingDetail {
  return {
    criterion: criterionName,
    maxScore: 0,
    achievedScore: 0,
    reason: `Lỗi cấu hình: Không tìm thấy tiêu chí đánh giá ${criterionName}`
  };
}

/**
 * Tạo GradingDetail khi không có dữ liệu để chấm
 */
export function createNoDataResult(rule: RubricCriterion, message: string): GradingDetail {
  return {
    criterion: rule.criterion,
    maxScore: rule.maxScore,
    achievedScore: 0,
    reason: message
  };
}

/**
 * Tìm level thích hợp nhất dựa trên điểm số
 * @param levels Danh sách các level
 * @param targetScore Điểm số cần tìm level phù hợp
 * @returns Level phù hợp nhất hoặc undefined nếu không có level nào
 */
function findClosestLevel(levels: RubricLevel[], targetScore: number): RubricLevel | undefined {
  if (levels.length === 0) return undefined;
  
  // Sắp xếp levels theo điểm giảm dần
  const sortedLevels = [...levels].sort((a, b) => b.score - a.score);
  
  // Tìm level lớn nhất mà điểm số <= điểm của level
  for (const level of sortedLevels) {
    if (targetScore >= level.score - 0.001) { // Thêm dung sai nhỏ để xử lý sai số làm tròn
      return level;
    }
  }
  
  // Nếu không tìm thấy level nào thích hợp, trả về level thấp nhất
  return sortedLevels[sortedLevels.length - 1];
}

/**
 * Tính toán điểm dựa trên các level của rubric
 * @param rule Tiêu chí rubric đang áp dụng
 * @param score Điểm số đạt được (0-1, tỷ lệ phần trăm)
 * @param customReason Lý do tùy chỉnh (nếu không cung cấp, sẽ sử dụng mô tả từ level)
 */
export function calculateScore(
  rule: RubricCriterion, 
  score: number,
  customReason?: string
): GradingDetail {
  // Đảm bảo score nằm trong khoảng [0, 1]
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  // Lấy danh sách levels từ rule, mặc định là mảng rỗng
  const levels = rule.levels || [];
  const maxPossibleScore = rule.maxScore;
  
  // Điểm đạt được theo tỷ lệ
  const rawAchievedScore = normalizedScore * maxPossibleScore;
  
  // Kiểm tra xem có levels không
  if (levels.length === 0) {
    return {
      criterion: rule.criterion,
      maxScore: maxPossibleScore,
      achievedScore: rawAchievedScore,
      reason: customReason || `Đạt ${Math.round(normalizedScore * 100)}% yêu cầu`
    };
  }
  
  // Tìm level phù hợp
  const closestLevel = findClosestLevel(levels, rawAchievedScore);
  
  // Nếu không tìm thấy level nào (chỉ xảy ra khi levels là mảng rỗng),
  // sử dụng điểm tính toán
  if (!closestLevel) {
    return {
      criterion: rule.criterion,
      maxScore: maxPossibleScore,
      achievedScore: rawAchievedScore,
      reason: customReason || `Đạt ${Math.round(normalizedScore * 100)}% yêu cầu`
    };
  }
  
  // Sử dụng điểm từ level thay vì điểm tính toán, để đảm bảo nhất quán với rubric
  return {
    criterion: rule.criterion,
    maxScore: maxPossibleScore,
    achievedScore: closestLevel.score,
    reason: customReason || closestLevel.description
  };
}

/**
 * Tính điểm tuyệt đối dựa trên giá trị Boolean
 * @param rule Tiêu chí rubric đang áp dụng
 * @param passed Có đạt yêu cầu hay không
 * @param reasonIfPassed Lý do khi đạt yêu cầu
 * @param reasonIfFailed Lý do khi không đạt yêu cầu
 */
export function calculateBooleanScore(
  rule: RubricCriterion,
  passed: boolean,
  reasonIfPassed: string,
  reasonIfFailed: string
): GradingDetail {
  // Nếu không có levels, sử dụng maxScore hoặc 0
  if (!rule.levels || rule.levels.length === 0) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: passed ? rule.maxScore : 0,
      reason: passed ? reasonIfPassed : reasonIfFailed
    };
  }
  
  // Nếu có levels, tìm level cao nhất và thấp nhất
  const sortedLevels = [...rule.levels].sort((a, b) => b.score - a.score);
  const highestLevel = sortedLevels[0];
  const lowestLevel = sortedLevels[sortedLevels.length - 1];
  
  if (passed) {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: highestLevel ? highestLevel.score : rule.maxScore,
      reason: reasonIfPassed || (highestLevel ? highestLevel.description : "Đạt yêu cầu")
    };
  } else {
    return {
      criterion: rule.criterion,
      maxScore: rule.maxScore,
      achievedScore: lowestLevel ? lowestLevel.score : 0,
      reason: reasonIfFailed || (lowestLevel ? lowestLevel.description : "Không đạt yêu cầu")
    };
  }
}

/**
 * Tính điểm dựa trên mức độ hoàn thành (không dựa trên levels)
 * Phù hợp cho các tiêu chí đơn giản không có levels chi tiết
 * @param rule Tiêu chí rubric đang áp dụng
 * @param completionRatio Tỷ lệ hoàn thành (0-1)
 * @param reason Lý do cho điểm số này
 */
export function calculateSimpleScore(
  rule: RubricCriterion,
  completionRatio: number,
  reason: string
): GradingDetail {
  // Đảm bảo tỷ lệ trong khoảng [0, 1]
  const normalizedRatio = Math.max(0, Math.min(1, completionRatio));
  
  return {
    criterion: rule.criterion,
    maxScore: rule.maxScore,
    achievedScore: Math.round(rule.maxScore * normalizedRatio * 100) / 100, // Làm tròn 2 chữ số
    reason
  };
}
