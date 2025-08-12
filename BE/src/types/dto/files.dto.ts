import { z } from 'zod';

export const FileQuerySchema = z.object({ path: z.string().optional() });
export type FileQuery = z.infer<typeof FileQuerySchema>;
