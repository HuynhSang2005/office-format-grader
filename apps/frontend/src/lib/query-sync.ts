/**
 * @file query-sync.ts
 * @description TanStack Query offline cache and retry functionality
 * @author Nguyễn Huỳnh Sang
 */

import { onlineManager } from '@tanstack/react-query'

// Configure onlineManager to use browser online status
onlineManager.setEventListener((setOnline) => {
  const handleOnline = () => setOnline(true)
  const handleOffline = () => setOnline(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
})

/**
 * Custom retry function that respects offline status
 */
const customRetry = (failureCount: number, _error: unknown): boolean => {
  // Don't retry if we're offline
  if (!onlineManager.isOnline()) {
    return false
  }

  // Retry up to 3 times for network errors
  if (failureCount < 3) {
    return true
  }

  return false
}

/**
 * Custom retry delay function with exponential backoff
 */
const customRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000) // Max 30 seconds
}

/**
 * Offline-aware query options
 */
export const offlineAwareQueryOptions = {
  retry: customRetry,
  retryDelay: customRetryDelay,
  networkMode: 'offlineFirst' as const,
}