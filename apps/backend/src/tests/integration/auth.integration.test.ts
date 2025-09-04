/**
 * @file auth.integration.test.ts
 * @description Integration tests cho authentication flow
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import { APP_CONFIG } from '@config/constants';
import { authGuard } from '@middlewares/auth.middleware';

// Mock Hono context for integration testing
const createMockContext = (options: {
  headers?: Record<string, string>;
  cookies?: string;
  body?: any;
}) => {
  const headers = new Map<string, string>();
  
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  if (options.cookies) {
    headers.set('Cookie', options.cookies);
  }

  // Create a proper mock response object with json method
  const mockResponse = {
    json: (data: any, status: number) => {
      return new Response(JSON.stringify(data), { status });
    }
  };

  const context: any = {
    req: {
      header: (name: string) => headers.get(name) || null,
      json: () => Promise.resolve(options.body || {}),
      method: 'GET',
      path: '/test'
    },
    res: {
      headers: new Map()
    },
    set: (key: string, value: any) => {
      context[key] = value;
    },
    get: (key: string) => context[key],
    json: mockResponse.json
  };

  return context;
};

describe('Authentication Integration Tests', () => {
  it('nên hoàn thành toàn bộ flow: tạo token -> xác thực -> truy cập route được bảo vệ', async () => {
    // 1. Tạo một token hợp lệ (mô phỏng quá trình login)
    const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // 1 hour

    const token = await new SignJWT({ email: 'integration@test.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setSubject('999')
      .sign(secret);

    // 2. Tạo context với token trong cookie
    const context = createMockContext({
      cookies: `token=${token}; Path=/`
    });

    // 3. Gọi middleware authGuard
    const next = () => Promise.resolve();
    const result = await authGuard(context, next);

    // 4. Kiểm tra kết quả
    expect(result).toBeUndefined(); // Middleware không trả về response => tiếp tục
    expect(context.user).toEqual({
      id: 999,
      email: 'integration@test.com'
    });

    // 5. Kiểm tra rằng next() đã được gọi (middleware cho phép tiếp tục)
    // (Chúng ta không thể kiểm tra trực tiếp next() vì nó là một hàm mock,
    // nhưng nếu không có lỗi và result là undefined thì next đã được gọi)
  });

  it('nên từ chối truy cập với token không hợp lệ', async () => {
    // 1. Tạo context với token không hợp lệ
    const context = createMockContext({
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    // 2. Gọi middleware authGuard
    const next = () => Promise.resolve();
    const response = await authGuard(context, next);

    // 3. Kiểm tra kết quả
    expect(response).toBeDefined();
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
    expect(data.message).toBe('Token không hợp lệ hoặc đã hết hạn');
  });
});