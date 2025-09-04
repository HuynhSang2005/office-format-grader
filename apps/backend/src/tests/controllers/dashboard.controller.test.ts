/**
 * @file dashboard.controller.test.ts
 * @description Unit tests cho dashboard controller
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';

describe('Dashboard Controller', () => {
  describe('Module Import', () => {
    it('should import dashboard controller functions successfully', async () => {
      // Dynamically import the controller to avoid mocking issues
      const dashboardController = await import('@controllers/dashboard.controller');
      
      expect(dashboardController).toBeDefined();
      expect(typeof dashboardController.getDashboardStatsController).toBe('function');
    });
  });

  describe('Controller Function', () => {
    it('should be a valid function', async () => {
      const dashboardController = await import('@controllers/dashboard.controller');
      
      expect(typeof dashboardController.getDashboardStatsController).toBe('function');
    });
  });
});