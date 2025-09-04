import type { Context } from 'hono';
import { successResponse, errorResponse } from '../utils_new/response.utils';
import { logger } from '../utils_new/logger.utils';
import { RubricService } from '../services_new/rubric/rubric.service';

/**
 * Rubric Controller
 * Handles rubric and criteria management endpoints
 */
export class RubricController {
  private rubricService: RubricService;

  constructor() {
    this.rubricService = new RubricService();
  }

  /**
   * Get PowerPoint rubric data
   */
  async getPowerPointRubric(c: Context): Promise<Response> {
    try {
      logger.info('PowerPoint rubric request received');
      
      const rubric = await this.rubricService.getPowerPointRubric();
      return successResponse(c, { rubric }, 'PowerPoint rubric retrieved successfully');
      
    } catch (error) {
      logger.error('Error getting PowerPoint rubric', { error: (error as Error).message });
      return errorResponse(c, 'Failed to retrieve PowerPoint rubric', 500);
    }
  }

  /**
   * Get Word rubric data
   */
  async getWordRubric(c: Context): Promise<Response> {
    try {
      logger.info('Word rubric request received');
      
      const rubric = await this.rubricService.getWordRubric();
      return successResponse(c, { rubric }, 'Word rubric retrieved successfully');
      
    } catch (error) {
      logger.error('Error getting Word rubric', { error: (error as Error).message });
      return errorResponse(c, 'Failed to retrieve Word rubric', 500);
    }
  }

  /**
   * Get specific criterion from PowerPoint rubric
   */
  async getPowerPointCriterion(c: Context): Promise<Response> {
    try {
      const criterionId = c.req.param('criterionId');
      logger.info('PowerPoint criterion request received', { criterionId });
      
      const criterion = await this.rubricService.getCriterion('powerpoint', criterionId);
      return successResponse(c, { criterion }, 'PowerPoint criterion retrieved successfully');
      
    } catch (error) {
      logger.error('Error getting PowerPoint criterion', { error: (error as Error).message });
      return errorResponse(c, 'Failed to retrieve PowerPoint criterion', 500);
    }
  }

  /**
   * Get specific criterion from Word rubric
   */
  async getWordCriterion(c: Context): Promise<Response> {
    try {
      const criterionId = c.req.param('criterionId');
      logger.info('Word criterion request received', { criterionId });
      
      const criterion = await this.rubricService.getCriterion('word', criterionId);
      return successResponse(c, { criterion }, 'Word criterion retrieved successfully');
      
    } catch (error) {
      logger.error('Error getting Word criterion', { error: (error as Error).message });
      return errorResponse(c, 'Failed to retrieve Word criterion', 500);
    }
  }

  /**
   * List all PowerPoint rubric criteria
   */
  async listPowerPointCriteria(c: Context): Promise<Response> {
    try {
      logger.info('PowerPoint criteria list request received');
      
      const rubric = await this.rubricService.getPowerPointRubric();
      const criteria = rubric.criteria || [];
      
      return successResponse(c, { criteria }, 'PowerPoint criteria listed successfully');
      
    } catch (error) {
      logger.error('Error listing PowerPoint criteria', { error: (error as Error).message });
      return errorResponse(c, 'Failed to list PowerPoint criteria', 500);
    }
  }

  /**
   * List all Word rubric criteria
   */
  async listWordCriteria(c: Context): Promise<Response> {
    try {
      logger.info('Word criteria list request received');
      
      const rubric = await this.rubricService.getWordRubric();
      const criteria = rubric.criteria || [];
      
      return successResponse(c, { criteria }, 'Word criteria listed successfully');
      
    } catch (error) {
      logger.error('Error listing Word criteria', { error: (error as Error).message });
      return errorResponse(c, 'Failed to list Word criteria', 500);
    }
  }

  /**
   * Validate rubric data structure
   */
  async validateRubric(c: Context): Promise<Response> {
    try {
      logger.info('Rubric validation request received');
      
      const rubricData = await c.req.json();
      const isValid = await this.rubricService.validateRubric(rubricData);
      
      return successResponse(c, { isValid }, 'Rubric validation completed');
      
    } catch (error) {
      logger.error('Error validating rubric', { error: (error as Error).message });
      return errorResponse(c, 'Failed to validate rubric', 500);
    }
  }

  /**
   * Clear rubric cache
   */
  async clearCache(c: Context): Promise<Response> {
    try {
      logger.info('Rubric cache clear request received');
      
      this.rubricService.clearCache();
      
      return successResponse(c, null, 'Rubric cache cleared successfully');
      
    } catch (error) {
      logger.error('Error clearing rubric cache', { error: (error as Error).message });
      return errorResponse(c, 'Failed to clear rubric cache', 500);
    }
  }
}