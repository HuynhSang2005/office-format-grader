/**
 * @file criteria-service.types.ts
 * @description Các kiểu dữ liệu cho criteria service
 * @author Nguyễn Huỳnh Sang
 */

import type { DetectorKey, FileType, Level } from './criteria';

/**
 * Interface cho supported criteria
 */
export interface SupportedCriteria {
  detectorKey: DetectorKey;
  name: string;
  description: string;
  fileTypes: FileType[];
  defaultMaxPoints: number;
  suggestedLevels: Level[];
}