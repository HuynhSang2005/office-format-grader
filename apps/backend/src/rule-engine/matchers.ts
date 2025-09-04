/**
 * @file matchers.ts
 * @description Helper functions để so sánh ngưỡng và pattern matching
 * @author Nguyễn Huỳnh Sang
 */

import type { 
  ThresholdConfig, 
  StringMatchConfig, 
  CountThreshold, 
  ScoreMapping, 
  ComplexityLevel 
} from '@/types/rule-engine.types';

// So sánh số với ngưỡng
export function matchNumber(value: number, config: ThresholdConfig): boolean {
  if (config.exact !== undefined) {
    return value === config.exact;
  }
  
  if (config.values && config.values.length > 0) {
    return config.values.includes(value);
  }
  
  if (config.min !== undefined && value < config.min) {
    return false;
  }
  
  if (config.max !== undefined && value > config.max) {
    return false;
  }
  
  return true;
}

// So sánh string với pattern
export function matchString(value: string, config: StringMatchConfig): boolean {
  const targetValue = config.caseSensitive ? value : value.toLowerCase();
  
  if (config.exact) {
    const exactValue = config.caseSensitive ? config.exact : config.exact.toLowerCase();
    return targetValue === exactValue;
  }
  
  if (config.contains && config.contains.length > 0) {
    const containsValues = config.caseSensitive 
      ? config.contains 
      : config.contains.map(s => s.toLowerCase());
    return containsValues.some(s => targetValue.includes(s));
  }
  
  if (config.startsWith) {
    const startsWithValue = config.caseSensitive 
      ? config.startsWith 
      : config.startsWith.toLowerCase();
    return targetValue.startsWith(startsWithValue);
  }
  
  if (config.endsWith) {
    const endsWithValue = config.caseSensitive 
      ? config.endsWith 
      : config.endsWith.toLowerCase();
    return targetValue.endsWith(endsWithValue);
  }
  
  if (config.regex) {
    return config.regex.test(value);
  }
  
  return true;
}

// So sánh count/số lượng
export function matchCount(count: number, threshold: CountThreshold): boolean {
  if (threshold.exact !== undefined) {
    return count === threshold.exact;
  }
  
  if (threshold.min !== undefined && count < threshold.min) {
    return false;
  }
  
  if (threshold.max !== undefined && count > threshold.max) {
    return false;
  }
  
  return true;
}

// Kiểm tra array có chứa đủ elements theo yêu cầu
export function matchArrayLength<T>(array: T[], threshold: CountThreshold): boolean {
  return matchCount(array.length, threshold);
}

// Kiểm tra percentage trong khoảng
export function matchPercentage(value: number, min: number = 0, max: number = 100): boolean {
  return value >= min && value <= max;
}

// Kiểm tra boolean value
export function matchBoolean(value: boolean, expected: boolean): boolean {
  return value === expected;
}

// Kiểm tra file size trong khoảng cho phép
export function matchFileSize(sizeInBytes: number, minMB?: number, maxMB?: number): boolean {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (minMB !== undefined && sizeInMB < minMB) {
    return false;
  }
  
  if (maxMB !== undefined && sizeInMB > maxMB) {
    return false;
  }
  
  return true;
}

// Kiểm tra filename convention
export function matchFilenameConvention(
  filename: string, 
  pattern: RegExp = /^[A-Z0-9]+_[^_]+_[^_]+\.(pptx|docx)$/i
): boolean {
  return pattern.test(filename);
}

// Kiểm tra có elements nào match condition
export function hasMatchingElements<T>(
  array: T[], 
  predicate: (item: T) => boolean,
  threshold: CountThreshold = { min: 1 }
): boolean {
  const matchCount = array.filter(predicate).length;
  return matchCount >= (threshold.min || 0) && 
         (threshold.max === undefined || matchCount <= threshold.max);
}

// Kiểm tra tất cả elements đều match condition
export function allElementsMatch<T>(
  array: T[],
  predicate: (item: T) => boolean
): boolean {
  return array.length > 0 && array.every(predicate);
}

// Kiểm tra complexity level
export function matchComplexity(
  actualLevel: ComplexityLevel,
  requiredLevel: ComplexityLevel
): boolean {
  const levels: ComplexityLevel[] = ['simple', 'moderate', 'complex'];
  const actualIndex = levels.indexOf(actualLevel);
  const requiredIndex = levels.indexOf(requiredLevel);
  
  return actualIndex >= requiredIndex;
}

// Utility để tạo score mappings
export function selectScore(mappings: ScoreMapping[]): ScoreMapping {
  // Tìm mapping đầu tiên có condition = true
  const match = mappings.find(m => m.condition);
  
  if (!match) {
    // Nếu không có match nào, trả về mapping với điểm thấp nhất
    return mappings.reduce((min, current) => 
      current.points < min.points ? current : min
    );
  }
  
  return match;
}

// Utility để tạo score mappings
export function createScoreMappings(
  checks: Array<{
    condition: boolean;
    points: number;
    level: string;
    reason: string;
  }>
): ScoreMapping[] {
  return checks.sort((a, b) => b.points - a.points); // Sort by points descending
}