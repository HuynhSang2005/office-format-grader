import { Flex } from '@mantine/core';
import { Outlet } from '@tanstack/react-router';

/**
 * Layout for authentication pages (e.g., Login, Register).
 * It centers the content on the screen.
 * @returns {JSX.Element} The rendered layout.
 */
export function AuthLayout() {
  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
      <Outlet />
    </Flex>
  );
}
