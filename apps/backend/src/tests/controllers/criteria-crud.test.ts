/**
 * @file criteria-crud.test.ts
 * @description Test CRUD operations cho criteria
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Criteria CRUD Tests', () => {
  beforeAll(async () => {
    // Ensure we have a clean state before tests
    await prisma.criterion.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup after tests
    await prisma.criterion.deleteMany({});
    await prisma.$disconnect();
  });

  it('should create a new criterion', async () => {
    // This would normally be an API call, but we're testing the service directly
    const testCriterion = {
      name: 'Test Criterion',
      description: 'A test criterion for unit testing',
      detectorKey: 'test.detector',
      maxPoints: 5,
      levels: [
        {
          points: 0,
          code: '0',
          name: 'Không đạt',
          description: 'Không đạt yêu cầu'
        },
        {
          points: 5,
          code: '5',
          name: 'Đạt',
          description: 'Đạt yêu cầu'
        }
      ]
    };

    // Since we're not running the full server, we'll test the service directly
    const created = await prisma.criterion.create({
      data: {
        name: testCriterion.name,
        description: testCriterion.description,
        detectorKey: testCriterion.detectorKey,
        maxPoints: testCriterion.maxPoints,
        levels: JSON.stringify(testCriterion.levels)
      }
    });

    expect(created).toBeDefined();
    expect(created.name).toBe(testCriterion.name);
    expect(created.detectorKey).toBe(testCriterion.detectorKey);
    
    // Clean up
    await prisma.criterion.delete({ where: { id: created.id } });
  });

  it('should list all criteria', async () => {
    // Create a few test criteria
    const criteria = [
      {
        name: 'Test Criterion 1',
        description: 'First test criterion',
        detectorKey: 'test.detector1',
        maxPoints: 5,
        levels: JSON.stringify([
          { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
          { points: 5, code: '5', name: 'Đạt', description: 'Đạt yêu cầu' }
        ])
      },
      {
        name: 'Test Criterion 2',
        description: 'Second test criterion',
        detectorKey: 'test.detector2',
        maxPoints: 10,
        levels: JSON.stringify([
          { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
          { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
          { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
        ])
      }
    ];

    // Create test criteria
    for (const criterion of criteria) {
      await prisma.criterion.create({ data: criterion });
    }

    // List all criteria
    const allCriteria = await prisma.criterion.findMany({
      orderBy: { createdAt: 'desc' }
    });

    expect(allCriteria).toHaveLength(2);
    expect(allCriteria[0].name).toBe('Test Criterion 2'); // Most recent first
    expect(allCriteria[1].name).toBe('Test Criterion 1');

    // Clean up
    await prisma.criterion.deleteMany({});
  });
});