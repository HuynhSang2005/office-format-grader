// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

describe('Simple test', () => {
  it('should work', () => {
    expect(1).toBe(1)
  })
  
  it('should have access to document', () => {
    expect(document).toBeDefined()
  })
})