/**
 * @file auth.middleware.test.ts
 * @description Unit tests cho auth middleware
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignJWT } from 'jose';
import { APP_CONFIG } from '@config/constants';
import { authGuard } from '@middlewares/auth.middleware';

// Mock Hono context
const createMockContext = (options: {
  headers?: Record<string, string>;
  cookies?: string;
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
    json: vi.fn((data, status) => {
      return new Response(JSON.stringify(data), { status });
    })
  };

  const context: any = {
    req: {
      header: vi.fn((name: string) => headers.get(name) || null),
      method: 'GET',
      path: '/test'
    },
    res: {
      headers: new Map()
    },
    set: vi.fn(),
    get: vi.fn(),
    json: mockResponse.json // Add json method to context
  };

  return context;
};

describe('Auth Middleware', () => {
  const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
  let validToken: string;

  beforeEach(async () => {
    // Create a valid token for testing
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // 1 hour

    validToken = await new SignJWT({ email: 'test@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setSubject('1')
      .sign(secret);
  });

  describe('Token Validation', () => {
    it('nên từ chối request không có token', async () => {
      const context = createMockContext({});
      const next = vi.fn();

      const response = await authGuard(context, next);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Token không hợp lệ');
      expect(next).not.toHaveBeenCalled();
    });

    it('nên từ chối token không hợp lệ', async () => {
      const context = createMockContext({
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      const next = vi.fn();

      const response = await authGuard(context, next);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Token không hợp lệ hoặc đã hết hạn');
      expect(next).not.toHaveBeenCalled();
    });

    it('nên chấp nhận token hợp lệ từ Authorization header', async () => {
      const context = createMockContext({
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const next = vi.fn();

      const result = await authGuard(context, next);
      
      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(context.set).toHaveBeenCalledWith('user', {
        id: 1,
        email: 'test@example.com'
      });
    });

    it('nên chấp nhận token hợp lệ từ cookie', async () => {
      const context = createMockContext({
        cookies: `token=${validToken}; Path=/`
      });
      const next = vi.fn();

      const result = await authGuard(context, next);
      
      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(context.set).toHaveBeenCalledWith('user', {
        id: 1,
        email: 'test@example.com'
      });
    });

    it('nên ưu tiên token từ cookie nếu có cả cookie và header', async () => {
      // Create another token with different user
      const anotherToken = await new SignJWT({ email: 'another@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(Math.floor(Date.now() / 1000))
        .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 60)
        .setSubject('2')
        .sign(secret);

      const context = createMockContext({
        headers: { 'Authorization': `Bearer ${validToken}` },
        cookies: `token=${anotherToken}; Path=/`
      });
      const next = vi.fn();

      const result = await authGuard(context, next);
      
      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(context.set).toHaveBeenCalledWith('user', {
        id: 2,
        email: 'another@example.com'
      });
    });

    it('nên từ chối token đã hết hạn', async () => {
      // Create an expired token
      const iat = Math.floor(Date.now() / 1000) - 60 * 60; // 1 hour ago
      const exp = iat - 60; // Expired 1 minute ago

      const expiredToken = await new SignJWT({ email: 'test@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .setSubject('1')
        .sign(secret);

      const context = createMockContext({
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });
      const next = vi.fn();

      const response = await authGuard(context, next);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Token không hợp lệ hoặc đã hết hạn');
      expect(next).not.toHaveBeenCalled();
    });
  });
});