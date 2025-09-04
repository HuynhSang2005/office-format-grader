/**
 * @file core.types.ts
 * @description Các kiểu dữ liệu cho core modules
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Type cho log level
 */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Interface cho log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}