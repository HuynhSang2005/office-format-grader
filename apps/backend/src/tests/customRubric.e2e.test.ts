/**
 * @file customRubric.e2e.test.ts
 * @description Test E2E cho chức năng Custom Rubric CRUD + chấm linh hoạt
 * @author AI Agent
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createCustomRubric, findCustomRubricById, updateCustomRubric, deleteCustomRubric } from '@services/customRubric.service';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Custom Rubric E2E Tests', () => {
  // Tạo user test
  let testUserId: string;
  
  beforeAll(async () => {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash('test123', 10);
    // Tạo user test nếu chưa tồn tại
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup: xóa custom rubrics test
    await prisma.customRubric.deleteMany({
      where: { ownerId: testUserId }
    });
    
    // Đóng kết nối DB
    await prisma.$disconnect();
  });

  it('should create, read, update, and delete custom rubric', async () => {
    // 1. Tạo custom rubric
    const createRequest = {
      ownerId: 'test-user',
      name: 'Test Rubric',
      content: {
        name: 'Test Rubric',
        version: '1.0',
        fileType: 'DOCX' as const,
        totalMaxPoints: 10,
        rounding: 'half_up_0.25' as const,
        criteria: [
          {
            id: 'docx_toc',
            name: 'Table of Contents',
            description: 'Has a table of contents',
            detectorKey: 'docx.toc' as const,
            maxPoints: 2,
            levels: [
              {
                code: 'toc_0',
                name: 'No TOC',
                points: 0,
                description: 'No table of contents'
              },
              {
                code: 'toc_1',
                name: 'Basic TOC',
                points: 1,
                description: 'Basic table of contents'
              },
              {
                code: 'toc_2',
                name: 'Advanced TOC',
                points: 2,
                description: 'Advanced table of contents'
              }
            ]
          }
        ]
      },
      isPublic: false
    };

    const createdRubric = await createCustomRubric(createRequest);
    expect(createdRubric).toBeDefined();
    expect(createdRubric.name).toBe('Test Rubric');
    expect(createdRubric.ownerId).toBe(testUserId);
    expect(createdRubric.total).toBe(2);
    expect(createdRubric.isPublic).toBe(false);

    // 2. Đọc custom rubric
    const fetchedRubric = await findCustomRubricById(createdRubric.id);
    expect(fetchedRubric).toBeDefined();
    expect(fetchedRubric?.name).toBe('Test Rubric');
    expect(fetchedRubric?.content.criteria.length).toBe(1);
    expect(fetchedRubric?.content.criteria[0].id).toBe('test_criterion');

    // 3. Cập nhật custom rubric
    const updateRequest = {
      ownerId: 'test-user',
      name: 'Updated Test Rubric',
      content: {
        name: 'Updated Test Rubric',
        version: '1.0',
        fileType: 'DOCX' as const,
        totalMaxPoints: 10,
        rounding: 'half_up_0.25' as const,
        criteria: [
          {
            id: 'docx_toc',
            name: 'Table of Contents',
            description: 'Has a table of contents',
            detectorKey: 'docx.toc' as const,
            maxPoints: 2,
            levels: [
              {
                code: 'toc_0',
                name: 'No TOC',
                points: 0,
                description: 'No table of contents'
              },
              {
                code: 'toc_1',
                name: 'Basic TOC',
                points: 1,
                description: 'Basic table of contents'
              },
              {
                code: 'toc_2',
                name: 'Advanced TOC',
                points: 2,
                description: 'Advanced table of contents'
              }
            ]
          }
        ]
      },
      isPublic: false
    };

    const updatedRubric = await updateCustomRubric(createdRubric.id, updateRequest);
    expect(updatedRubric).toBeDefined();
    expect(updatedRubric.name).toBe('Updated Test Rubric');
    expect(updatedRubric.isPublic).toBe(true);
    expect(updatedRubric.content.criteria.length).toBe(2);
    expect(updatedRubric.total).toBe(3.5); // 2 + 1.5

    // 4. Xóa custom rubric
    await deleteCustomRubric(createdRubric.id);
    
    // Kiểm tra rubric đã bị xóa
    const deletedRubric = await findCustomRubricById(createdRubric.id);
    expect(deletedRubric).toBeNull();
  });

  it('should validate custom rubric and return warnings', async () => {
    // Tạo rubric với tổng điểm ≠ 10
    const createRequest = {
      ownerId: testUserId,
      name: 'Test Rubric with Warning',
      content: {
        name: 'Test Rubric with Warning',
        version: '1.0',
        fileType: 'DOCX' as const,
        totalMaxPoints: 5, // Không bằng 10
        rounding: 'half_up_0.25' as const,
        criteria: [
          {
            id: 'test_criterion_warn',
            name: 'Test Criterion',
            description: 'Test criterion for testing',
            detectorKey: 'docx.toc' as const,
            maxPoints: 5,
            levels: [
              {
                code: 'test_warn_0',
                name: 'Không đạt',
                points: 0,
                description: 'Không đạt yêu cầu'
              },
              {
                code: 'test_warn_1',
                name: 'Đạt',
                points: 5,
                description: 'Đạt yêu cầu'
              }
            ]
          }
        ]
      },
      isPublic: false
    };

    const createdRubric = await createCustomRubric(createRequest);
    expect(createdRubric).toBeDefined();
    expect(createdRubric.total).toBe(5);
    
    // Cleanup
    await deleteCustomRubric(createdRubric.id);
  });
});