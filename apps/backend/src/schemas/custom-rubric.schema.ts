/**
 * @file custom-rubric.schema.ts
 * @description Zod schemas cho chức năng custom rubric
 * @author Nguyễn Huỳnh Sang
 */

import { z } from 'zod';
import { DetectorKeySchema, RubricSchema } from './rubric.schema';

// Schema cho create custom rubric request
export const CreateCustomRubricSchema = z.object({
  ownerId: z.number(), // Changed from string to number to match Prisma schema
  name: z.string().min(1, 'Tên rubric không được rỗng').max(100, 'Tên rubric quá dài'),
  content: RubricSchema,
  isPublic: z.boolean().optional()
});

// Schema cho update custom rubric request
export const UpdateCustomRubricSchema = z.object({
  name: z.string().min(1, 'Tên rubric không được rỗng').max(100, 'Tên rubric quá dài').optional(),
  content: RubricSchema.optional(),
  isPublic: z.boolean().optional()
});

// Schema cho list custom rubrics query
export const ListCustomRubricsQuerySchema = z.object({
  ownerId: z.number() // Changed from string to number to match Prisma schema
});

// Schema cho custom rubric response
export const CustomRubricResponseSchema = z.object({
  id: z.string(),
  ownerId: z.number(),
  name: z.string(),
  content: RubricSchema,
  total: z.number(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Schema cho create custom rubric response
export const CreateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
});

// Schema cho update custom rubric response
export const UpdateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
});

// Schema cho delete custom rubric response
export const DeleteCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

// Schema cho get custom rubric response
export const GetCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CustomRubricResponseSchema
});

// Schema cho list custom rubrics response
export const ListCustomRubricsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CustomRubricResponseSchema)
});

// Schema cho validate custom rubric response
export const ValidateCustomRubricResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  })
});

// Schema cho error response
export const CustomRubricErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.array(z.object({
    path: z.array(z.string()),
    message: z.string()
  })).optional()
});

// Export types từ schemas
export type CreateCustomRubricRequest = z.infer<typeof CreateCustomRubricSchema>;
export type UpdateCustomRubricRequest = z.infer<typeof UpdateCustomRubricSchema>;
export type ListCustomRubricsQuery = z.infer<typeof ListCustomRubricsQuerySchema>;
export type CustomRubricResponse = z.infer<typeof CustomRubricResponseSchema>;
export type CreateCustomRubricResponse = z.infer<typeof CreateCustomRubricResponseSchema>;
export type UpdateCustomRubricResponse = z.infer<typeof UpdateCustomRubricResponseSchema>;
export type DeleteCustomRubricResponse = z.infer<typeof DeleteCustomRubricResponseSchema>;
export type GetCustomRubricResponse = z.infer<typeof GetCustomRubricResponseSchema>;
export type ListCustomRubricsResponse = z.infer<typeof ListCustomRubricsResponseSchema>;
export type ValidateCustomRubricResponse = z.infer<typeof ValidateCustomRubricResponseSchema>;
export type CustomRubricErrorResponse = z.infer<typeof CustomRubricErrorResponseSchema>;