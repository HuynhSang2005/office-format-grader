// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderWithProviders as render, screen } from './test-utils'

// A simple component for testing
const SimpleComponent = () => <div>Hello World</div>

describe('SimpleComponent', () => {
  it('should render correctly', () => {
    render(<SimpleComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})