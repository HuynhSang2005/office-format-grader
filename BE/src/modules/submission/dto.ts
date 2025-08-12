import { z } from 'zod';

export const SubmissionResultSchema = z.object({
  submission: z.object({ filename: z.string() }),
});

export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;
