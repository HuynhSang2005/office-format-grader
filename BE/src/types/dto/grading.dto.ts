import { z } from 'zod';

export const GradingResultSchema = z.object({
  totalAchievedScore: z.number(),
  totalMaxScore: z.number(),
});
export type GradingResultDto = z.infer<typeof GradingResultSchema>;
