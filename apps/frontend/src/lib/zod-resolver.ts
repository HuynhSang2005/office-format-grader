/**
 * @file zod-resolver.ts
 * @description Zod resolver wrapper to avoid type issues
 * @author Your Name
 */

import { zodResolver as originalZodResolver } from '@hookform/resolvers/zod'

// Create a wrapper that bypasses the type checking issues
// biome-ignore lint/suspicious/noExplicitAny: Needed to avoid type conflicts
export const zodResolver = (schema: any) => {
  // biome-ignore lint/suspicious/noExplicitAny: Needed to avoid type conflicts
  return originalZodResolver(schema) as any
}