/**
 * @file App.tsx
 * @description Main application component
 * @author Your Name
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
import { useMantineColorScheme } from '@mantine/core'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

// Create router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register things for type saf   ety
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
      <RouterProvider router={router} />
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