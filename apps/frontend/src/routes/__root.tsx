import { createRootRoute, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { MantineProvider, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Import Mantine's default CSS
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient();

const theme = createTheme({});

function RootComponent() {
  const location = useLocation();
  
  // Routes that should use AuthLayout (login page)
  const authRoutes = ['/login'];
  
  // Check if current route should use AuthLayout
  const shouldUseAuthLayout = authRoutes.includes(location.pathname);
  
  if (shouldUseAuthLayout) {
    return <AuthLayout />;
  }
  
  // Use MainLayout for all other routes
  return <MainLayout />;
}

export const Route = createRootRoute({
  component: () => (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <Notifications />
          <RootComponent />
          <TanStackRouterDevtools />
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  ),
});
