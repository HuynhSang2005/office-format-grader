import { z } from 'zod';

export const PowerPointSchema = z.object({ fileName: z.string() });
export type PowerPointDTO = z.infer<typeof PowerPointSchema>;
