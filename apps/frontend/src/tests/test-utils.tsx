/**
 * @file test-utils.tsx
 * @description Custom render function for testing with providers
 * @author Your Name
 */

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook } from '@testing-library/react'
import { theme } from '../styles/theme'
import React, { ReactElement } from 'react'

// Create a new query client for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function that wraps components with providers
export const renderWithProviders = (
  ui: ReactElement,
  { 
    queryClient = createTestQueryClient(),
    ...renderOptions 
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MantineProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Custom renderHook function that wraps hooks with providers
export const renderHookWithProviders = (
  hook: (props: any) => any,
  { 
    queryClient = createTestQueryClient(),
    ...renderOptions 
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MantineProvider>
  )

  return renderHook(hook, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from testing-library
export * from '@testing-library/react'