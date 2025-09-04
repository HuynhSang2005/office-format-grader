import { Group, Title, Button, Burger } from '@mantine/core';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { IconLogout } from '@tabler/icons-react';

interface HeaderProps {
  opened?: boolean;
  toggle?: () => void;
}

/**
 * The main application header.
 * Contains the app title, navigation links, and user actions (e.g., logout).
 * @returns {JSX.Element} The rendered header.
 */
export function Header({ opened, toggle }: HeaderProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const currentPath = router.state.location.pathname;

  const isActiveRoute = (path: string): boolean => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <Group justify="space-between" h="100%" px="md">
      <Group>
        <Burger
          opened={opened}
          onClick={toggle}
          size="sm"
          hiddenFrom="sm"
        />
        
        <Link to="/dashboard">
          <Title order={3} style={{ cursor: 'pointer' }}>
            Office Format Grader
          </Title>
        </Link>
        
        <Group ml="xl" gap="xs" visibleFrom="sm">
          <Link to="/dashboard">
            <Button 
              variant={isActiveRoute('/dashboard') ? 'filled' : 'subtle'}
              size="sm"
            >
              Dashboard
            </Button>
          </Link>
          <Link to="/grading">
            <Button 
              variant={isActiveRoute('/grading') ? 'filled' : 'subtle'}
              size="sm"
            >
              Chấm điểm
            </Button>
          </Link>
          <Link to="/history">
            <Button 
              variant={isActiveRoute('/history') ? 'filled' : 'subtle'}
              size="sm"
            >
              Lịch sử
            </Button>
          </Link>
          <Link to="/rubrics">
            <Button 
              variant={isActiveRoute('/rubrics') ? 'filled' : 'subtle'}
              size="sm"
            >
              Rubrics
            </Button>
          </Link>
        </Group>
      </Group>
      
      <Button 
        variant="outline" 
        onClick={handleLogout}
        leftSection={<IconLogout size={16} />}
        size="sm"
      >
        Đăng xuất
      </Button>
    </Group>
  );
}
