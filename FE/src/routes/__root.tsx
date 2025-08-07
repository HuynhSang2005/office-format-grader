import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppShell, Group, NavLink } from '@mantine/core';
import { File, Bot, Presentation, CheckCircle, FileText } from 'lucide-react';

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
          <Group h="100%" px="lg">
            <span style={{ fontWeight: 750 }}>Office AI Checker</span>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="lg">
          <NavLink 
            component={Link} 
            to="/ai-checker" 
            label="Chấm Điểm AI" 
            leftSection={<Bot size={23} />} 
            className="[&.active]:font-bold"
          />
          <NavLink 
            component={Link} 
            to="/manual-checker" 
            label="Chấm Điểm Thủ Công" 
            leftSection={<CheckCircle size={20} />} 
            className="[&.active]:font-bold"
          />
          <NavLink 
            component={Link} 
            to="/" 
            label="Phân Tích File" 
            leftSection={<File size={20} />} 
            className="[&.active]:font-bold"
          />
            <NavLink 
              component={Link} 
              to="/powerpoint-analyzer" 
              label="Phân Tích PowerPoint" 
              leftSection={<Presentation size={20} />} 
              className="[&.active]:font-bold"
            />
          <NavLink 
            component={Link} 
            to="/submission-analyzer" 
            label="Phân Tích Bài Nộp" 
            leftSection={<FileText size={20} />} 
            className="[&.active]:font-bold"
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      
      {/* Thêm công cụ Devtools của Tanstack-Router để dễ dàng debug */}
      <TanStackRouterDevtools />
    </>
  );
}