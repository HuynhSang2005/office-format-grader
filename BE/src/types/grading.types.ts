// define structure cho một mức điểm trong một tiêu chí
export interface RubricLevel {
  score: number;
  description: string;
}

// define một tiêu chí chấm điểm hoàn chỉnh
export interface RubricCriterion {
  id: string; // Một ID duy nhất để gọi hàm check tương ứng
  criterion: string;
  maxScore: number;
  levels: RubricLevel[];
}

// các type này có thể tái sử dụng từ api.types.ts
export interface GradingDetail {
  criterion: string;
  maxScore: number;
  achievedScore: number;
  reason: string;
}

// define kết quả chấm điểm tổng thể
// bao gồm tổng điểm đạt được, tổng điểm tối đa và chi tiết từng tiêu chí
export interface GradingResult {
  totalAchievedScore: number;
  totalMaxScore: number;
  details: GradingDetail[];
}