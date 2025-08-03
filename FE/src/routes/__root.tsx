import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppShell, Group, NavLink } from '@mantine/core';
import { Home, Bot } from 'lucide-react';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <AppShell 
        header={{ height: 60 }}
        navbar={{ width: 250, breakpoint: 'sm' }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <span style={{ fontWeight: 700 }}>Office AI Checker</span>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          {/* Sử dụng Link của router với active props để tự động in đậm */}
          <NavLink 
            component={Link} 
            to="/" 
            label="Phân Tích File" 
            leftSection={<Home size={16} />} 
            // `&.active` là cú pháp của TanStack Router để style link đang active
            className="[&.active]:font-bold"
          />
          <NavLink 
            component={Link} 
            to="/ai-checker" 
            label="Chấm Điểm AI" 
            leftSection={<Bot size={16} />} 
            className="[&.active]:font-bold"
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      
      {/* Thêm công cụ Devtools của Router để dễ dàng debug */}
      <TanStackRouterDevtools />
    </>
  );
}