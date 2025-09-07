/**
 * @file query-client.ts
 * @description TanStack Query client configuration with offline support
 * @author Your Name
 */

import { QueryClient } from '@tanstack/react-query'
import { offlineAwareQueryOptions } from './query-sync'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: offlineAwareQueryOptions.retry,
      retryDelay: offlineAwareQueryOptions.retryDelay,
      networkMode: offlineAwareQueryOptions.networkMode,
    },
    mutations: {
      retry: offlineAwareQueryOptions.retry,
      networkMode: offlineAwareQueryOptions.networkMode,
    },
  },
})