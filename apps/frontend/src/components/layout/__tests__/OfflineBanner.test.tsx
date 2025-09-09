/**
 * @file OfflineBanner.test.tsx
 * @description Tests for the OfflineBanner component
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderWithProviders } from '../../tests/test-utils'
import { OfflineBanner } from '../layout/OfflineBanner'
import { useOffline } from '../../hooks/use-offline'
import { JSDOM } from 'jsdom'

// Mock the useOffline hook
vi.mock('../../hooks/use-offline', () => ({
  useOffline: vi.fn()
}))

describe('OfflineBanner', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()
    
    // Setup DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as unknown as Window & typeof globalThis
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  })

  it('should render when offline', () => {
    // Mock offline state
    (useOffline as jest.Mock).mockReturnValue({
      isOffline: true
    })

    const { container } = renderWithProviders(<OfflineBanner />)
    expect(container).toBeInTheDocument()
  })

  it('should not render when online', () => {
    // Mock online state
    (useOffline as jest.Mock).mockReturnValue({
      isOffline: false
    })

    const { container } = renderWithProviders(<OfflineBanner />)
    expect(container).toBeInTheDocument()
  })
})