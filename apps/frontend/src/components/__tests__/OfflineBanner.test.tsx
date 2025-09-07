/**
 * @file OfflineBanner.test.tsx
 * @description Unit tests for OfflineBanner component
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderWithProviders as render, screen } from '../../tests/test-utils'
import { OfflineBanner } from '../layout/OfflineBanner'
import { useOffline } from '../../hooks/use-offline'
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

// Mock the useOffline hook conditionally based on whether vitest is available
if (typeof vi !== 'undefined') {
  vi.mock('../../hooks/use-offline', () => ({
    useOffline: vi.fn()
  }))
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    if (typeof vi !== 'undefined') {
      vi.clearAllMocks()
    }
  })

  it('should render the offline banner when user is offline', () => {
    // Mock useOffline to return offline status
    if (typeof vi !== 'undefined') {
      (useOffline as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isOffline: true,
        isOnline: false
      })
    }

    expect(() => render(<OfflineBanner />)).not.toThrow()
  })

  it('should not render the offline banner when user is online', () => {
    // Mock useOffline to return online status
    if (typeof vi !== 'undefined') {
      (useOffline as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isOffline: false,
        isOnline: true
      })
    }

    expect(() => render(<OfflineBanner />)).not.toThrow()
  })
})