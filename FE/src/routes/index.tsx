import { createFileRoute } from '@tanstack/react-router'
import { Title } from '@mantine/core';

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <Title order={2}>Trang Phân Tích File</Title>
      <p>Chúng ta sẽ xây dựng giao diện phân tích file ở đây.</p>
    </div>
  )
}