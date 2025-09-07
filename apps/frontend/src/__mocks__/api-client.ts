/**
 * @file api-client.ts
 * @description Mock axios instance for testing
 * @author Your Name
 */

import { vi } from 'vitest'

const mockApiClient = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn().mockReturnThis(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
}

export const apiClient = mockApiClient