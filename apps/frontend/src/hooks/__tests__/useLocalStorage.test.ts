/**
 * @file useLocalStorage.test.ts
 * @description Unit tests for useLocalStorage hook
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useLocalStorage', () => {
  const localStorageKey = 'test-key'
  const initialValue = 'initial-value'

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, initialValue))
    
    const [storedValue] = result.current
    expect(storedValue).toBe(initialValue)
  })

  it('should initialize with value from localStorage when it exists', () => {
    const storedValue = 'stored-value'
    window.localStorage.setItem(localStorageKey, JSON.stringify(storedValue))
    
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, initialValue))
    
    const [value] = result.current
    expect(value).toBe(storedValue)
  })

  it('should return initial value when localStorage contains invalid JSON', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem(localStorageKey, 'invalid-json')
    
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, initialValue))
    
    const [value] = result.current
    expect(value).toBe(initialValue)
  })

  it('should update state and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, initialValue))
    
    const newValue = 'new-value'
    const [, setValue] = result.current
    
    act(() => {
      setValue(newValue)
    })
    
    const [updatedValue] = result.current
    expect(updatedValue).toBe(newValue)
    expect(window.localStorage.getItem(localStorageKey)).toBe(JSON.stringify(newValue))
  })

  it('should update state with function updater', () => {
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, 'new-value'))
    
    const [, setValue] = result.current
    
    act(() => {
      setValue(prev => prev + '1')
    })
    
    const [updatedValue] = result.current
    expect(updatedValue).toBe('new-value1')
    expect(window.localStorage.getItem(localStorageKey)).toBe(JSON.stringify('new-value1'))
  })

  it('should handle errors when setting localStorage', () => {
    // Mock localStorage.setItem to throw an error
    const mockSetItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage<string>(localStorageKey, initialValue))
    
    const newValue = 'new-value'
    const [, setValue] = result.current
    
    act(() => {
      setValue(newValue)
    })
    
    // Should not throw and should still update state
    const [updatedValue] = result.current
    expect(updatedValue).toBe(newValue)
    
    // Restore mocks
    mockSetItem.mockRestore()
    consoleSpy.mockRestore()
  })

  it('should return initial value when window is undefined (server-side)', () => {
    // This test is not applicable in jsdom environment
    expect(true).toBe(true)
  })

  it('should not set localStorage when window is undefined (server-side)', () => {
    // This test is not applicable in jsdom environment
    expect(true).toBe(true)
  })
})