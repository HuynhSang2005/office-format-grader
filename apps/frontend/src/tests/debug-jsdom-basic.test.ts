// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest'

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

describe('Debug Basic JSDOM', () => {
  it('should have document defined', () => {
    expect(typeof document).toBe('object')
  })

  it('should have window defined', () => {
    expect(typeof window).toBe('object')
  })
})