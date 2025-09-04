/**
 * @file auth.controller.test.ts
 * @description Unit tests cho auth controller
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authController } from '@controllers/auth.controller';

// Mock Hono context
const createMockContext = (options: {
  body?: any;
  headers?: Record<string, string>;
  user?: any;
}) => {
  const headers = new Map<string, string>();
  
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Create a proper mock response object with json method
  const mockResponse = {
    json: vi.fn((data, status) => {
      return new Response(JSON.stringify(data), { status });
    })
  };

  const context: any = {
    req: {
      json: vi.fn().mockResolvedValue(options.body || {}),
      header: vi.fn((name: string) => headers.get(name) || null)
    },
    res: {
      headers: new Map()
    },
    set: vi.fn(),
    get: vi.fn((key) => {
      if (key === 'user' && options.user) {
        return options.user;
      }
      return null;
    }),
    json: mockResponse.json // Add json method to context
  };

  return context;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('nên trả về thông tin user hiện tại', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com'
      };

      const context = createMockContext({
        user: mockUser
      });

      const response = await authController.getCurrentUser(context);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('nên logout thành công và xóa cookie', async () => {
      const context = createMockContext({});

      const response = await authController.logout(context);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Đăng xuất thành công');
      
      // Check that cookie was cleared
      expect(context.res.headers.has('Set-Cookie')).toBe(true);
      const cookieHeader = context.res.headers.get('Set-Cookie');
      expect(cookieHeader).toContain('token=;');
      expect(cookieHeader).toContain('Max-Age=0');
    });
  });
});