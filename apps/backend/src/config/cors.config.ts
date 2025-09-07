/**
 * @file cors.config.ts
 * @description Cấu hình CORS cho ứng dụng
 * @author Nguyễn Huỳnh Sang
 */

import { cors } from 'hono/cors';
import type { Context } from 'hono';

// Danh sách các origin được phép trong production (có thể cấu hình qua env)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

// Cấu hình CORS
export const corsConfig = cors({
  // Trong môi trường development, cho phép tất cả origins
  // Trong production, kiểm tra origin có trong danh sách cho phép không
  origin: (origin, c: Context) => {
    // Nếu không có origin (request trực tiếp), cho phép
    if (!origin) return '*';
    
    // Trong development, cho phép tất cả
    if (process.env.NODE_ENV === 'development') {
      return origin;
    }
    
    // Trong production, chỉ cho phép các origin trong danh sách
    if (ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }
    
    // Mặc định trả về origin đầu tiên trong danh sách cho phép
    return ALLOWED_ORIGINS[0] || '*';
  },
  allowHeaders: [
    'X-Custom-Header', 
    'Upgrade-Insecure-Requests', 
    'Content-Type', 
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-Time'  // Add this line to allow the custom header from frontend
  ],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
});