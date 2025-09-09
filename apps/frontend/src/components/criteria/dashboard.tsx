/**
 * @file dashboard.tsx
 * @description Criteria management dashboard component
 * @author Nguyễn Huỳnh Sang
 */

import { 
  Card, 
  Text, 
  SimpleGrid, 
  Box,
  ThemeIcon,
  Flex
} from '@mantine/core'
import { 
  IconList, 
  IconTool, 
  IconChartBar, 
  IconClipboardList,
  IconFiles,
  IconTrendingUp
} from '@tabler/icons-react'

const features = [
  {
    title: 'Quản lý tiêu chí',
    description: 'Tạo, chỉnh sửa và xóa các tiêu chí chấm điểm tùy chỉnh',
    icon: IconList,
    color: 'blue',
  },
  {
    title: 'Xây dựng rubric',
    description: 'Tạo rubric từ các tiêu chí để chấm điểm tài liệu',
    icon: IconTool,
    color: 'green',
  },
  {
    title: 'Thống kê & Báo cáo',
    description: 'Xem thống kê về hiệu suất chấm điểm và chất lượng tài liệu',
    icon: IconChartBar,
    color: 'red',
  },
  {
    title: 'Lịch sử chấm điểm',
    description: 'Xem lại các lần chấm điểm trước và kết quả chi tiết',
    icon: IconClipboardList,
    color: 'orange',
  },
  {
    title: 'Rubric tùy chỉnh',
    description: 'Quản lý và sử dụng các rubric đã tạo cho chấm điểm',
    icon: IconFiles,
    color: 'purple',
  },
  {
    title: 'Phân tích cải thiện',
    description: 'Nhận đề xuất cải thiện tài liệu dựa trên kết quả chấm điểm',
    icon: IconTrendingUp,
    color: 'teal',
  },
]

export function CriteriaDashboard() {
  const items = features.map((feature) => (
    <Card
      key={feature.title}
      withBorder
      radius="md"
      p="lg"
      style={{ height: '100%' }}
    >
      <ThemeIcon
        size={48}
        radius="md"
        variant="light"
        color={feature.color}
        mb="md"
      >
        <feature.icon size={28} />
      </ThemeIcon>
      
      <Text size="lg" fw={500} mb="sm">
        {feature.title}
      </Text>
      
      <Text size="sm" c="dimmed">
        {feature.description}
      </Text>
    </Card>
  ))

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="xl">
        <Box>
          <Text size="xl" fw={700}>Quản lý tiêu chí chấm điểm</Text>
          <Text size="sm" c="dimmed">
            Tạo và quản lý các tiêu chí chấm điểm tùy chỉnh cho tài liệu
          </Text>
        </Box>
      </Flex>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {items}
      </SimpleGrid>
    </Box>
  )
}