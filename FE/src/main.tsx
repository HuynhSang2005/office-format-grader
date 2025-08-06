import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'

// Import generated route tree
import { routeTree } from './routeTree.gen'

// Import CSS của Mantine
import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

// Import các route đã tạo
const router = createRouter({ routeTree })
const queryClient = new QueryClient()

// Đăng ký router vào TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>,
  )
}