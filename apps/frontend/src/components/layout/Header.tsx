/**
 * @file header.tsx
 * @description Header component with theme toggle and user menu
 * @author Your Name
 */

import { 
  AppShell,
  Group,
  ActionIcon,
  Avatar,
  Menu,
  Text,
  Burger
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSun, IconMoon, IconLogout, IconUser, IconSettings } from '@tabler/icons-react'
import { useAuth } from '../../hooks/use-auth'
import { useMantineColorScheme } from '@mantine/core'
import { useUIStore } from '../../stores/ui.store'

interface HeaderProps {
  sidebarOpened: boolean
  toggleSidebar: () => void
}

export function Header({ sidebarOpened, toggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useUIStore()
  const { user, logout } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const [userMenuOpened, { toggle: toggleUserMenu }] = useDisclosure(false)

  const toggleColorScheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setColorScheme(newTheme)
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (_error) {
      // In a production app, we might want to show a notification or handle this more gracefully
      // For now, we'll just redirect to login even if logout fails
      window.location.href = '/login'
    }
  }

  return (
    <AppShell.Header px="md">
      <Group h="100%" justify="space-between">
        <Group>
          <Burger opened={sidebarOpened} onClick={toggleSidebar} hiddenFrom="sm" size="sm" />
          <Group ml="md">
            <Avatar 
              src={null} 
              alt="Office Vibe Logo" 
              color="blue" 
              radius="xl"
              size="sm"
            >
              OV
            </Avatar>
            <Text size="xl" fw={700}>
              Office Vibe
            </Text>
          </Group>
        </Group>

        <Group>
          <ActionIcon
            onClick={toggleColorScheme}
            size="lg"
            variant="default"
            aria-label="Toggle color scheme"
          >
            {theme === 'dark' ? (
              <IconSun style={{ width: '1.2rem', height: '1.2rem' }} stroke={1.5} />
            ) : (
              <IconMoon style={{ width: '1.2rem', height: '1.2rem' }} stroke={1.5} />
            )}
          </ActionIcon>
          
          <Menu 
            opened={userMenuOpened} 
            onChange={toggleUserMenu}
            shadow="md" 
            width={200}
            withArrow
          >
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
                leftSection={<IconUser style={{ width: '1rem', height: '1rem' }} />}
                onClick={() => {
                  window.location.href = '/profile'
                }}
              >
                Hồ sơ
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconSettings style={{ width: '1rem', height: '1rem' }} />}
                onClick={() => {
                  window.location.href = '/settings'
                }}
              >
                Cài đặt
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item 
                color="red" 
                leftSection={<IconLogout style={{ width: '1rem', height: '1rem' }} />}
                onClick={handleLogout}
              >
                Đăng xuất
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </AppShell.Header>
  )
}