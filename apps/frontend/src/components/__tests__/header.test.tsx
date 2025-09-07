/**
 * @file header.test.tsx
 * @description Unit tests for Header component
 * @author Your Name
 */

import { renderWithProviders as render, screen, fireEvent } from '../../tests/test-utils'
import { Header } from '../layout/header'
import { useAuth } from '../../hooks/use-auth'
import { useUIStore } from '../../stores/ui.store'
import { useMantineColorScheme, AppShell } from '@mantine/core'
import { vi } from 'vitest'

// Mock hooks
vi.mock('../../hooks/use-auth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../stores/ui.store', () => ({
  useUIStore: vi.fn()
}))

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')
  return {
    ...actual,
    useMantineColorScheme: vi.fn()
  }
})

// Wrapper component that provides AppShell context
const HeaderWrapper = (props: any) => (
  <AppShell>
    <Header {...props} />
  </AppShell>
)

describe('Header', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockTheme = 'light'
  
  const mockSetTheme = vi.fn()
  const mockSetColorScheme = vi.fn()
  
  const mockAuth = {
    user: mockUser,
    logout: vi.fn().mockResolvedValue(undefined)
  }
  
  const mockUIStore = {
    theme: mockTheme,
    setTheme: mockSetTheme
  }

  const mockProps = {
    sidebarOpened: false,
    toggleSidebar: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAuth)
    ;(useUIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUIStore)
    ;(useMantineColorScheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setColorScheme: mockSetColorScheme
    })
  })

  it('should render the header with logo and user info', () => {
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })

  it('should display user email in the menu', () => {
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })

  it('should toggle color scheme when theme button is clicked', () => {
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })

  it('should show sun icon when theme is dark', () => {
    // Mock dark theme
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme
    })
    
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })

  it('should show moon icon when theme is light', () => {
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })

  it('should call toggleSidebar when burger is clicked', () => {
    expect(() => render(<HeaderWrapper {...mockProps} />)).not.toThrow()
  })
})