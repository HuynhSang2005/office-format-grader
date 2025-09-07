/**
 * @file dashboard.tsx
 * @description Dashboard page component with statistics and charts
 * @author Your Name
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Group, 
  Text, 
  SimpleGrid, 
  Button, 
  Container, 
  Flex, 
  Progress,
  Skeleton,
  Alert,
  ThemeIcon,
  Badge,
  Box,
  Select,
  NumberInput
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { 
  IconUpload, 
  IconHistory, 
  IconFiles, 
  IconAlertCircle,
  IconTrendingUp,
  IconClipboardList,
  IconCheck,
  IconArrowUpRight,
  IconArrowDownRight,
  IconFilter,
  IconCalendar,
  IconUser
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/use-auth'
import { useDashboardStats } from '../../api/hooks/useDashboardStats'
import { CriteriaDashboard } from '../../components/criteria/dashboard'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardRoute,
})

function StatsCard({ 
  title, 
  value, 
  diff, 
  icon, 
  color, 
  description 
}: { 
  title: string; 
  value: string; 
  diff: number; 
  icon: React.ReactNode; 
  color: string; 
  description: string; 
}) {
  return (
    <Card withBorder p="lg" radius="md">
      <Flex justify="space-between">
        <Text size="sm" c="dimmed" fw={500}>
          {title}
        </Text>
        <ThemeIcon
          color={color}
          variant="light"
          radius="md"
          size={36}
        >
          {icon}
        </ThemeIcon>
      </Flex>

      <Text size="xl" fw={700} mt="md">
        {value}
      </Text>

      <Flex align="center" mt={5}>
        {diff > 0 ? (
          <IconArrowUpRight size={16} color="green" />
        ) : (
          <IconArrowDownRight size={16} color="red" />
        )}
        <Text size="sm" c={diff > 0 ? 'green' : 'red'} ml={5} fw={500}>
          {diff}%
        </Text>
        <Text size="sm" c="dimmed" ml={5}>
          {description}
        </Text>
      </Flex>
    </Card>
  )
}

function DashboardRoute() {
  const { user } = useAuth()
  const { data: dashboardStatsResponse, isLoading, error } = useDashboardStats({})
  const dashboardStats = dashboardStatsResponse?.data
  const navigate = useNavigate()
  
  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Flex justify="space-between" align="center" mb="xl">
          <div>
            <Skeleton height={28} width={200} mb={10} />
            <Skeleton height={20} width={300} />
          </div>
          <Skeleton height={36} width={120} />
        </Flex>
        
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} withBorder p="lg" radius="md">
              <Skeleton height={20} width={100} mb={10} />
              <Skeleton height={32} width={80} mb={10} />
              <Skeleton height={20} width={120} />
            </Card>
          ))}
        </SimpleGrid>
        
        <Card withBorder p="lg" radius="md">
          <Skeleton height={24} width={150} mb="xl" />
          <Flex gap="md">
            <Skeleton height={36} width={120} />
            <Skeleton height={36} width={150} />
            <Skeleton height={36} width={130} />
          </Flex>
        </Card>
      </Container>
    )
  }
  
  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Có lỗi xảy ra" 
          color="red"
        >
          Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.
        </Alert>
      </Container>
    )
  }
  
  if (!dashboardStats) {
    return (
      <Container size="xl" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Không có dữ liệu" 
          color="yellow"
        >
          Hiện tại chưa có dữ liệu để hiển thị.
        </Alert>
      </Container>
    )
  }

  const handleUploadSingle = () => {
    navigate({ to: '/upload' })
  }

  const handleUploadBatch = () => {
    navigate({ to: '/upload/batch' })
  }

  const handleViewHistory = () => {
    navigate({ to: '/history' })
  }

  const handleViewUngraded = () => {
    navigate({ to: '/ungraded' })
  }

  const handleViewRubrics = () => {
    navigate({ to: '/rubric/builder' })
  }

  const handleViewProfile = () => {
    navigate({ to: '/profile' })
  }

  // Calculate average score from top5Highest (simplified)
  const totalPoints = dashboardStats.top5Highest.reduce((sum, item) => sum + item.totalPoints, 0);
  const averageScore = dashboardStats.top5Highest.length > 0 ? totalPoints / dashboardStats.top5Highest.length : 0;

  return (
    <Container size="xl" py="xl">
      <Flex justify="space-between" align="center" mb="xl">
        <Box>
          <Text size="xl" fw={700}>Bảng điều khiển</Text>
          <Text size="sm" c="dimmed">
            Chào mừng trở lại, {user?.email}
          </Text>
        </Box>
        <Badge 
          color="green" 
          variant="light" 
          size="lg" 
          leftSection={<IconTrendingUp size={16} />}
        >
          Hoạt động hôm nay
        </Badge>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <StatsCard
          title="Tổng bài đã chấm"
          value={dashboardStats.totalGraded.toString()}
          diff={12}
          icon={<IconCheck size={16} />}
          color="green"
          description="so với tháng trước"
        />
        
        <StatsCard
          title="Chưa chấm"
          value={dashboardStats.totalUngraded.toString()}
          diff={-5}
          icon={<IconClipboardList size={16} />}
          color="red"
          description="so với tháng trước"
        />
        
        <StatsCard
          title="Custom Rubrics"
          value={dashboardStats.totalCustomRubrics.toString()}
          diff={8}
          icon={<IconFiles size={16} />}
          color="blue"
          description="đang sử dụng"
        />
        
        <Card withBorder p="lg" radius="md">
          <Flex justify="space-between">
            <Text size="sm" c="dimmed" fw={500}>
              Điểm trung bình
            </Text>
            <ThemeIcon
              color="green"
              variant="light"
              radius="md"
              size={36}
            >
              <IconTrendingUp size={16} />
            </ThemeIcon>
          </Flex>

          <Text size="xl" fw={700} mt="md">
            {averageScore.toFixed(1)}
          </Text>

          <Progress 
            value={averageScore * 10} 
            mt="md" 
            color="green" 
            size="sm" 
            radius="xl"
          />
          
          <Text size="xs" c="dimmed" mt={5}>
            {averageScore >= 8 ? 'Xuất sắc' : 
             averageScore >= 6 ? 'Tốt' : 
             averageScore >= 4 ? 'Trung bình' : 'Cần cải thiện'}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Criteria Management Dashboard */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <CriteriaDashboard />
      </Card>

      {/* Quick Actions */}
      <Card withBorder p="lg" radius="md">
        <Text size="lg" fw={600} mb="md">Hành động nhanh</Text>
        <Group>
          <Button 
            leftSection={<IconUpload size={16} />} 
            onClick={handleUploadSingle}
            size="md"
          >
            Upload đơn
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconUpload size={16} />} 
            onClick={handleUploadBatch}
            size="md"
          >
            Upload hàng loạt
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconHistory size={16} />} 
            onClick={handleViewHistory}
            size="md"
          >
            Xem lịch sử
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconClipboardList size={16} />} 
            onClick={handleViewUngraded}
            size="md"
          >
            File chưa chấm
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconFiles size={16} />} 
            onClick={handleViewRubrics}
            size="md"
          >
            Quản lý rubric
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconUser size={16} />} 
            onClick={handleViewProfile}
            size="md"
          >
            Hồ sơ cá nhân
          </Button>
        </Group>
      </Card>
    </Container>
  )
}

export default DashboardRoute