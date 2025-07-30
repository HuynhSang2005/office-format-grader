import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const successResponse = (c: Context, data: any, message: string = 'Thành công', statusCode: ContentfulStatusCode = 200) => {
  return c.json({
    success: true,
    message,
    data,
  }, statusCode);
};


export const errorResponse = (c: Context, message: string, statusCode: ContentfulStatusCode) => {
  return c.json({
    success: false,
    error: {
      message,
    },
  }, statusCode);
};