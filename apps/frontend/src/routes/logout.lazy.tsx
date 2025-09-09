/**
 * @file logout.lazy.tsx
 * @description Logout page component
 * @author Nguyễn Huỳnh Sang
 */

import { useEffect } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'

export const Route = createLazyFileRoute('/logout')({
  component: LogoutRoute,
})

export function LogoutRoute() {
  const { logout } = useAuthStore()
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
      } catch (error) {
        // Even if logout fails, we still want to redirect to login
        console.error('Logout error:', error)
      } finally {
        // Redirect to login page using window.location to avoid type issues
        window.location.href = '/login'
      }
    }
    
    performLogout()
  }, [logout])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>Đang đăng xuất...</div>
    </div>
  )
}

export default LogoutRoute