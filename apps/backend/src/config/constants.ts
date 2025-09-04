/**
 * @file constants.ts
 * @description Các config cấu hình BE
 * @author Nguyễn Huỳnh Sang
 */

export const APP_CONFIG = {
  // Server config
  DEFAULT_PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // File upload limits
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
  MAX_FILES_PER_BATCH: parseInt(process.env.MAX_FILES_PER_BATCH || '60', 10),
  ALLOWED_FILE_TYPES: ['pptx', 'docx'] as const,
  
  // JWT config
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Grading system
  DEFAULT_ROUNDING: 'half_up_0.25' as const,
  MIN_POINTS: 0,
  MAX_POINTS: 10,
  
  // File naming convention regex
  FILENAME_PATTERN: /^[A-Z0-9]+_[^_]+_[^_]+\.(pptx|docx)$/i
} as const;

// Cleanup configuration
export const CLEANUP_CONFIG = {
  INTERVAL: parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10), // 1 hour default
  OLDER_THAN_HOURS: parseInt(process.env.CLEANUP_OLDER_THAN_HOURS || '3', 10) // 3 hours default
} as const;

// Metadata cleanup configuration (14 days retention)
export const METADATA_CLEANUP_CONFIG = {
  RETENTION_DAYS: parseInt(process.env.METADATA_RETENTION_DAYS || '14', 10), // 14 days default
  SCHEDULE: process.env.METADATA_CLEANUP_SCHEDULE || '0 2 * * *' // 2AM daily
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Thông tin đăng nhập không đúng',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện hành động này',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  
  // File processing
  FILE_TOO_LARGE: 'File quá lớn, vui lòng chọn file nhỏ hơn 50MB',
  INVALID_FILE_TYPE: 'Loại file không được hỗ trợ. Chỉ chấp nhận .pptx và .docx',
  FILE_CORRUPTED: 'File bị lỗi hoặc không thể đọc được',
  INVALID_FILENAME: 'Tên file không đúng định dạng: <MSSV>_<HọTên>_<Buổi>',
  
  // Grading
  RUBRIC_INVALID: 'Rubric không hợp lệ',
  CRITERIA_NOT_FOUND: 'Không tìm thấy tiêu chí chấm điểm',
  GRADING_FAILED: 'Quá trình chấm điểm thất bại',
  
  // General
  INTERNAL_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau',
  VALIDATION_ERROR: 'Dữ liệu đầu vào không hợp lệ'
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',
  FILE_UPLOADED: 'Upload file thành công',
  GRADING_COMPLETED: 'Chấm điểm hoàn tất',
  EXPORT_SUCCESS: 'Xuất file Excel thành công'
} as const;