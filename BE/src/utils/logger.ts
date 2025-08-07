/**
 * Tiện ích logging đơn giản hỗ trợ các level khác nhau và structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private minLevel: number;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = this.levels[minLevel];
  }

  /**
   * Set level nhỏ nhất sẽ được ghi log
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = this.levels[level];
  }

  /**
   * Ghi log với level debug
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  /**
   * Ghi log với level info
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  /**
   * Ghi log với level warn
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  /**
   * Ghi log với level error
   */
  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }

  /**
   * Ghi log với level và metadata cụ thể
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    // Kiểm tra nếu level hiện tại thấp hơn min level thì không ghi log
    if (this.levels[level] < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    let logObject: any = {
      timestamp,
      level,
      message
    };

    // Thêm metadata nếu có
    if (metadata) {
      logObject = { ...logObject, ...metadata };
    }

    // Chọn phương thức log phù hợp dựa trên level
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logObject));
        break;
      case 'info':
        console.info(JSON.stringify(logObject));
        break;
      case 'warn':
        console.warn(JSON.stringify(logObject));
        break;
      case 'error':
        console.error(JSON.stringify(logObject));
        break;
    }
  }
}

// Tạo và export một instance logger mặc định
// Lấy level từ biến môi trường hoặc mặc định là 'info'
const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
export const logger = new Logger(logLevel);