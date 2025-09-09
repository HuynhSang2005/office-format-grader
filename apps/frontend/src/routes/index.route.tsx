/**
 * @file index.route.tsx
 * @description Home route component - redirect to login
 * @author Nguyễn Huỳnh Sang
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

function Home() {
  return null
}

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: () => {
    // Redirect to login page
    throw redirect({
      to: '/login',
    })
  },
})