/**
 * @file __root.tsx
 * @description Root route component with error boundary and suspense fallback
 * @author Nguyễn Huỳnh Sang
 */

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useEffect } from 'react'

function RootComponent() {
  return <Outlet />
}

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // Reset the query error boundary when the component unmounts
  const queryErrorResetBoundary = useQueryErrorResetBoundary()
  
  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
      <p className="mt-2 text-gray-600">An error occurred while loading the page</p>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            reset()
            window.location.reload()
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
        <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
  pendingComponent: SuspenseFallback,
  // Add a default loader to prevent hydration issues
  loader: async () => {
    // Add any global data loading here if needed
    return {}
  }
})