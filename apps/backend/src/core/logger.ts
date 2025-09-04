/**
 * @file logger.ts
 * @description Logger hệ thống với thông báo tiếng Việt
 * @author Nguyễn Huỳnh Sang
 */

import type { LogLevel, LogEntry } from '@/types/core.types';

class Logger {
  private getTimestamp(): string {
    // Lấy time theo timezone Vietnam (UTC+7)
    const now = new Date();
    const utc7Offset = 7 * 60; // UTC+7 in minutes
    const utc7Time = new Date(now.getTime() + utc7Offset * 60000);
    
    // Format dd-mm-yyyy hh:mm:ss
    const day = String(utc7Time.getUTCDate()).padStart(2, '0');
    const month = String(utc7Time.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = utc7Time.getUTCFullYear();
    const hours = String(utc7Time.getUTCHours()).padStart(2, '0');
    const minutes = String(utc7Time.getUTCMinutes()).padStart(2, '0');
    const seconds = String(utc7Time.getUTCSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const emoji = {
      INFO: '✅',
      WARN: '⚠️',
      ERROR: '❌',
      DEBUG: '🐞'
    };

    const timestamp = this.getTimestamp();
    let formattedMessage = `${emoji[level]} [${level}] ${message}`;
    
    if (data) {
      formattedMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    formattedMessage += ` | ${timestamp}`;
    return formattedMessage;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.log('DEBUG', message, data);
    }
  }
}

export const logger = new Logger();