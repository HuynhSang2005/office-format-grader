/**
 * @file use-offline.ts
 * @description Hook to detect offline status and show banner
 * @author Your Name
 */

import { useEffect, useState } from 'react'

interface OfflineState {
  isOffline: boolean
  isOnline: boolean
}

export const useOffline = (): OfflineState => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOffline,
    isOnline: !isOffline,
  }
}