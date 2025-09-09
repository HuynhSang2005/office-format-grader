/**
 * @file _auth.tsx
 * @description Authentication layout guard with AppShell
 * @author Nguyễn Huỳnh Sang
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth.store'
import { AppShell } from '../components/layout/AppShell'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { isAuthenticated, user, me } = useAuthStore.getState()
    
    // If we don't have user data, try to fetch it
    if (!isAuthenticated || !user) {
      try {
        await me()
      } catch (error: unknown) {
        // If fetching user fails with UNAUTHORIZED error, redirect to login
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          throw redirect({
            to: '/login',
          })
        }
        // Log the error for debugging
        console.error('Authentication check failed:', error)
        throw redirect({
          to: '/login',
        })
      }
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}