// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHookWithProviders } from './test-utils'

// Set up jsdom manually if it's not available
beforeEach(() => {
  if (typeof document === 'undefined') {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as any
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  }
})

// A simple hook for testing
const useTestHook = () => {
  return { value: 'test' }
}

describe('Debug Test Utils', () => {
  it('should be able to use renderHookWithProviders', () => {
    const { result } = renderHookWithProviders(() => useTestHook())
    expect(result.current.value).toBe('test')
  })
})