import { ManualGradingService } from '../grading/manual.service';
import { RubricService } from '../rubric/rubric.service';
import { FileProcessingService } from '../file/processing.service';

/**
 * Factory function to create grading services with dependencies
 */
export function createGradingServices() {
  const rubricService = new RubricService();
  const fileService = new FileProcessingService();
  const manualGradingService = new ManualGradingService();
  
  return {
    manual: manualGradingService,
    rubric: rubricService,
    file: fileService
  };
}