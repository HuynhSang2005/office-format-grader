// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Set up jsdom manually if it's not available
beforeEach(() => {
  if (typeof document === 'undefined') {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    global.window = dom.window as any
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  }
})

const TestComponent = () => <div>Hello World</div>

describe('Debug JSDOM', () => {
  it('should have document defined', () => {
    expect(typeof document).toBe('object')
  })

  it('should render a component', () => {
    const { getByText } = render(<TestComponent />)
    expect(getByText('Hello World')).toBeInTheDocument()
  })
})