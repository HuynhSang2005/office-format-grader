/**
 * @file index.lazy.tsx
 * @description Criteria management index page
 * @author Nguyễn Huỳnh Sang
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Button,
  Box,
  List
} from '@mantine/core'
import { IconEye, IconList, IconCheck, IconTool, IconPlus } from '@tabler/icons-react'

export const Route = createLazyFileRoute('/_auth/criteria/')({
  component: CriteriaIndexPage,
})

function CriteriaIndexPage() {
  const navigate = useNavigate()
  
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Quản lý tiêu chí chấm điểm</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate({ to: '/criteria/create' })}
        >
          Tạo tiêu chí mới
        </Button>
      </Group>
      
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
      
      <Card withBorder p="lg" radius="md" mb="xl">
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
            <IconTool size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Quản lý tiêu chí tùy chỉnh</Text>
          </Group>
          <Text size="sm" c="dimmed" pl="xs">
            Tạo, chỉnh sửa và xóa các tiêu chí tùy chỉnh để sử dụng trong rubric của bạn
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
      
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="md">Hướng dẫn sử dụng</Title>
        
        <Text size="sm" mb="sm">
          <Text fw={500} component="span">1. Xem trước tiêu chí:</Text> Sử dụng chức năng này để xem các tiêu chí sẽ được áp dụng cho file của bạn trước khi chấm điểm.
        </Text>
        
        <Text size="sm" mb="sm">
          <Text fw={500} component="span">2. Danh sách tiêu chí:</Text> Tìm kiếm và xem tất cả các tiêu chí có sẵn trong hệ thống, bao gồm cả tiêu chí preset và tiêu chí tùy chỉnh.
        </Text>
        
        <Text size="sm" mb="sm">
          <Text fw={500} component="span">3. Quản lý tiêu chí tùy chỉnh:</Text> Tạo các tiêu chí riêng của bạn để sử dụng trong rubric tùy chỉnh. Bạn có thể:
        </Text>
        <List size="sm" mb="sm" pl="md">
          <List.Item>Thêm tiêu chí mới</List.Item>
          <List.Item>Chỉnh sửa tiêu chí hiện có</List.Item>
          <List.Item>Xóa tiêu chí không cần thiết</List.Item>
          <List.Item>Thiết lập các mức điểm cho từng tiêu chí</List.Item>
        </List>
        
        <Text size="sm">
          <Text fw={500} component="span">4. Kiểm tra rubric:</Text> Kiểm tra cấu trúc và tính hợp lệ của rubric JSON trước khi sử dụng để đảm bảo rubric hoạt động đúng.
        </Text>
      </Card>
    </Container>
  )
}