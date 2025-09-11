/**
 * @file customRubric.service.ts
 * @description Service xử lý Custom Rubric: CRUD operations, validation, và tính toán điểm
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { PrismaClient } from '@prisma/client';
import type { Rubric } from '@/types/criteria';
import type { CustomRubric, CreateCustomRubricRequest, UpdateCustomRubricRequest } from '@/types/custom-rubric.types';
import { createCriterion as createCriterionService, updateCriterion as updateCriterionService, deleteCriterion as deleteCriterionService } from './criteria-crud.service';

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
    
    // Tạo các criterion riêng lẻ từ rubric content để có thể list được
    for (const criterion of request.content.criteria) {
      try {
        await createCriterionService({
          name: criterion.name,
          description: criterion.description,
          detectorKey: criterion.detectorKey,
          maxPoints: criterion.maxPoints,
          levels: criterion.levels
        });
      } catch (error) {
        logger.warn(`Không thể tạo criterion riêng lẻ cho ${criterion.id}:`, error);
        // Continue with other criteria even if one fails
      }
    }
    
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
    
    // Nếu có content mới, cập nhật các criterion riêng lẻ
    if (request.content) {
      try {
        // Tạo lại các criterion mới từ rubric content
        for (const criterion of request.content.criteria) {
          try {
            // Kiểm tra xem criterion đã tồn tại chưa
            const existingCriterion = await prisma.criterion.findUnique({
              where: { id: criterion.id }
            });
            
            if (existingCriterion) {
              // Nếu đã tồn tại, cập nhật nó
              await updateCriterionService(criterion.id, {
                name: criterion.name,
                description: criterion.description,
                detectorKey: criterion.detectorKey,
                maxPoints: criterion.maxPoints,
                levels: criterion.levels
              });
            } else {
              // Nếu chưa tồn tại, tạo mới
              await createCriterionService({
                name: criterion.name,
                description: criterion.description,
                detectorKey: criterion.detectorKey,
                maxPoints: criterion.maxPoints,
                levels: criterion.levels
              });
            }
          } catch (error) {
            logger.warn(`Không thể cập nhật criterion riêng lẻ cho ${criterion.id}:`, error);
            // Continue with other criteria even if one fails
          }
        }
      } catch (error) {
        logger.warn('Lỗi khi cập nhật các criterion riêng lẻ:', error);
      }
    }
    
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
    // Lấy custom rubric trước khi xóa để có danh sách criteria
    const customRubric = await prisma.customRubric.findUnique({
      where: { id }
    });
    
    if (customRubric) {
      try {
        // Parse content để lấy danh sách criteria
        const content = JSON.parse(customRubric.content);
        if (content.criteria && Array.isArray(content.criteria)) {
          // Xóa các criterion riêng lẻ liên quan đến rubric này
          for (const criterion of content.criteria) {
            try {
              await deleteCriterionService(criterion.id);
            } catch (error) {
              logger.warn(`Không thể xóa criterion ${criterion.id}:`, error);
              // Continue with other criteria even if one fails
            }
          }
        }
      } catch (error) {
        logger.warn('Lỗi khi xóa các criterion riêng lẻ:', error);
      }
    }
    
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
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate required fields
    if (!rubric.name || rubric.name.trim().length === 0) {
      errors.push('name: Required');
    }
    if (!rubric.version || rubric.version.trim().length === 0) {
      errors.push('version: Required');
    }
    if (!rubric.fileType || !['PPTX', 'DOCX', 'ZIP', 'RAR'].includes(rubric.fileType)) {
      errors.push('fileType: Must be one of PPTX, DOCX, ZIP, RAR');
    }
    if (typeof rubric.totalMaxPoints !== 'number' || rubric.totalMaxPoints <= 0) {
      errors.push('totalMaxPoints: Must be a positive number');
    }
    if (!rubric.rounding || !['half_up_0.25', 'none'].includes(rubric.rounding)) {
      errors.push('rounding: Must be one of half_up_0.25, none');
    }
    if (!rubric.criteria || !Array.isArray(rubric.criteria) || rubric.criteria.length === 0) {
      errors.push('criteria: Must be a non-empty array');
    }
    
    // Validate criteria if they exist
    if (rubric.criteria && Array.isArray(rubric.criteria)) {
      rubric.criteria.forEach((criterion, index) => {
        if (!criterion.id || criterion.id.trim().length === 0) {
          errors.push(`criteria[${index}].id: Required`);
        }
        if (!criterion.name || criterion.name.trim().length === 0) {
          errors.push(`criteria[${index}].name: Required`);
        }
        if (!criterion.detectorKey || criterion.detectorKey.trim().length === 0) {
          errors.push(`criteria[${index}].detectorKey: Required`);
        }
        if (typeof criterion.maxPoints !== 'number' || criterion.maxPoints <= 0) {
          errors.push(`criteria[${index}].maxPoints: Must be a positive number`);
        }
        if (!criterion.levels || !Array.isArray(criterion.levels) || criterion.levels.length === 0) {
          errors.push(`criteria[${index}].levels: Must be a non-empty array`);
        }
        
        // Validate levels
        if (criterion.levels && Array.isArray(criterion.levels)) {
          criterion.levels.forEach((level, levelIndex) => {
            if (!level.code || level.code.trim().length === 0) {
              errors.push(`criteria[${index}].levels[${levelIndex}].code: Required`);
            }
            if (!level.name || level.name.trim().length === 0) {
              errors.push(`criteria[${index}].levels[${levelIndex}].name: Required`);
            }
            if (typeof level.points !== 'number') {
              errors.push(`criteria[${index}].levels[${levelIndex}].points: Must be a number`);
            }
            if (!level.description || level.description.trim().length === 0) {
              errors.push(`criteria[${index}].levels[${levelIndex}].description: Required`);
            }
          });
        }
      });
    }
    
    // Check if totalMaxPoints matches sum of criteria maxPoints
    if (rubric.criteria && Array.isArray(rubric.criteria)) {
      const calculatedTotal = rubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
      if (Math.abs(calculatedTotal - rubric.totalMaxPoints) > 0.01) {
        warnings.push(`Tổng điểm criteria (${calculatedTotal}) không khớp với totalMaxPoints (${rubric.totalMaxPoints})`);
      }
    }
    
    // Check for duplicate criterion IDs
    if (rubric.criteria && Array.isArray(rubric.criteria)) {
      const criterionIds = rubric.criteria.map(c => c.id);
      const duplicateIds = criterionIds.filter((id, index) => criterionIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Có criterion ID bị trùng: ${[...new Set(duplicateIds)].join(', ')}`);
      }
    }
    
    // Check for duplicate level codes within each criterion
    if (rubric.criteria && Array.isArray(rubric.criteria)) {
      rubric.criteria.forEach(criterion => {
        if (criterion.levels && Array.isArray(criterion.levels)) {
          const levelCodes = criterion.levels.map(l => l.code);
          const duplicateLevelCodes = levelCodes.filter((code, index) => levelCodes.indexOf(code) !== index);
          if (duplicateLevelCodes.length > 0) {
            errors.push(`Criterion ${criterion.id} có level code bị trùng: ${[...new Set(duplicateLevelCodes)].join(', ')}`);
          }
        }
      });
    }
    
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