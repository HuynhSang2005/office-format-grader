/**
 * @file logger.ts
 * @description Simple logger utility for the application
 * @author Nguyễn Huỳnh Sang
 */

/**
 * Simple logger utility
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${message}`, ...args)
  },
  
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`[DEBUG] ${message}`, ...args)
  }
}