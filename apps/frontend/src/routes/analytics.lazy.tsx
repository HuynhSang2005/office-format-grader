/**
 * @file analytics.lazy.tsx
 * @description Analytics dashboard page with charts and statistics
 * @author Your Name
 * @link https://www.tremor.so/
 * @link https://recharts.org/
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Card,
  Container,
  Flex,
  Text,
  Group,
  Skeleton,
  Alert,
  Box,
  Title,
  Badge
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { DatePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useState } from 'react'
import { 
  LineChart, 
  BarChart
} from '@tremor/react'
import { useAnalytics } from '../hooks/use-analytics'
import type { DashboardQuery } from '../schemas/analytics.schema'

export const Route = createLazyFileRoute('/analytics')({
  component: AnalyticsRoute,
})

function AnalyticsRoute() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  
  // Convert date range to query parameters
  const queryParams: DashboardQuery = {
    startDate: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
    endDate: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
  }
  
  const { data: analyticsStats, isLoading, error } = useAnalytics(
    queryParams.startDate || queryParams.endDate ? queryParams : undefined
  )
  
  // Transform data for line chart - count by date
  const lineChartData = analyticsStats?.data?.countByUploadDate?.map(item => ({
    date: dayjs(item.date).format('DD/MM'),
    'Số lượng': item.count,
  })) || []
  
  // Transform data for bar chart - count by file type
  const barChartData = analyticsStats?.data?.countByFileType ? [
    {
      'Loại file': 'PPTX',
      'Số lượng': analyticsStats.data.countByFileType.PPTX,
    },
    {
      'Loại file': 'DOCX',
      'Số lượng': analyticsStats.data.countByFileType.DOCX,
    },
  ] : []

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Flex justify="space-between" align="center" mb="xl">
          <div>
            <Skeleton height={28} width={200} mb={10} />
            <Skeleton height={20} width={300} />
          </div>
          <Skeleton height={36} width={200} />
        </Flex>
        
        <Card withBorder p="lg" radius="md" mb="xl">
          <Skeleton height={300} />
        </Card>
        
        <Group grow mb="xl">
          <Card withBorder p="lg" radius="md">
            <Skeleton height={200} />
          </Card>
          <Card withBorder p="lg" radius="md">
            <Skeleton height={200} />
          </Card>
        </Group>
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
          Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.
        </Alert>
      </Container>
    )
  }
  
  if (!analyticsStats) {
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

  return (
    <Container size="xl" py="xl">
      <Flex justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2}>Phân tích dữ liệu</Title>
          <Text size="sm" c="dimmed">
            Thống kê và phân tích hiệu suất chấm điểm
          </Text>
        </Box>
        
        <DatePicker
          value={dateRange[0]}
          onChange={(date) => setDateRange([date as Date | null, dateRange[1]])}
          locale="vi"
          miw={250}
        />
      </Flex>

      {/* Summary Statistics */}
      <Group grow mb="xl">
        <Card withBorder p="lg" radius="md">
          <Text size="sm" c="dimmed">Tổng bài đã chấm</Text>
          <Text size="xl" fw={700}>{analyticsStats.data.totalGraded}</Text>
        </Card>
        <Card withBorder p="lg" radius="md">
          <Text size="sm" c="dimmed">Tổng rubric tùy chỉnh</Text>
          <Text size="xl" fw={700}>{analyticsStats.data.totalCustomRubrics}</Text>
        </Card>
        <Card withBorder p="lg" radius="md">
          <Text size="sm" c="dimmed">Bài chưa chấm</Text>
          <Text size="xl" fw={700}>{analyticsStats.data.totalUngraded}</Text>
        </Card>
      </Group>

      {/* Line Chart - Count by Date */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Text size="lg" fw={600} mb="md">Số lượng bài theo ngày</Text>
        <LineChart
          data={lineChartData}
          index="date"
          categories={['Số lượng']}
          colors={['blue']}
          yAxisWidth={40}
          onValueChange={(v) => console.log(v)}
        />
      </Card>

      <Group grow mb="xl">
        {/* Bar Chart - Count by File Type */}
        <Card withBorder p="lg" radius="md">
          <Text size="lg" fw={600} mb="md">Số lượng theo loại file</Text>
          <BarChart
            data={barChartData}
            index="Loại file"
            categories={['Số lượng']}
            colors={['green']}
            yAxisWidth={40}
          />
        </Card>
        
        {/* Top 5 Highest Scores */}
        <Card withBorder p="lg" radius="md">
          <Text size="lg" fw={600} mb="md">Điểm cao nhất</Text>
          <Box>
            {analyticsStats.data.top5Highest?.map((item, index) => (
              <Flex key={item.id} justify="space-between" py="xs">
                <Text size="sm">{index + 1}. {item.filename}</Text>
                <Badge color="blue">{item.totalPoints}</Badge>
              </Flex>
            ))}
          </Box>
        </Card>
      </Group>
    </Container>
  )
}

export default AnalyticsRoute