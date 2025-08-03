import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AppShell, Group } from '@mantine/core'

export const Route = createRootRoute({
  component: () => (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <span style={{ fontWeight: 700 }}>Office AI Checker</span>
          <Link to="/" className="[&.active]:font-bold" style={{ marginLeft: 16 }}>
            Home
          </Link>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
        <TanStackRouterDevtools />
      </AppShell.Main>
    </AppShell>
  ),
})