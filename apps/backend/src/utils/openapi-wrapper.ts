/**
 * @file openapi-wrapper.ts
 * @description Utility functions to wrap controllers for OpenAPI documentation
 * @author Nguyễn Huỳnh Sang
 */

import type { Context } from 'hono';

/**
 * Wrap a controller function to ensure it returns the correct type for OpenAPIHono
 * @param controller The original controller function
 * @returns A wrapped function that returns a Response compatible with OpenAPIHono
 */
export function wrapControllerForOpenAPI<T>(controller: (c: Context) => Promise<T>) {
  return async (c: Context): Promise<Response> => {
    try {
      const result = await controller(c);
      // If the result is already a Response, return it directly
      if (result instanceof Response) {
        return result;
      }
      // Otherwise, convert it to a Response
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in wrapped controller:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}