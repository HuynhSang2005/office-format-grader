/**
 * @file openapi.test.ts
 * @description Tests for OpenAPI documentation endpoints
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

// Create a simple test route
const testRoute = createRoute({
  method: 'get',
  path: '/test',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string()
          })
        }
      },
      description: 'Test response'
    }
  }
});

// Create a test OpenAPI app
const testApp = new OpenAPIHono();
testApp.openapi(testRoute, (c) => {
  return c.json({ message: 'Hello World' });
});

describe('OpenAPI Documentation', () => {
  it('should generate OpenAPI spec', async () => {
    // Create a simple server to test the OpenAPI spec generation
    const spec = testApp.getOpenAPI31Document({
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      }
    });
    
    expect(spec).toBeDefined();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
  });
});