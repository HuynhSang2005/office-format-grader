/**
 * @file env.ts
 * @description Environment variables configuration with Zod validation
 * @author Nguyễn Huỳnh Sang
 */

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.string().url().default('http://localhost:3001'),
    VITE_APP_NAME: z.string().default('Office Format Grader'),
    VITE_DEBUG: z
      .string()
      .transform((s) => s === 'true')
      .or(z.boolean())
      .default(false),
  },
  // Server-side environment variables (not used in frontend but defined for completeness)
  server: {},
  // Runtime environment variables
  runtimeEnv: import.meta.env,
  // Handle empty strings as undefined
  emptyStringAsUndefined: true,
})