/**
 * @file simple.test.ts
 * @description Simple test to check if jsdom is working
 * @author Your Name
 */

import { describe, it, expect } from 'vitest'

// @vitest-environment jsdom

describe('Simple test', () => {
  it('should have access to window object', () => {
    expect(typeof window).toBe('object')
  })
  
  it('should have access to document object', () => {
    expect(typeof document).toBe('object')
  })
})