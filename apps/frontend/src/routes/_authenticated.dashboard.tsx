import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Container, Loader, Alert, Stack, Grid, Title, Center, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

import { getDashboardStats } from '@/api/dashboardApi';
import { StatsGrid } from '@/features/dashboard/components/StatsGrid';
import { ScoreDistributionChart } from '@/features/dashboard/components/ScoreDistributionChart';
import { PaginatedScoreTable } from '@/features/dashboard/components/PaginatedScoreTable';

/**
 * The main dashboard page, displaying statistics and score lists.
 * @returns {JSX.Element} The rendered dashboard page.
 */
function DashboardPage() {
  const [highestPage, setHighestPage] = useState(1);
  const [lowestPage, setLowestPage] = useState(1);
  const limit = 5; // Show 5 items per page in the tables

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats', highestPage, lowestPage, limit],
    queryFn: () => getDashboardStats({ page: highestPage, limit }), // For now, we simplify and use one page state for the API
  });

  if (isLoading) {
    return (
      <Container size="lg">
        <Center style={{ height: '50vh' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text>Đang tải dữ liệu Dashboard...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container size="lg">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Không thể tải Dashboard" 
          color="red"
          mt="xl"
        >
          Đã xảy ra lỗi khi tải dữ liệu Dashboard. Vui lòng thử lại sau.
          <br />
          <Text size="sm" c="dimmed" mt="xs">Chi tiết: {error?.message}</Text>
        </Alert>
      </Container>
    );
  }

  const stats = data?.data;

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Title order={1}>Dashboard</Title>
        {stats && <StatsGrid data={stats} />}
        <ScoreDistributionChart />

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            {stats?.topHighestPaginated && (
              <PaginatedScoreTable
                title="Top Điểm Cao Nhất"
                data={stats.topHighestPaginated.data}
                pagination={stats.topHighestPaginated.pagination}
                onPageChange={setHighestPage}
                isLoading={isLoading}
              />
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            {stats?.topLowestPaginated && (
              <PaginatedScoreTable
                title="Top Điểm Thấp Nhất"
                data={stats.topLowestPaginated.data}
                pagination={stats.topLowestPaginated.pagination}
                onPageChange={setLowestPage}
                isLoading={isLoading}
              />
            )}
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});
