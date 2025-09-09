/**
 * @file App.tsx
 * @description Main application component
 * @author Nguyễn Huỳnh Sang
 */

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { queryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'
import { theme } from './styles/theme'
import { useUIStore } from './stores/ui.store'
import { useEffect } from 'react'
import { useMantineColorScheme, Button } from '@mantine/core'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

// Create router instance with better error handling
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Add default error handling
  defaultErrorComponent: ({ error }) => {
    console.error('Router error:', error)
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
        <p className="mt-2 text-gray-600">An error occurred while loading the page</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    )
  },
  // Add default pending component
  defaultPendingComponent: () => (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  // Add default pendingMs to reduce flickering
  defaultPendingMs: 500,
  // Add default staleTime for better caching
  defaultStaleTime: 5000,
})

// Register things for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function AppContent() {
  const { theme: storedTheme } = useUIStore()
  const { setColorScheme } = useMantineColorScheme()
  
  // Sync UI store with Mantine color scheme
  useEffect(() => {
    setColorScheme(storedTheme)
  }, [storedTheme, setColorScheme])
  
  return (
    <>
      <Notifications />
      <RouterProvider 
        router={router} 
        // Add better error handling
        defaultErrorComponent={({ error }) => {
          console.error('RouterProvider error:', error)
          return (
            <div className="flex flex-col items-center justify-center w-full h-screen">
              <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
              <p className="mt-2 text-gray-600">An error occurred while loading the page</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </Button>
            </div>
          )
        }}
      />
    </>
  )
}

function App() {
  const { theme: storedTheme } = useUIStore()
  
  return (
    <MantineProvider theme={theme} defaultColorScheme={storedTheme}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App