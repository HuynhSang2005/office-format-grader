/**
 * @file customRubric.service.ts
 * @description Service xử lý Custom Rubric: CRUD operations, validation, và tính toán điểm
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { PrismaClient } from '@prisma/client';
import type { Rubric } from '@/types/criteria';
import type { CustomRubric, CreateCustomRubricRequest, UpdateCustomRubricRequest } from '@/types/custom-rubric.types';
import { RubricSchema } from '@/schemas/rubric.schema';

const prisma = new PrismaClient();

// Tạo mới custom rubric
export async function createCustomRubric(request: CreateCustomRubricRequest): Promise<CustomRubric> {
  logger.info(`Đang tạo custom rubric: ${request.name} cho user: ${request.ownerId}`);
  
  try {
    // Validate rubric
    const validation = await validateRubric(request.content);
    if (!validation.isValid) {
      throw new Error(`Rubric không hợp lệ: ${validation.errors.join(', ')}`);
    }
    
    // Tính tổng điểm
    const total = calcTotal(request.content);
    
    // Tạo custom rubric trong DB
    const customRubric = await prisma.customRubric.create({
      data: {
        ownerId: request.ownerId, // Now correctly typed as number
        name: request.name,
        content: JSON.stringify(request.content),
        total,
        isPublic: request.isPublic ?? false
      }
    });
    
    logger.info(`Tạo custom rubric thành công: ${customRubric.id}`);
    
    return {
      id: customRubric.id,
      ownerId: customRubric.ownerId, // Now correctly typed as number
      name: customRubric.name,
      content: request.content,
      total: customRubric.total,
      isPublic: customRubric.isPublic,
      createdAt: customRubric.createdAt,
      updatedAt: customRubric.updatedAt
    };
  } catch (error) {
    logger.error('Lỗi khi tạo custom rubric:', error);
    throw new Error(`Không thể tạo custom rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Cập nhật custom rubric
export async function updateCustomRubric(id: string, request: UpdateCustomRubricRequest): Promise<CustomRubric> {
  logger.info(`Đang cập nhật custom rubric: ${id}`);
  
  try {
    // Nếu có content, validate rubric
    if (request.content) {
      const validation = await validateRubric(request.content);
      if (!validation.isValid) {
        throw new Error(`Rubric không hợp lệ: ${validation.errors.join(', ')}`);
      }
    }
    
    // Tính tổng điểm nếu có content
    let total: number | undefined;
    if (request.content) {
      total = calcTotal(request.content);
    }
    
    // Cập nhật custom rubric trong DB
    const customRubric = await prisma.customRubric.update({
      where: { id },
      data: {
        name: request.name,
        content: request.content ? JSON.stringify(request.content) : undefined,
        total,
        isPublic: request.isPublic,
        updatedAt: new Date()
      }
    });
    
    logger.info(`Cập nhật custom rubric thành công: ${customRubric.id}`);
    
    return {
      id: customRubric.id,
      ownerId: customRubric.ownerId, // Now correctly typed as number
      name: customRubric.name,
      content: request.content || JSON.parse(customRubric.content),
      total: customRubric.total,
      isPublic: customRubric.isPublic,
      createdAt: customRubric.createdAt,
      updatedAt: customRubric.updatedAt
    };
  } catch (error) {
    logger.error(`Lỗi khi cập nhật custom rubric ${id}:`, error);
    throw new Error(`Không thể cập nhật custom rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Xóa custom rubric
export async function deleteCustomRubric(id: string): Promise<void> {
  logger.info(`Đang xóa custom rubric: ${id}`);
  
  try {
    await prisma.customRubric.delete({
      where: { id }
    });
    
    logger.info(`Xóa custom rubric thành công: ${id}`);
  } catch (error) {
    logger.error(`Lỗi khi xóa custom rubric ${id}:`, error);
    throw new Error(`Không thể xóa custom rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Tìm custom rubric theo ID
export async function findCustomRubricById(id: string): Promise<CustomRubric | null> {
  logger.debug(`Đang tìm custom rubric: ${id}`);
  
  try {
    const customRubric = await prisma.customRubric.findUnique({
      where: { id }
    });
    
    if (!customRubric) {
      logger.debug(`Không tìm thấy custom rubric: ${id}`);
      return null;
    }
    
    logger.debug(`Tìm thấy custom rubric: ${id}`);
    
    return {
      id: customRubric.id,
      ownerId: customRubric.ownerId, // Now correctly typed as number
      name: customRubric.name,
      content: JSON.parse(customRubric.content),
      total: customRubric.total,
      isPublic: customRubric.isPublic,
      createdAt: customRubric.createdAt,
      updatedAt: customRubric.updatedAt
    };
  } catch (error) {
    logger.error(`Lỗi khi tìm custom rubric ${id}:`, error);
    throw new Error(`Không thể tìm custom rubric: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Liệt kê custom rubrics của user
export async function listCustomRubrics(ownerId: number): Promise<CustomRubric[]> { // Changed from string to number
  logger.debug(`Đang liệt kê custom rubrics cho user: ${ownerId}`);
  
  try {
    const customRubrics = await prisma.customRubric.findMany({
      where: { ownerId } // Now correctly typed as number
    });
    
    logger.debug(`Tìm thấy ${customRubrics.length} custom rubrics`);
    
    return customRubrics.map(rubric => ({
      id: rubric.id,
      ownerId: rubric.ownerId, // Now correctly typed as number
      name: rubric.name,
      content: JSON.parse(rubric.content),
      total: rubric.total,
      isPublic: rubric.isPublic,
      createdAt: rubric.createdAt,
      updatedAt: rubric.updatedAt
    }));
  } catch (error) {
    logger.error(`Lỗi khi liệt kê custom rubrics cho user ${ownerId}:`, error);
    throw new Error(`Không thể liệt kê custom rubrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validate rubric structure
export async function validateRubric(rubric: Rubric): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  logger.debug(`Đang validate rubric: ${rubric.name}`);
  
  try {
    // Use Zod schema to validate
    const result = RubricSchema.safeParse(rubric);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors, warnings: [] };
    }
    
    // Additional business logic validation
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if totalMaxPoints matches sum of criteria maxPoints
    const calculatedTotal = rubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
    if (Math.abs(calculatedTotal - rubric.totalMaxPoints) > 0.01) {
      warnings.push(`Tổng điểm criteria (${calculatedTotal}) không khớp với totalMaxPoints (${rubric.totalMaxPoints})`);
    }
    
    // Check for duplicate criterion IDs
    const criterionIds = rubric.criteria.map(c => c.id);
    const duplicateIds = criterionIds.filter((id, index) => criterionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Có criterion ID bị trùng: ${[...new Set(duplicateIds)].join(', ')}`);
    }
    
    // Check for duplicate level codes within each criterion
    rubric.criteria.forEach(criterion => {
      const levelCodes = criterion.levels.map(l => l.code);
      const duplicateLevelCodes = levelCodes.filter((code, index) => levelCodes.indexOf(code) !== index);
      if (duplicateLevelCodes.length > 0) {
        errors.push(`Criterion ${criterion.id} có level code bị trùng: ${[...new Set(duplicateLevelCodes)].join(', ')}`);
      }
    });
    
    logger.debug(`Validate rubric ${rubric.name}: ${errors.length} errors, ${warnings.length} warnings`);
    
    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings 
    };
  } catch (error) {
    logger.error(`Lỗi khi validate rubric ${rubric.name}:`, error);
    return { 
      isValid: false, 
      errors: [error instanceof Error ? error.message : 'Unknown error'], 
      warnings: [] 
    };
  }
}

// Calculate total points from rubric
export function calcTotal(rubric: Rubric): number {
  return rubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
}