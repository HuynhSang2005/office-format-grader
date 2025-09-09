/**
 * @file use-export-excel.test.ts
 * @description Tests for useExportExcel hook
 * @author Your Name
 */

// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExportExcel } from '../use-export-excel'
import type { ReactNode } from 'react'

// Mock notifications
const mockShowNotification = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShowNotification
  }
}))

// Setup React Query client for testing
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('useExportExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return mutation object with correct structure', () => {
    // Render the hook
    const { result } = renderHook(() => useExportExcel(), { wrapper })

    // Check that the hook returns the expected structure
    expect(result.current).toBeDefined()
    expect(typeof result.current.mutate).toBe('function')
    expect(typeof result.current.mutateAsync).toBe('function')
    expect('isPending' in result.current).toBe(true)
    expect('isSuccess' in result.current).toBe(true)
    expect('isError' in result.current).toBe(true)
    expect('error' in result.current).toBe(true)
  })

  it('should accept onSuccess callback', () => {
    const mockOnSuccess = vi.fn()
    
    // Render the hook with onSuccess callback
    const { result } = renderHook(() => useExportExcel({ onSuccess: mockOnSuccess }), { wrapper })

    // Check that the hook returns the expected structure
    expect(result.current).toBeDefined()
    expect(typeof result.current.mutate).toBe('function')
  })
})