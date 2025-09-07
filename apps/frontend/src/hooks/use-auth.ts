/**
 * @file use-auth.ts
 * @description Custom hook for authentication
 * @author Your Name
 */

import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useNavigate } from '@tanstack/react-router'

export const useAuth = () => {
  const { user, isAuthenticated, loading, error, login, logout, me, clear } = useAuthStore()
  const navigate = useNavigate()
  
  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated && !user) {
      // Try to get current user if we don't have user data
      me().catch((error) => {
        // If me fails with UNAUTHORIZED error, redirect to login
        if (error.message === 'UNAUTHORIZED') {
          navigate({ to: '/login' })
        }
        // If me fails, it's fine - we'll redirect to login if needed
      })
    }
  }, [isAuthenticated, user, me, navigate])
  
  const redirectIfNotAuthenticated = () => {
    if (!isAuthenticated && !user) {
      // Use router navigation instead of window.location for better SPA experience
      navigate({ to: '/login' })
    }
  }
  
  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    me,
    clear,
    redirectIfNotAuthenticated,
    navigate
  }
}