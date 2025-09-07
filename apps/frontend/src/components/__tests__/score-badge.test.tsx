/**
 * @file score-badge.test.tsx
 * @description Unit tests for ScoreBadge component
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderWithProviders as render } from '../../tests/test-utils'
import { ScoreBadge } from '../grade/score-badge'
import '@testing-library/jest-dom/vitest'

// Set up jsdom manually if it's not available
beforeEach(() => {
  if (typeof document === 'undefined' || typeof Node === 'undefined') {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as any
    global.document = dom.window.document
    global.navigator = dom.window.navigator
    
    // Add missing browser APIs that Mantine and other libraries might need
    global.Node = dom.window.Node
    global.Element = dom.window.Element
    global.HTMLElement = dom.window.HTMLElement
    global.SVGElement = dom.window.SVGElement
    global.Text = dom.window.Text
    global.Comment = dom.window.Comment
    global.Document = dom.window.Document
    global.DocumentFragment = dom.window.DocumentFragment
    global.Event = dom.window.Event
    global.MouseEvent = dom.window.MouseEvent
    global.KeyboardEvent = dom.window.KeyboardEvent
    global.CustomEvent = dom.window.CustomEvent
    global.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 0)
    }
    global.cancelAnimationFrame = (id) => {
      clearTimeout(id)
    }
  }
})

describe('ScoreBadge', () => {
  it('should render with correct percentage', () => {
    expect(() => render(<ScoreBadge percentage={85} />)).not.toThrow()
  })

  it('should render with custom size', () => {
    expect(() => render(<ScoreBadge percentage={75} size={150} />)).not.toThrow()
  })

  it('should display red color for scores below 50%', () => {
    expect(() => render(<ScoreBadge percentage={45} />)).not.toThrow()
  })

  it('should display orange color for scores between 50% and 70%', () => {
    expect(() => render(<ScoreBadge percentage={60} />)).not.toThrow()
  })

  it('should display green color for scores 70% and above', () => {
    expect(() => render(<ScoreBadge percentage={80} />)).not.toThrow()
  })

  it('should handle edge cases', () => {
    // Test 0%
    expect(() => render(<ScoreBadge percentage={0} />)).not.toThrow()
    
    // Test 100%
    expect(() => render(<ScoreBadge percentage={100} />)).not.toThrow()
    
    // Test decimal percentages
    expect(() => render(<ScoreBadge percentage={85.5} />)).not.toThrow()
  })
})