/**
 * @file auth.store.ts
 * @description Authentication Zustand store
 * @author Nguyễn Huỳnh Sang
 */

import { create } from 'zustand'
import type { AxiosError } from 'axios'
import { apiClient } from '../lib/api-client'
import type { LoginResponse, CurrentUserResponse, LogoutResponse, AuthErrorResponse } from '../schemas/auth.schema'

interface User {
  id: number
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  me: () => Promise<void>
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password })
      const { user } = response.data
      set({ user, isAuthenticated: true, loading: false })
    } catch (error) {
      const axiosError = error as AxiosError<AuthErrorResponse>
      const errorMessage = axiosError.response?.data?.message || 'Đăng nhập thất bại'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },
  
  logout: async () => {
    set({ loading: true })
    try {
      await apiClient.post<LogoutResponse>('/api/auth/logout')
      set({ user: null, isAuthenticated: false, loading: false, error: null })
    } catch (error) {
      // Even if logout fails on the server, we still clear the local state
      set({ user: null, isAuthenticated: false, loading: false, error: null })
      // But we still throw the error so the caller can handle it if needed
      throw error
    }
  },
  
  me: async () => {
    set({ loading: true })
    try {
      const response = await apiClient.get<CurrentUserResponse>('/api/auth/me')
      const { user } = response.data
      set({ user, isAuthenticated: true, loading: false })
    } catch (error: unknown) {
      set({ loading: false })
      // If me fails with UNAUTHORIZED error, clear auth state
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        set({ user: null, isAuthenticated: false })
      }
      // If me fails, we don't automatically logout as it might be a network issue
      // The calling component can decide what to do
      throw error
    }
  },
  
  clear: () => {
    set({ user: null, isAuthenticated: false, loading: false, error: null })
  }
}))