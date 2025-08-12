import { z } from 'zod';

export const SubmissionSchema = z.object({ filename: z.string() });
export type SubmissionDTO = z.infer<typeof SubmissionSchema>;
