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

// thông tin chi tiết về kết quả đánh giá một tiêu chí cụ thể
export interface GradingDetail {
  criterion: string; // Tên tiêu chí
  maxScore: number;  // Điểm tối đa có thể đạt được
  achievedScore: number; // Điểm đạt được
  reason: string;  // Giải thích lý do đạt được điểm này
}


// define kết quả đánh giá tổng thể của một file
// bao gồm tổng điểm đạt được, tổng điểm tối đa và chi tiết từng tiêu chí
export interface GradingResult {
  totalAchievedScore: number; // Tổng điểm đạt được
  totalMaxScore: number;     // Tổng điểm tối đa
  details: GradingDetail[];  // Chi tiết đánh giá từng tiêu chí
}

// Định nghĩa interface cho kết quả đánh giá PowerPoint
export interface PowerPointGradingResult {
  totalScore?: number;
  maxScore?: number;
  percentageScore?: number;
  criteria?: {
    [criterionId: string]: {
      name: string;
      score: number;
      maxScore: number;
      reason: string;
    }
  };
}
