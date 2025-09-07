// @vitest-environment jsdom

import { describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { renderWithProviders } from './test-utils'
import '@testing-library/jest-dom/vitest'

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

// A simple component for testing
const SimpleComponent = () => <div>Hello World</div>

describe('SimpleComponent', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(<SimpleComponent />)
    expect(getByText('Hello World')).toBeInTheDocument()
  })
})