  import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppShell, NavLink, ActionIcon, Tooltip } from '@mantine/core';
import { File, Bot, Presentation, CheckCircle, FileText, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('mantine-color-scheme')
      return (saved === 'dark' ? 'dark' : 'light')
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme)
    } catch (e) {
      // ignore
    }
  }, [colorScheme])

  const toggleColorScheme = (value?: 'light' | 'dark') => {
    const next = value || (colorScheme === 'dark' ? 'light' : 'dark')
    setColorScheme(next)
    try {
      localStorage.setItem('mantine-color-scheme', next)
    } catch (e) {
      // ignore
    }
  }

  return (
    <>
      <AppShell 
        header={{ height: 60 }}
        navbar={{ width: 250, breakpoint: 'sm' }}
        padding="md"
      >
        <AppShell.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', paddingLeft: 16, paddingRight: 16 }}>
            <span style={{ fontWeight: 750 }}>Office AI Checker</span>
            <Tooltip label={colorScheme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'}>
              <ActionIcon
                variant="light"
                onClick={() => toggleColorScheme()}
                title="Toggle color scheme"
              >
                {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </ActionIcon>
            </Tooltip>
          </div>
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