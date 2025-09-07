/**
 * @file __root.tsx
 * @description Root route component with error boundary and suspense fallback
 * @author Your Name
 */

import { createRootRoute, Outlet } from '@tanstack/react-router'

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

function ErrorComponent() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
      <p className="mt-2 text-gray-600">An error occurred while loading the page</p>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
  pendingComponent: SuspenseFallback,
})