/**
 * @file dashboard.tsx
 * @description Criteria management dashboard component
 * @author Your Name
 */

import { 
  Card, 
  Title, 
  Text, 
  Group, 
  Button,
  Box,
  SimpleGrid
} from '@mantine/core'
import { IconEye, IconList, IconCheck } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'

interface CriteriaDashboardProps {
  className?: string
}

export function CriteriaDashboard({ className }: CriteriaDashboardProps) {
  const navigate = useNavigate()
  
  const features = [
    {
      title: 'Xem trước tiêu chí',
      description: 'Xem trước các tiêu chí có thể áp dụng cho file cụ thể',
      icon: IconEye,
      color: 'blue',
      action: () => navigate({ to: '/criteria/preview' })
    },
    {
      title: 'Danh sách tiêu chí',
      description: 'Xem và tìm kiếm tất cả các tiêu chí chấm điểm',
      icon: IconList,
      color: 'green',
      action: () => navigate({ to: '/criteria/list' })
    },
    {
      title: 'Kiểm tra rubric',
      description: 'Kiểm tra cấu trúc và tính hợp lệ của rubric',
      icon: IconCheck,
      color: 'violet',
      action: () => navigate({ to: '/criteria/validate' })
    }
  ]
  
  return (
    <Box className={className}>
      <Title order={3} mb="md">Quản lý tiêu chí chấm điểm</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {features.map((feature, index) => (
          <Card
            key={index}
            withBorder
            radius="md"
            p="lg"
            style={{ height: '100%' }}
          >
            <Group mb="md">
              <feature.icon size={24} color={`var(--mantine-color-${feature.color}-6)`} />
              <Title order={4} size="h6">
                {feature.title}
              </Title>
            </Group>
            
            <Text size="sm" c="dimmed" mb="md" style={{ flex: 1 }}>
              {feature.description}
            </Text>
            
            <Button
              variant="light"
              color={feature.color}
              onClick={feature.action}
              fullWidth
              mt="auto"
            >
              Truy cập
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  )
}