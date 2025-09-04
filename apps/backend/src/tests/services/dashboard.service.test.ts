/**
 * @file dashboard.service.test.ts
 * @description Unit tests cho dashboard service
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Dashboard Service', () => {
  describe('Module Import', () => {
    it('should import dashboard service functions successfully', async () => {
      // Dynamically import the service to avoid mocking issues
      const dashboardService = await import('@services/dashboard.service');
      
      expect(dashboardService).toBeDefined();
      expect(typeof dashboardService.totalGraded).toBe('function');
      expect(typeof dashboardService.totalUngraded).toBe('function');
      expect(typeof dashboardService.totalCustomRubrics).toBe('function');
      expect(typeof dashboardService.top5Highest).toBe('function');
      expect(typeof dashboardService.top5Lowest).toBe('function');
      expect(typeof dashboardService.ratioByScore).toBe('function');
      expect(typeof dashboardService.countByFileType).toBe('function');
      expect(typeof dashboardService.countByUploadDate).toBe('function');
      expect(typeof dashboardService.topHighestWithPagination).toBe('function');
      expect(typeof dashboardService.topLowestWithPagination).toBe('function');
    });
  });

  describe('Pagination Functions', () => {
    it('should return paginated results with correct structure', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Test topHighestWithPagination
      const highestResult = await dashboardService.topHighestWithPagination(14, 10, 0);
      expect(highestResult).toHaveProperty('results');
      expect(highestResult).toHaveProperty('totalCount');
      expect(Array.isArray(highestResult.results)).toBe(true);
      expect(typeof highestResult.totalCount).toBe('number');
      
      // Test topLowestWithPagination
      const lowestResult = await dashboardService.topLowestWithPagination(14, 10, 0);
      expect(lowestResult).toHaveProperty('results');
      expect(lowestResult).toHaveProperty('totalCount');
      expect(Array.isArray(lowestResult.results)).toBe(true);
      expect(typeof lowestResult.totalCount).toBe('number');
    });

    it('should handle pagination parameters correctly', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Test with different limit values
      const result1 = await dashboardService.topHighestWithPagination(14, 5, 0);
      const result2 = await dashboardService.topHighestWithPagination(14, 10, 0);
      
      expect(result1.results.length).toBeLessThanOrEqual(5);
      expect(result2.results.length).toBeLessThanOrEqual(10);
      
      // Test with offset
      const result3 = await dashboardService.topHighestWithPagination(14, 5, 5);
      expect(result3.results.length).toBeLessThanOrEqual(5);
    });

    it('should handle edge cases for parameters', async () => {
      const dashboardService = await import('@services/dashboard.service');
      
      // Test with 0 limit (should default to some value)
      const result1 = await dashboardService.topHighestWithPagination(14, 0, 0);
      expect(Array.isArray(result1.results)).toBe(true);
      
      // Test with negative offset (should be handled)
      const result2 = await dashboardService.topHighestWithPagination(14, 10, -5);
      expect(Array.isArray(result2.results)).toBe(true);
    });
  });
});