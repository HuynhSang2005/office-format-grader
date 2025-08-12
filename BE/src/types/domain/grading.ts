export interface GradingDetail {
  criterion: string;
  maxScore: number;
  achievedScore: number;
  reason: string;
}

export interface GradingResult {
  totalAchievedScore: number;
  totalMaxScore: number;
  details: GradingDetail[];
}
