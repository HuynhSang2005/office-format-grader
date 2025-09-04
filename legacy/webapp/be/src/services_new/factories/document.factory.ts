import { PowerPointParsingService } from '../document/powerpoint.service';
import { WordParsingService } from '../document/word.service';

/**
 * Factory function to create document parsing services
 */
export function createDocumentServices() {
  return {
    powerpoint: new PowerPointParsingService(),
    word: new WordParsingService()
  };
}