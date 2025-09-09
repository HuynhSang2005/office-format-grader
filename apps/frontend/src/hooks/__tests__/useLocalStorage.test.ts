import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  const KEY = 'test-key'
  const INITIAL_VALUE = 'initial-value'
  
  beforeEach(() => {
    localStorage.clear()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  it('should return initial value if no item in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL_VALUE))
    const [value] = result.current
    
    expect(value).toBe(INITIAL_VALUE)
  })
  
  it('should return existing value from localStorage', () => {
    const EXISTING_VALUE = 'existing-value'
    localStorage.setItem(KEY, JSON.stringify(EXISTING_VALUE))
    
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL_VALUE))
    const [value] = result.current
    
    expect(value).toBe(EXISTING_VALUE)
  })
  
  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL_VALUE))
    const [, setValue] = result.current
    
    act(() => {
      setValue(prev => `${prev}1`)
    })
    
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify(`${INITIAL_VALUE}1`))
  })
  
  it('should handle complex objects', () => {
    type User = { name: string; age: number }
    const INITIAL_USER: User = { name: 'John', age: 30 }
    const UPDATED_USER: User = { name: 'Jane', age: 25 }
    
    const { result } = renderHook(() => useLocalStorage<User>(KEY, INITIAL_USER))
    const [, setUser] = result.current
    
    act(() => {
      setUser(UPDATED_USER)
    })
    
    expect(JSON.parse(localStorage.getItem(KEY) || 'null')).toEqual(UPDATED_USER)
  })
  
  it('should handle errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage failed')
    })
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL_VALUE))
    const [, setValue] = result.current
    
    act(() => {
      setValue('new-value')
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to set localStorage key "test-key":', expect.any(Error))
    
    setItemSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})