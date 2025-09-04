/**
 * @file auth.schema.ts
 * @description Zod schemas cho xác thực người dùng
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';

// Schema cho login request body
export const LoginRequestSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc')
});

// Schema cho login response
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.number(),
    email: z.string().email()
  }),
  token: z.string()
});

// Schema cho logout response
export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

// Schema cho current user response
export const CurrentUserResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string().email()
  })
});

// Schema cho error response
export const AuthErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});

// Export types từ schemas
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;