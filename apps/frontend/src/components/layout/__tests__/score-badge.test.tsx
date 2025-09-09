/**
 * @file score-badge.test.tsx
 * @description Tests for the ScoreBadge component
 * @author Your Name
 */

import { renderWithProviders as render } from '../../../tests/test-utils'
import { ScoreBadge } from '../../grade/score-badge'
import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

describe('ScoreBadge', () => {
  beforeEach(() => {
    // Set up jsdom environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as unknown as Window & typeof globalThis
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  })

  it('should render with excellent score', () => {
    const { container } = render(<ScoreBadge percentage={95} />)
    expect(container).toBeInTheDocument()
  })

  it('should render with good score', () => {
    const { container } = render(<ScoreBadge percentage={75} />)
    expect(container).toBeInTheDocument()
  })

  it('should render with average score', () => {
    const { container } = render(<ScoreBadge percentage={65} />)
    expect(container).toBeInTheDocument()
  })

  it('should render with poor score', () => {
    const { container } = render(<ScoreBadge percentage={45} />)
    expect(container).toBeInTheDocument()
  })
  
  it('should render with default value when percentage is undefined', () => {
    const { container } = render(<ScoreBadge />)
    expect(container).toBeInTheDocument()
  })
})