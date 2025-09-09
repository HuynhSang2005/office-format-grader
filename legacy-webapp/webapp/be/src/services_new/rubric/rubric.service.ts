import { logger } from '../../utils_new/logger.utils';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Rubric Service
 * Handles rubric loading, validation, and criteria management
 */
export class RubricService {
  private rubricCache: Map<string, any> = new Map();
  
  /**
   * Load PowerPoint rubric data
   */
  async getPowerPointRubric(): Promise<any> {
    try {
      const cacheKey = 'powerpoint-rubric';
      
      if (this.rubricCache.has(cacheKey)) {
        return this.rubricCache.get(cacheKey);
      }

      const rubricPath = path.join(process.cwd(), 'rubric-pptx.json');
      const rubricData = await this.loadRubricFile(rubricPath);
      
      this.rubricCache.set(cacheKey, rubricData);
      
      logger.info('PowerPoint rubric loaded successfully');
      return rubricData;
    } catch (error) {
      logger.error('Error loading PowerPoint rubric', { error: error.message });
      throw error;
    }
  }

  /**
   * Load Word rubric data
   */
  async getWordRubric(): Promise<any> {
    try {
      const cacheKey = 'word-rubric';
      
      if (this.rubricCache.has(cacheKey)) {
        return this.rubricCache.get(cacheKey);
      }

      const rubricPath = path.join(process.cwd(), 'rubric-docx.json');
      const rubricData = await this.loadRubricFile(rubricPath);
      
      this.rubricCache.set(cacheKey, rubricData);
      
      logger.info('Word rubric loaded successfully');
      return rubricData;
    } catch (error) {
      logger.error('Error loading Word rubric', { error: error.message });
      throw error;
    }
  }

  /**
   * Get specific criterion from rubric
   */
  async getCriterion(rubricType: 'powerpoint' | 'word', criterionId: string): Promise<any> {
    try {
      const rubric = rubricType === 'powerpoint' 
        ? await this.getPowerPointRubric() 
        : await this.getWordRubric();

      const criterion = rubric.criteria?.find((c: any) => c.id === criterionId);
      
      if (!criterion) {
        throw new Error(`Criterion ${criterionId} not found in ${rubricType} rubric`);
      }

      return criterion;
    } catch (error) {
      logger.error('Error getting criterion', { 
        rubricType, 
        criterionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate rubric structure
   */
  async validateRubric(rubricData: any): Promise<boolean> {
    try {
      // Basic validation of rubric structure
      if (!rubricData || typeof rubricData !== 'object') {
        throw new Error('Invalid rubric data structure');
      }

      if (!Array.isArray(rubricData.criteria)) {
        throw new Error('Rubric must contain criteria array');
      }

      // Validate each criterion
      for (const criterion of rubricData.criteria) {
        if (!criterion.id || !criterion.name) {
          throw new Error('Each criterion must have id and name');
        }
      }

      logger.info('Rubric validation successful', {
        criteriaCount: rubricData.criteria.length
      });

      return true;
    } catch (error) {
      logger.error('Rubric validation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear rubric cache
   */
  clearCache(): void {
    this.rubricCache.clear();
    logger.info('Rubric cache cleared');
  }

  /**
   * Load rubric file from filesystem
   */
  private async loadRubricFile(filePath: string): Promise<any> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const rubricData = JSON.parse(fileContent);
      
      await this.validateRubric(rubricData);
      
      return rubricData;
    } catch (error) {
      logger.error('Error loading rubric file', { 
        filePath, 
        error: error.message 
      });
      throw error;
    }
  }
}