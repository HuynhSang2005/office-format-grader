/**
 * @file user.schema.ts
 * @description User Zod schemas
 * @author Your Name
 */

import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
})

export type User = z.infer<typeof UserSchema>