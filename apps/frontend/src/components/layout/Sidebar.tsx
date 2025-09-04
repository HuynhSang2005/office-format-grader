import { NavLink } from '@mantine/core';
import { Link, useRouter } from '@tanstack/react-router';
import { IconGauge, IconHistory, IconFileText, IconClipboardList } from '@tabler/icons-react';

/**
 * The main application sidebar for navigation.
 * @returns {JSX.Element} The rendered sidebar.
 */
export function Sidebar() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const isActiveRoute = (path: string): boolean => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <>
      <Link to="/dashboard">
        <NavLink 
          label="Dashboard" 
          leftSection={<IconGauge size="1rem" stroke={1.5} />}
          active={isActiveRoute('/dashboard')}
          variant="filled"
        />
      </Link>
      <Link to="/grading">
        <NavLink 
          label="Chấm bài" 
          leftSection={<IconFileText size="1rem" stroke={1.5} />}
          active={isActiveRoute('/grading')}
          variant="filled"
        />
      </Link>
      <Link to="/history">
        <NavLink 
          label="Lịch sử" 
          leftSection={<IconHistory size="1rem" stroke={1.5} />}
          active={isActiveRoute('/history')}
          variant="filled"
        />
      </Link>
      <Link to="/rubrics">
        <NavLink 
          label="Rubric Tùy chỉnh" 
          leftSection={<IconClipboardList size="1rem" stroke={1.5} />}
          active={isActiveRoute('/rubrics')}
          variant="filled"
        />
      </Link>
    </>
  );
}
