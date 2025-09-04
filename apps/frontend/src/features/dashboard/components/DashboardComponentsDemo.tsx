import { Container, Stack, Title } from '@mantine/core';
import { StatsGrid, ScoreDistributionChart, PaginatedScoreTable } from '@/features/dashboard/components';
import type { DashboardGradeResult, PaginationInfo } from '@/types';

// Sample data for testing the dashboard components
const sampleStatsData = {
  totalGraded: 127,
  totalUngraded: 23,
  totalCustomRubrics: 8,
};

// Sample grade results for testing paginated table
const sampleGradeResults: DashboardGradeResult[] = [
  {
    id: '1',
    filename: 'assignment-01.docx',
    fileType: 'DOCX',
    totalPoints: 9.5,
    gradedAt: '2025-09-01T10:30:00Z',
  },
  {
    id: '2',
    filename: 'presentation-final.pptx',
    fileType: 'PPTX',
    totalPoints: 8.7,
    gradedAt: '2025-09-02T14:15:00Z',
  },
  {
    id: '3',
    filename: 'report-research.docx',
    fileType: 'DOCX',
    totalPoints: 7.8,
    gradedAt: '2025-09-03T09:45:00Z',
  },
];

// Sample pagination info
const samplePagination: PaginationInfo = {
  currentPage: 1,
  totalPages: 3,
  totalCount: 25,
  hasNextPage: true,
  hasPreviousPage: false,
};

/**
 * Demo page to showcase the dashboard components.
 * This is for development/testing purposes only.
 * @returns {JSX.Element} The rendered demo page.
 */
export function DashboardComponentsDemo() {
  const handlePageChange = (page: number) => {
    console.log('Page changed to:', page);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">Dashboard Components Demo</Title>
        
        <Title order={2}>Statistics Grid</Title>
        <StatsGrid data={sampleStatsData} />
        
        <Title order={2}>Score Distribution Chart</Title>
        <ScoreDistributionChart />
        
        <Title order={2}>Paginated Score Table</Title>
        <PaginatedScoreTable
          title="Top 10 Điểm Cao Nhất"
          data={sampleGradeResults}
          pagination={samplePagination}
          onPageChange={handlePageChange}
          isLoading={false}
        />
        
        <Title order={2}>Loading State Demo</Title>
        <PaginatedScoreTable
          title="Top 10 Điểm Thấp Nhất"
          data={[]}
          pagination={samplePagination}
          onPageChange={handlePageChange}
          isLoading={true}
        />
      </Stack>
    </Container>
  );
}
