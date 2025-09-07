/**
 * @file server.ts
 * @description MSW server setup for mocking API requests in tests
 * @author Your Name
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers)