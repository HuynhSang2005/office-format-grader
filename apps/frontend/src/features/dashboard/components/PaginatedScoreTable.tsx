import { Table, Title, Paper, Pagination, LoadingOverlay, Group, Text, Alert } from '@mantine/core';
import type { DashboardGradeResult, PaginationInfo } from '@/types';

/**
 * Props for the PaginatedScoreTable component.
 */
interface PaginatedScoreTableProps {
  title: string;
  data: DashboardGradeResult[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

/**
 * A reusable table component that displays score data with pagination.
 * @param {PaginatedScoreTableProps} props - The props for the component.
 * @returns {JSX.Element} The rendered paginated table.
 */
export function PaginatedScoreTable({
  title,
  data,
  pagination,
  onPageChange,
  isLoading,
}: PaginatedScoreTableProps) {
  const rows = data.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.filename}</Table.Td>
      <Table.Td>{item.fileType}</Table.Td>
      <Table.Td>{item.totalPoints.toFixed(2)}</Table.Td>
      <Table.Td>{new Date(item.gradedAt).toLocaleDateString('vi-VN')}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="md" radius="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Title order={4} mb="md">
        {title}
      </Title>
      {data.length === 0 ? (
        <Alert color="blue" title="Chưa có dữ liệu">
          <Text size="sm">
            {title.includes('Cao Nhất') 
              ? 'Chưa có bài chấm điểm nào để hiển thị top điểm cao nhất.' 
              : 'Chưa có bài chấm điểm nào để hiển thị top điểm thấp nhất.'}
          </Text>
        </Alert>
      ) : (
        <>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tên File</Table.Th>
                <Table.Th>Loại File</Table.Th>
                <Table.Th>Điểm</Table.Th>
                <Table.Th>Ngày Chấm</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
          
          {pagination.totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={pagination.totalPages}
                value={pagination.currentPage}
                onChange={onPageChange}
              />
            </Group>
          )}
        </>
      )}
    </Paper>
  );
}
