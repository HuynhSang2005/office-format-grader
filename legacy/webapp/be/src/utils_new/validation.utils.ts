import type { z } from "zod";

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Phone number validation regex (international format)
 */
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Strong password regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * File name validation regex (safe characters only)
 */
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult<string> {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({
      field: "email",
      message: "Email is required",
      code: "REQUIRED",
    });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
      code: "INVALID_FORMAT",
      value: email,
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? email.toLowerCase().trim() : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate URL
 */
export function validateUrl(url: string, options?: { allowedProtocols?: string[] }): ValidationResult<string> {
  const { allowedProtocols = ["http", "https"] } = options || {};
  const errors: ValidationError[] = [];
  
  if (!url) {
    errors.push({
      field: "url",
      message: "URL is required",
      code: "REQUIRED",
    });
  } else if (!URL_REGEX.test(url)) {
    errors.push({
      field: "url",
      message: "Invalid URL format",
      code: "INVALID_FORMAT",
      value: url,
    });
  } else {
    // Check protocol
    try {
      const urlObj = new URL(url);
      if (!allowedProtocols.includes(urlObj.protocol.replace(":", ""))) {
        errors.push({
          field: "url",
          message: `Protocol ${urlObj.protocol} is not allowed. Allowed: ${allowedProtocols.join(", ")}`,
          code: "INVALID_PROTOCOL",
          value: urlObj.protocol,
        });
      }
    } catch {
      errors.push({
        field: "url",
        message: "Invalid URL format",
        code: "INVALID_FORMAT",
        value: url,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? url.trim() : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult<string> {
  const errors: ValidationError[] = [];
  
  if (!phone) {
    errors.push({
      field: "phone",
      message: "Phone number is required",
      code: "REQUIRED",
    });
  } else {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!PHONE_REGEX.test(cleanPhone)) {
      errors.push({
        field: "phone",
        message: "Invalid phone number format",
        code: "INVALID_FORMAT",
        value: phone,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? phone.replace(/[\s\-\(\)]/g, "") : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string, options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}): ValidationResult<string> {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options || {};

  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push({
      field: "password",
      message: "Password is required",
      code: "REQUIRED",
    });
  } else {
    // Check length
    if (password.length < minLength) {
      errors.push({
        field: "password",
        message: `Password must be at least ${minLength} characters long`,
        code: "TOO_SHORT",
        value: password.length,
      });
    }

    // Check uppercase
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one uppercase letter",
        code: "MISSING_UPPERCASE",
      });
    }

    // Check lowercase
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one lowercase letter",
        code: "MISSING_LOWERCASE",
      });
    }

    // Check numbers
    if (requireNumbers && !/\d/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one number",
        code: "MISSING_NUMBER",
      });
    }

    // Check special characters
    if (requireSpecialChars && !/[@$!%*?&]/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one special character (@$!%*?&)",
        code: "MISSING_SPECIAL_CHAR",
      });
    }

    // Common password warnings
    if (password.toLowerCase().includes("password")) {
      warnings.push("Password should not contain the word 'password'");
    }

    if (/(.)\1{2,}/.test(password)) {
      warnings.push("Password should not contain repeated characters");
    }

    if (/123|abc|qwe/i.test(password)) {
      warnings.push("Password should not contain common sequences");
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? password : undefined,
    errors,
    warnings,
  };
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = "value"
): ValidationResult<number> {
  const errors: ValidationError[] = [];

  if (value === null || value === undefined || isNaN(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: "INVALID_TYPE",
      value,
    });
  } else {
    if (min !== undefined && value < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        code: "TOO_SMALL",
        value,
      });
    }

    if (max !== undefined && value > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        code: "TOO_LARGE",
        value,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? value : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = "value"
): ValidationResult<string> {
  const errors: ValidationError[] = [];

  if (typeof value !== "string") {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: "INVALID_TYPE",
      value,
    });
  } else {
    if (min !== undefined && value.length < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
        code: "TOO_SHORT",
        value: value.length,
      });
    }

    if (max !== undefined && value.length > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at most ${max} characters long`,
        code: "TOO_LONG",
        value: value.length,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? value : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate array
 */
export function validateArray<T = any>(
  value: any,
  min?: number,
  max?: number,
  fieldName: string = "value"
): ValidationResult<T[]> {
  const errors: ValidationError[] = [];

  if (!Array.isArray(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be an array`,
      code: "INVALID_TYPE",
      value,
    });
  } else {
    if (min !== undefined && value.length < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must contain at least ${min} items`,
        code: "TOO_FEW_ITEMS",
        value: value.length,
      });
    }

    if (max !== undefined && value.length > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must contain at most ${max} items`,
        code: "TOO_MANY_ITEMS",
        value: value.length,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? value : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate date
 */
export function validateDate(
  value: any,
  min?: Date,
  max?: Date,
  fieldName: string = "date"
): ValidationResult<Date> {
  const errors: ValidationError[] = [];
  let date: Date;

  try {
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new Error("Invalid date type");
    }

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date value");
    }
  } catch {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid date`,
      code: "INVALID_DATE",
      value,
    });
    return { isValid: false, errors, warnings: [] };
  }

  if (min && date < min) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be after ${min.toISOString()}`,
      code: "TOO_EARLY",
      value: date.toISOString(),
    });
  }

  if (max && date > max) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be before ${max.toISOString()}`,
      code: "TOO_LATE",
      value: date.toISOString(),
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? date : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Validate enum value
 */
export function validateEnum<T = string>(
  value: any,
  allowedValues: T[],
  fieldName: string = "value"
): ValidationResult<T> {
  const errors: ValidationError[] = [];

  if (!allowedValues.includes(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      code: "INVALID_ENUM_VALUE",
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? value : undefined,
    errors,
    warnings: [],
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults<T = any>(
  results: ValidationResult[],
  data?: T
): ValidationResult<T> {
  const allErrors = results.flatMap(result => result.errors);
  const allWarnings = results.flatMap(result => result.warnings);

  return {
    isValid: allErrors.length === 0,
    data: allErrors.length === 0 ? data : undefined,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Convert Zod error to validation errors
 */
export function zodErrorToValidationErrors(zodError: z.ZodError): ValidationError[] {
  return zodError.issues.map(issue => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    code: issue.code,
    value: (issue as any).received,
  }));
}

/**
 * Validation utilities collection
 */
export const ValidationUtils = {
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validatePassword,
  validateNumericRange,
  validateStringLength,
  validateArray,
  validateDate,
  validateEnum,
  combineValidationResults,
  zodErrorToValidationErrors,

  /**
   * Validate required field
   */
  required: (value: any, fieldName: string = "field"): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return {
        isValid: false,
        errors: [{
          field: fieldName,
          message: `${fieldName} is required`,
          code: "REQUIRED",
        }],
        warnings: [],
      };
    }

    return {
      isValid: true,
      data: value,
      errors: [],
      warnings: [],
    };
  },

  /**
   * Validate file name
   */
  fileName: (filename: string): ValidationResult<string> => {
    const errors: ValidationError[] = [];

    if (!filename) {
      errors.push({
        field: "filename",
        message: "Filename is required",
        code: "REQUIRED",
      });
    } else {
      if (filename.length > 255) {
        errors.push({
          field: "filename",
          message: "Filename too long (max 255 characters)",
          code: "TOO_LONG",
          value: filename.length,
        });
      }

      if (!SAFE_FILENAME_REGEX.test(filename)) {
        errors.push({
          field: "filename",
          message: "Filename contains invalid characters. Only letters, numbers, dots, underscores, and hyphens are allowed",
          code: "INVALID_CHARACTERS",
          value: filename,
        });
      }

      if (filename.startsWith(".") || filename.endsWith(".")) {
        errors.push({
          field: "filename",
          message: "Filename cannot start or end with a dot",
          code: "INVALID_FORMAT",
          value: filename,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? filename : undefined,
      errors,
      warnings: [],
    };
  },

  /**
   * Validate API key format
   */
  apiKey: (apiKey: string): ValidationResult<string> => {
    const errors: ValidationError[] = [];

    if (!apiKey) {
      errors.push({
        field: "apiKey",
        message: "API key is required",
        code: "REQUIRED",
      });
    } else {
      if (apiKey.length < 20) {
        errors.push({
          field: "apiKey",
          message: "API key too short (minimum 20 characters)",
          code: "TOO_SHORT",
          value: apiKey.length,
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
        errors.push({
          field: "apiKey",
          message: "API key contains invalid characters",
          code: "INVALID_FORMAT",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? apiKey : undefined,
      errors,
      warnings: [],
    };
  },

  /**
   * Regular expressions for validation
   */
  REGEX: {
    EMAIL: EMAIL_REGEX,
    URL: URL_REGEX,
    PHONE: PHONE_REGEX,
    STRONG_PASSWORD: STRONG_PASSWORD_REGEX,
    SAFE_FILENAME: SAFE_FILENAME_REGEX,
  },
};