/**
 * @file index.lazy.tsx
 * @description Criteria management index page
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Button,
  Box
} from '@mantine/core'
import { IconEye, IconList, IconCheck } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/criteria/')({
  component: CriteriaIndexPage,
})

function CriteriaIndexPage() {
  const navigate = useNavigate()
  
  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Quản lý tiêu chí chấm điểm</Title>
      
      <Card withBorder p="xl" radius="md" mb="xl">
        <Text size="lg" mb="md">
          Hệ thống cung cấp các công cụ để quản lý và xem trước tiêu chí chấm điểm cho các loại file khác nhau.
        </Text>
        
        <Group mt="xl">
          <Button
            leftSection={<IconEye size={16} />}
            onClick={() => navigate({ to: '/criteria/preview' })}
            size="lg"
          >
            Xem trước tiêu chí
          </Button>
          
          <Button
            leftSection={<IconList size={16} />}
            onClick={() => navigate({ to: '/criteria/list' })}
            size="lg"
            variant="outline"
          >
            Danh sách tiêu chí
          </Button>
          
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={() => navigate({ to: '/criteria/validate' })}
            size="lg"
            variant="outline"
          >
            Kiểm tra rubric
          </Button>
        </Group>
      </Card>
      
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="md">Tính năng</Title>
        
        <Box mb="sm">
          <Group align="center" gap="sm" mb="xs">
            <IconEye size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Xem trước tiêu chí</Text>
          </Group>
          <Text size="sm" c="dimmed" pl="xs">
            Xem trước các tiêu chí có thể áp dụng cho file cụ thể trước khi chấm điểm
          </Text>
        </Box>
        
        <Box mb="sm">
          <Group align="center" gap="sm" mb="xs">
            <IconList size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Danh sách tiêu chí</Text>
          </Group>
          <Text size="sm" c="dimmed" pl="xs">
            Xem và tìm kiếm tất cả các tiêu chí chấm điểm có sẵn trong hệ thống
          </Text>
        </Box>
        
        <Box mb="sm">
          <Group align="center" gap="sm" mb="xs">
            <IconCheck size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Kiểm tra rubric</Text>
          </Group>
          <Text size="sm" c="dimmed" pl="xs">
            Kiểm tra cấu trúc và tính hợp lệ của rubric trước khi sử dụng
          </Text>
        </Box>
      </Card>
    </Container>
  )
}