import type { Context, Next } from "hono";
import type { z } from "zod";

/**
 * Validation target types
 */
export type ValidationTarget = "body" | "query" | "params" | "headers" | "formData";

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
}

/**
 * Create validation middleware for specific schema and target
 */
export function validateSchema<T extends z.ZodType>(
  schema: T,
  target: ValidationTarget = "body"
) {
  return async (c: Context, next: Next) => {
    try {
      let data: any;

      // Extract data based on target
      switch (target) {
        case "body":
          data = await c.req.json().catch(() => ({}));
          break;
        case "query":
          data = c.req.query();
          break;
        case "params":
          data = c.req.param();
          break;
        case "headers":
          data = Object.fromEntries(c.req.raw.headers.entries());
          break;
        case "formData":
          const formData = await c.req.formData();
          data = Object.fromEntries(formData.entries());
          break;
        default:
          throw new Error(`Unsupported validation target: ${target}`);
      }

      // Validate data
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join(".") || target,
          message: issue.message,
          code: issue.code,
          received: issue.received,
        }));

        return c.json(
          {
            success: false,
            error: "Validation failed",
            details: errors,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      // Store validated data in context
      c.set(`validated_${target}`, result.data);
      await next();
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: "Validation error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return validateSchema(schema, "body");
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return validateSchema(schema, "query");
}

/**
 * Validate route parameters
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return validateSchema(schema, "params");
}

/**
 * Validate headers
 */
export function validateHeaders<T extends z.ZodType>(schema: T) {
  return validateSchema(schema, "headers");
}

/**
 * Validate form data
 */
export function validateFormData<T extends z.ZodType>(schema: T) {
  return validateSchema(schema, "formData");
}

/**
 * File upload validation middleware
 */
export function validateFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
  fieldName?: string;
}) {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = [".docx", ".pptx"],
    required = true,
    fieldName = "file",
  } = options;

  return async (c: Context, next: Next) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get(fieldName) as File | null;

      // Check if file is required
      if (required && !file) {
        return c.json(
          {
            success: false,
            error: "File upload required",
            message: `${fieldName} is required`,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      if (file) {
        // Validate file size
        if (file.size > maxSize) {
          return c.json(
            {
              success: false,
              error: "File too large",
              message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
              fileSize: file.size,
              maxSize,
              timestamp: new Date().toISOString(),
            },
            400
          );
        }

        // Validate file type
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
          return c.json(
            {
              success: false,
              error: "Invalid file type",
              message: `File type ${fileExtension} is not allowed`,
              allowedTypes,
              receivedType: fileExtension,
              timestamp: new Date().toISOString(),
            },
            400
          );
        }

        // Validate file content (basic check)
        if (file.size === 0) {
          return c.json(
            {
              success: false,
              error: "Empty file",
              message: "Uploaded file is empty",
              timestamp: new Date().toISOString(),
            },
            400
          );
        }

        // Store validated file info in context
        c.set("validated_file", {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          extension: fileExtension,
        });
      }

      await next();
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: "File validation error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  };
}

/**
 * Multiple file upload validation
 */
export function validateMultipleFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  minFiles?: number;
  fieldName?: string;
}) {
  const {
    maxSize = 50 * 1024 * 1024,
    allowedTypes = [".docx", ".pptx"],
    maxFiles = 10,
    minFiles = 1,
    fieldName = "files",
  } = options;

  return async (c: Context, next: Next) => {
    try {
      const formData = await c.req.formData();
      const files = formData.getAll(fieldName) as File[];

      // Check minimum files
      if (files.length < minFiles) {
        return c.json(
          {
            success: false,
            error: "Insufficient files",
            message: `At least ${minFiles} file(s) required`,
            received: files.length,
            minimum: minFiles,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      // Check maximum files
      if (files.length > maxFiles) {
        return c.json(
          {
            success: false,
            error: "Too many files",
            message: `Maximum ${maxFiles} file(s) allowed`,
            received: files.length,
            maximum: maxFiles,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      // Validate each file
      const validationErrors: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxSize) {
          validationErrors.push({
            file: file.name,
            error: "File too large",
            fileSize: file.size,
            maxSize,
          });
        }

        // Check file type
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
          validationErrors.push({
            file: file.name,
            error: "Invalid file type",
            receivedType: fileExtension,
            allowedTypes,
          });
        }

        // Check if file is empty
        if (file.size === 0) {
          validationErrors.push({
            file: file.name,
            error: "Empty file",
          });
        }
      }

      if (validationErrors.length > 0) {
        return c.json(
          {
            success: false,
            error: "File validation failed",
            details: validationErrors,
            timestamp: new Date().toISOString(),
          },
          400
        );
      }

      // Store validated files in context
      c.set("validated_files", files.map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: file.name.toLowerCase().substring(file.name.lastIndexOf(".")),
      })));

      await next();
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: "Multiple file validation error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  };
}

/**
 * Content type validation middleware
 */
export function validateContentType(allowedTypes: string[]) {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header("Content-Type");

    if (!contentType) {
      return c.json(
        {
          success: false,
          error: "Missing content type",
          message: "Content-Type header is required",
          timestamp: new Date().toISOString(),
        },
        400
      );
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    if (!isAllowed) {
      return c.json(
        {
          success: false,
          error: "Invalid content type",
          message: `Content type ${contentType} is not allowed`,
          allowedTypes,
          receivedType: contentType,
          timestamp: new Date().toISOString(),
        },
        415
      );
    }

    await next();
  };
}