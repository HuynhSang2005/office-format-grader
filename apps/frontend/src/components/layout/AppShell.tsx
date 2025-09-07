/**
 * @file AppShell.tsx
 * @description Main application shell with header, sidebar, and content area
 * @author Your Name
 */

import { 
  AppShell as MantineAppShell,
  Text,
  Burger,
  Group,
  UnstyledButton,
  Avatar,
  Menu,
  ActionIcon,
  rem
} from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useDisclosure } from '@mantine/hooks'
import { IconSun, IconMoon, IconLogout, IconUser, IconSettings, IconDashboard, IconUpload, IconHistory, IconTableExport, IconListSearch } from '@tabler/icons-react'
import { useAuth } from '../../hooks/use-auth'
import { useMantineColorScheme } from '@mantine/core'
import { OfflineBanner } from './OfflineBanner'
import { useUIStore } from '../../stores/ui.store'
import { useEffect } from 'react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { theme, sidebar, setTheme } = useUIStore()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(sidebar.mobileOpened)
  const [desktopOpened] = useDisclosure(sidebar.desktopOpened)
  const { user, logout } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const navigate = useNavigate()

  // Sync UI store with Mantine color scheme
  useEffect(() => {
    setColorScheme(theme)
  }, [theme, setColorScheme])

  const toggleColorScheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setColorScheme(newTheme)
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Use router navigation instead of window.location for better SPA experience
      navigate({ to: '/login' })
    } catch (_error) {
      // In a production app, we might want to show a notification or handle this more gracefully
      // For now, we'll just redirect to login even if logout fails
      navigate({ to: '/login' })
    }
  }

  const navItems = [
    { label: 'Bảng điều khiển', icon: IconDashboard, href: '/dashboard' },
    { label: 'Upload tài liệu', icon: IconUpload, href: '/upload' },
    { label: 'File chưa chấm', icon: IconHistory, href: '/ungraded' },
    { label: 'Lịch sử chấm', icon: IconHistory, href: '/history' },
    { label: 'Xuất kết quả', icon: IconTableExport, href: '/export' },
    { label: 'Tiêu chí chấm', icon: IconListSearch, href: '/criteria' },
  ]

  return (
    <>
      <OfflineBanner />
      <MantineAppShell
        header={{ height: 70 }}
        navbar={{
          width: { sm: 200 },
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md"
      >
        <MantineAppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <UnstyledButton
                onClick={() => navigate({ to: '/dashboard' })}
                style={{ cursor: 'pointer' }}
              >
                <Group ml="md">
                  <Text size="xl" fw={700}>
                    Office Format Grader
                  </Text>
                </Group>
              </UnstyledButton>
            </Group>

            <Group>
              <ActionIcon
                onClick={toggleColorScheme}
                size="lg"
                variant="default"
                aria-label="Toggle color scheme"
              >
                {theme === 'dark' ? (
                  <IconSun style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                ) : (
                  <IconMoon style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                )}
              </ActionIcon>
              
              <Menu shadow="md" width={200} withArrow>
                <Menu.Target>
                  <ActionIcon size="lg" variant="default" aria-label="User menu">
                    <Avatar 
                      src={null} 
                      alt={user?.email || 'User'} 
                      radius="xl"
                      size="sm"
                    >
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{user?.email}</Menu.Label>
                  <Menu.Item 
                    leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => {
                      navigate({ to: '/profile' })
                    }}
                  >
                    Hồ sơ
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                    onClick={() => {
                      navigate({ to: '/settings' })
                    }}
                  >
                    Cài đặt
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item 
                    color="red" 
                    leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </MantineAppShell.Header>

        <MantineAppShell.Navbar p="md">
          {navItems.map((item) => (
            <UnstyledButton
              key={item.label}
              onClick={() => {
                navigate({ to: item.href })
                toggleMobile()
              }}
              w="100%"
              p="xs"
              mb="xs"
              style={{
                borderRadius: '4px',
                color: theme === 'dark' ? '#fff' : '#000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Group>
                <item.icon style={{ width: rem(18), height: rem(18) }} />
                <Text size="sm">{item.label}</Text>
              </Group>
            </UnstyledButton>
          ))}
        </MantineAppShell.Navbar>

        <MantineAppShell.Main>
          {children}
        </MantineAppShell.Main>
      </MantineAppShell>
    </>
  )
}