/**
 * @file hono-context.types.ts
 * @description Định nghĩa các kiểu dữ liệu cho mở rộng context Hono
 * @author Nguyễn Huỳnh Sang
 */

import type { UserContext } from './middleware.types';

// Type for extending Hono context
export type HonoContextExtension = {
  user: UserContext;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext;
  }
}
