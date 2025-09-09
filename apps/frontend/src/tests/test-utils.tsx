/**
 * @file test-utils.tsx
 * @description Custom test utilities and providers for testing components and hooks
 * @author Your Name
 */

import type React from 'react'
import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { JSDOM } from 'jsdom'
import { MantineProvider } from '@mantine/core'

// Create a test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Custom render function that wraps components with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  queryClient?: QueryClient
}

interface TestProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

const TestProviders = ({ children, queryClient }: TestProvidersProps) => {
  const client = queryClient || createTestQueryClient()
  
  return (
    <MantineProvider>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </MantineProvider>
  )
}

export const renderWithProviders = (
  ui: ReactElement,
  { queryClient, ...renderOptions }: CustomRenderOptions = {}
): RenderResult => {
  const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TestProviders queryClient={queryClient}>
      {children}
    </TestProviders>
  )
  
  return render(ui, { wrapper, ...renderOptions })
}

// Custom renderHook function that wraps hooks with providers
interface RenderHookOptions {
  queryClient?: QueryClient
}

export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  { queryClient }: RenderHookOptions = {}
) => {
  const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TestProviders queryClient={queryClient}>
      {children}
    </TestProviders>
  )
  
  // This is a simplified version - in a real implementation, you would use
  // @testing-library/react-hooks or similar
  return {
    result: { current: hook({} as TProps) },
    wrapper
  }
}

// Setup DOM environment for tests
export const setupDomEnvironment = () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost'
  })
  
  global.window = dom.window as unknown as Window & typeof globalThis
  global.document = dom.window.document
  global.navigator = dom.window.navigator
  
  return dom
}

// Clean up DOM environment
export const cleanupDomEnvironment = () => {
  // @ts-expect-error
  global.window = undefined
  // @ts-expect-error
  global.document = undefined
  // @ts-expect-error
  global.navigator = undefined
}

export * from '@testing-library/react'