/**
 * @file setup.ts
 * @description Test setup file for Vitest and React Testing Library
 * @author Your Name
 */

// Import modules first
import '@testing-library/jest-dom/vitest'

// Set up jsdom environment
try {
  // We're in a Node.js environment, set up jsdom
  const { JSDOM } = require('jsdom')

  // Create a comprehensive JSDOM instance
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  })

  // Set up global variables
  global.window = dom.window
  global.document = dom.window.document
  global.navigator = dom.window.navigator
  global.localStorage = dom.window.localStorage
  global.sessionStorage = dom.window.sessionStorage

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

  // Mock scrollTo since it's not implemented in jsdom
  Object.defineProperty(window, 'scrollTo', {
    value: () => {},
    writable: true,
  })
} catch (error) {
  console.warn('Failed to set up jsdom environment:', error)
}