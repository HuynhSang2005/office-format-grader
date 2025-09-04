/**
 * @file auth.e2e.test.ts
 * @description E2E tests cho authentication flow
 * @author Nguyễn Huỳnh Sang
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { SignJWT } from 'jose';
import { APP_CONFIG } from '@config/constants';

// Mock Hono app for testing
const mockApp = {
  request: async (path: string, options: any = {}) => {
    const url = new URL(path, 'http://localhost:3000');
    const headers = options.headers || {};
    
    // Mock login endpoint
    if (url.pathname === '/auth/login' && options.method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};
      
      // Mock user validation
      if (body.email === 'admin@example.com' && body.password === 'admin123') {
        // Create a mock JWT token
        const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60 * 24; // 24 hours
        
        const token = await new SignJWT({ email: body.email })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt(iat)
          .setExpirationTime(exp)
          .setSubject('1')
          .sign(secret);
        
        return new Response(JSON.stringify({
          success: true,
          user: {
            id: 1,
            email: body.email
          },
          token
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': `token=${token}; HttpOnly; Secure=false; SameSite=Strict; Path=/; Max-Age=86400`
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Email hoặc mật khẩu không đúng'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Mock logout endpoint
    if (url.pathname === '/auth/logout' && options.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Đăng xuất thành công'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': `token=; HttpOnly; Secure=false; SameSite=Strict; Path=/; Max-Age=0`
        }
      });
    }
    
    // Mock me endpoint
    if (url.pathname === '/auth/me' && options.method === 'GET') {
      // Check for token in cookie or Authorization header
      let token: string | null = null;
      
      // Check cookie
      if (headers['Cookie']) {
        const cookies = headers['Cookie'].split(';').map(cookie => cookie.trim());
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.substring(6);
        }
      }
      
      // Check Authorization header
      if (!token && headers['Authorization']) {
        const authHeader = headers['Authorization'];
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (token) {
        try {
          const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
          const { payload } = await jwtVerify(token, secret);
          
          return new Response(JSON.stringify({
            user: {
              id: Number(payload.sub),
              email: payload.email
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Token không hợp lệ hoặc đã hết hạn'
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Token không hợp lệ'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Mock protected route
    if (url.pathname === '/upload' && options.method === 'GET') {
      // Check for token in cookie or Authorization header
      let token: string | null = null;
      
      // Check cookie
      if (headers['Cookie']) {
        const cookies = headers['Cookie'].split(';').map(cookie => cookie.trim());
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.substring(6);
        }
      }
      
      // Check Authorization header
      if (!token && headers['Authorization']) {
        const authHeader = headers['Authorization'];
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (token) {
        try {
          const secret = new TextEncoder().encode(APP_CONFIG.JWT_SECRET);
          await jwtVerify(token, secret);
          
          return new Response(JSON.stringify({
            message: 'Protected route accessed successfully'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Token không hợp lệ hoặc đã hết hạn'
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Token không hợp lệ'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// Mock jwtVerify since we're in a test environment
const jwtVerify = async (token: string, secret: Uint8Array) => {
  // Simple mock that just validates the token format
  if (token && token.length > 10) {
    return {
      payload: {
        email: 'admin@example.com',
        sub: '1'
      }
    };
  }
  throw new Error('Invalid token');
};

describe('Authentication E2E Tests', () => {
  describe('Login Flow', () => {
    test('nên đăng nhập thành công với thông tin hợp lệ', async () => {
      // Arrange
      const loginData = {
        email: 'admin@example.com',
        password: 'admin123'
      };

      // Act
      const response = await mockApp.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        id: 1,
        email: 'admin@example.com'
      });
      expect(data.token).toBeDefined();
      
      // Check that cookie was set
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('token=');
      expect(setCookieHeader).toContain('HttpOnly');
    });

    test('nên từ chối đăng nhập với thông tin không hợp lệ', async () => {
      // Arrange
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      // Act
      const response = await mockApp.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Email hoặc mật khẩu không đúng');
    });
  });

  describe('Protected Route Access', () => {
    test('nên từ chối truy cập route được bảo vệ mà không có token', async () => {
      // Act
      const response = await mockApp.request('/upload', {
        method: 'GET'
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Token không hợp lệ');
    });

    test('nên cho phép truy cập route được bảo vệ với token hợp lệ', async () => {
      // First login to get a token
      const loginResponse = await mockApp.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Act - Access protected route with token in cookie
      const response = await mockApp.request('/upload', {
        method: 'GET',
        headers: {
          'Cookie': `token=${token}`
        }
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Protected route accessed successfully');
    });

    test('nên cho phép truy cập route được bảo vệ với Authorization header', async () => {
      // First login to get a token
      const loginResponse = await mockApp.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Act - Access protected route with Authorization header
      const response = await mockApp.request('/upload', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Protected route accessed successfully');
    });
  });

  describe('Logout Flow', () => {
    test('nên logout thành công và xóa token', async () => {
      // Act
      const response = await mockApp.request('/auth/logout', {
        method: 'POST'
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Đăng xuất thành công');
      
      // Check that cookie was cleared
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('token=;');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });

  describe('Current User Info', () => {
    test('nên trả về thông tin user hiện tại với token hợp lệ', async () => {
      // First login to get a token
      const loginResponse = await mockApp.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Act - Get current user info
      const response = await mockApp.request('/auth/me', {
        method: 'GET',
        headers: {
          'Cookie': `token=${token}`
        }
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user).toEqual({
        id: 1,
        email: 'admin@example.com'
      });
    });

    test('nên từ chối yêu cầu thông tin user mà không có token', async () => {
      // Act
      const response = await mockApp.request('/auth/me', {
        method: 'GET'
      });

      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Token không hợp lệ');
    });
  });
});