/**
 * @file use-auth.test.ts
 * @description Unit tests for useAuth hook
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../../stores/auth.store'
import { useAuth } from '../use-auth'
import { apiClient } from '../../lib/api-client'
import type { LoginResponse, CurrentUserResponse, LogoutResponse } from '../../schemas/auth.schema'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the apiClient
vi.mock('../../lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('useAuth', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Clear the auth store state
    useAuthStore.getState().clear()
  })

  it('should initialize with default values', () => {
    // Mock me to prevent automatic API call
    const mockMe = vi.spyOn(useAuthStore.getState(), 'me').mockResolvedValue()
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    
    mockMe.mockRestore()
  })

  it('should login successfully', async () => {
    const mockResponse: { data: LoginResponse } = {
      data: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'test@example.com'
          }
        }
      }
    }
    
    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(result.current.user).toEqual({ id: 1, email: 'test@example.com' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials')
    
    vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrongpassword')
      } catch (_error) {
        // Expected error
      }
    })

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Đăng nhập thất bại')
  })

  it('should logout successfully', async () => {
    // First login
    const mockLoginResponse: { data: LoginResponse } = {
      data: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'test@example.com'
          }
        }
      }
    }
    
    const mockLogoutResponse: { data: LogoutResponse } = {
      data: {
        success: true,
        message: 'Logout successful'
      }
    }
    
    vi.spyOn(apiClient, 'post')
      .mockResolvedValueOnce(mockLoginResponse)
      .mockResolvedValueOnce(mockLogoutResponse)

    const { result } = renderHook(() => useAuth())
    
    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    // Then logout
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch current user successfully', async () => {
    const mockResponse: { data: CurrentUserResponse } = {
      data: {
        success: true,
        message: 'User fetched successfully',
        data: {
          user: {
            id: 1,
            email: 'test@example.com'
          }
        }
      }
    }
    
    vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse)
    
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.me()
    })

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(result.current.user).toEqual({ id: 1, email: 'test@example.com' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle me error', async () => {
    const mockError = new Error('Not authenticated')
    
    vi.spyOn(apiClient, 'get').mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      try {
        await result.current.me()
      } catch (_error) {
        // Expected error
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull() // me doesn't set error in the store
  })
})