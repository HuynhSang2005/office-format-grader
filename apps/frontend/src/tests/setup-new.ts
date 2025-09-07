/**
 * @file setup-new.ts
 * @description Test setup file for Vitest and React Testing Library
 * @author Your Name
 */

import '@testing-library/jest-dom'
import { JSDOM } from 'jsdom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Create a JSDOM instance
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
})

// Set up global objects
global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement as any

// Clean up after each test
afterEach(() => {
  cleanup()
})