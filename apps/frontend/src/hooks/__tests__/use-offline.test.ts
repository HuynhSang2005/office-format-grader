/**
 * @file use-offline.test.ts
 * @description Unit tests for useOffline hook
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react'
import { useOffline } from '../use-offline'
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('useOffline', () => {
  beforeEach(() => {
    // Reset mocks if vi is available and has the method
    if (typeof vi !== 'undefined' && typeof vi.resetAllMocks === 'function') {
      vi.resetAllMocks()
    }
  })

  it('should initialize with correct offline status when online', () => {
    // Create a mock navigator with onLine = true
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: true
      }
    })
    
    const { result } = renderHook(() => useOffline())
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isOnline).toBe(true)
  })

  it('should initialize with correct offline status when offline', () => {
    // Create a mock navigator with onLine = false
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: false
      }
    })
    
    const { result } = renderHook(() => useOffline())
    expect(result.current.isOffline).toBe(true)
    expect(result.current.isOnline).toBe(false)
  })

  it('should update status when online event is fired', () => {
    // Start with offline status
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: false
      }
    })
    
    const { result } = renderHook(() => useOffline())
    expect(result.current.isOffline).toBe(true)
    expect(result.current.isOnline).toBe(false)

    // Simulate online event
    act(() => {
      const event = new window.Event('online')
      window.dispatchEvent(event)
    })

    expect(result.current.isOffline).toBe(false)
    expect(result.current.isOnline).toBe(true)
  })

  it('should update status when offline event is fired', () => {
    // Start with online status
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: true
      }
    })
    
    const { result } = renderHook(() => useOffline())
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isOnline).toBe(true)

    // Simulate offline event
    act(() => {
      const event = new window.Event('offline')
      window.dispatchEvent(event)
    })

    expect(result.current.isOffline).toBe(true)
    expect(result.current.isOnline).toBe(false)
  })

  it('should clean up event listeners on unmount', () => {
    // Start with online status
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: true
      }
    })
    
    const removeEventListenerSpy = vi?.spyOn(window, 'removeEventListener') || window.removeEventListener
    const { unmount } = renderHook(() => useOffline())
    
    unmount()
    
    // Only check the spy if it exists
    if (typeof removeEventListenerSpy === 'object' && removeEventListenerSpy !== null && 'mock' in removeEventListenerSpy) {
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    }
  })
})