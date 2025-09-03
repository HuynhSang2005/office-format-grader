import { AIGradingService } from '../ai/grading.service';
import { env } from '../../config/environment';

/**
 * Factory function to create AI grading service with proper configuration
 */
export function createAIGradingService(): AIGradingService {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for AI grading service');
  }
  
  return new AIGradingService(env.GEMINI_API_KEY);
}