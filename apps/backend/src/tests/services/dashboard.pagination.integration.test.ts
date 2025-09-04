/**
 * @file dashboard.pagination.integration.test.ts
 * @description Integration tests for dashboard pagination functionality with mock data
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Dashboard Pagination Integration Tests', () => {
  // Create test data before running tests
  beforeAll(async () => {
    // Create a test user if not exists
    let user = await prisma.user.findUnique({
      where: { email: 'test-pagination@example.com' }
    });
    
    if (!user) {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await prisma.user.create({
        data: {
          email: 'test-pagination@example.com',
          password: hashedPassword
        }
      });
    }
    
    // Create test grade results
    const testResults = [];
    for (let i = 1; i <= 25; i++) {
      testResults.push({
        id: uuidv4(),
        userId: user.id,
        filename: `test-file-${i}.pptx`,
        fileType: 'PPTX',
        totalPoints: 10 - (i * 0.2), // Decreasing scores: 9.8, 9.6, 9.4, ...
        byCriteria: JSON.stringify({}),
        gradedAt: new Date(Date.now() - (i * 3600000)) // Different times
      });
    }
    
    // Insert test data
    for (const result of testResults) {
      await prisma.gradeResult.upsert({
        where: { id: result.id },
        update: result,
        create: result
      });
    }
  });

  // Clean up test data after tests
  afterAll(async () => {
    // Delete test grade results
    await prisma.gradeResult.deleteMany({
      where: {
        filename: {
          startsWith: 'test-file-'
        }
      }
    });
    
    // Delete test user if it was created just for tests
    await prisma.user.deleteMany({
      where: { 
        email: 'test-pagination@example.com',
        gradeResults: {
          none: {} // Only delete if no grade results remain
        }
      }
    });
    
    await prisma.$disconnect();
  });

  describe('Pagination Functionality', () => {
    it('should return correct pagination metadata', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Test with 10 items per page, page 1
      const result = await dashboardService.topHighestWithPagination(30, 10, 0);
      
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalCount');
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      
      // Should have 10 items (or fewer if less than 10 exist)
      expect(result.results.length).toBeLessThanOrEqual(10);
      
      // Total count should be at least the number of results we got
      expect(result.totalCount).toBeGreaterThanOrEqual(result.results.length);
    });

    it('should handle different page sizes correctly', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Test with 5 items per page
      const result5 = await dashboardService.topHighestWithPagination(30, 5, 0);
      expect(result5.results.length).toBeLessThanOrEqual(5);
      
      // Test with 15 items per page
      const result15 = await dashboardService.topHighestWithPagination(30, 15, 0);
      expect(result15.results.length).toBeLessThanOrEqual(15);
      
      // Both should have the same total count
      expect(result5.totalCount).toBe(result15.totalCount);
    });

    it('should handle pagination correctly across multiple pages', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Get first page
      const page1 = await dashboardService.topHighestWithPagination(30, 5, 0);
      const page2 = await dashboardService.topHighestWithPagination(30, 5, 5);
      
      // Both pages should have results
      expect(page1.results.length).toBeGreaterThan(0);
      expect(page2.results.length).toBeGreaterThan(0);
      
      // Pages should have different data (assuming we have enough data)
      if (page1.results.length > 0 && page2.results.length > 0) {
        expect(page1.results[0].id).not.toBe(page2.results[0].id);
      }
      
      // Total counts should be the same
      expect(page1.totalCount).toBe(page2.totalCount);
    });

    it('should sort results correctly (highest first)', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      const result = await dashboardService.topHighestWithPagination(30, 10, 0);
      
      // Results should be sorted by totalPoints descending
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i-1].totalPoints).toBeGreaterThanOrEqual(result.results[i].totalPoints);
      }
    });

    it('should sort lowest results correctly (lowest first)', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      const result = await dashboardService.topLowestWithPagination(30, 10, 0);
      
      // Results should be sorted by totalPoints ascending
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i-1].totalPoints).toBeLessThanOrEqual(result.results[i].totalPoints);
      }
    });
  });
});