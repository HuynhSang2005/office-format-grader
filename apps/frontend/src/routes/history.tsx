import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Container,
  Loader,
  Alert,
  Stack,
  Title,
  Table,
  Checkbox,
  Pagination,
  Group,
  Button,
  Center,
  Text,
} from '@mantine/core';
import { IconFileExport, IconAlertCircle } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { useAuthStore } from '@/store/authStore';
import { getGradeHistory } from '@/api/dashboardApi';
import { exportGradesToExcel } from '@/api/exportApi';
import { triggerFileDownload } from '@/lib/downloader';

/**
 * The Grade History page, showing a paginated and selectable list of past grade results.
 * @returns {JSX.Element} The rendered history page.
 */
function HistoryPage() {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gradeHistory', page, limit],
    queryFn: () => getGradeHistory({ limit, offset: (page - 1) * limit }),
    placeholderData: (previousData) => previousData,
  });

  const exportMutation = useMutation({
    mutationFn: exportGradesToExcel,
    onSuccess: (filename) => {
      notifications.show({
        title: 'Thành công',
        message: 'File Excel đang được tải về...',
        color: 'green',
      });
      // Giả định file được serve từ root của server
      triggerFileDownload(`/${filename}`, filename);
    },
    onError: (exportError) => {
      notifications.show({
        title: 'Lỗi Export',
        message: exportError.message,
        color: 'red',
      });
    },
  });

  const handleExport = () => {
    if (selectedIds.length > 0) {
      exportMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? data?.data.results.map((r) => r.id) ?? [] : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((selectedId) => selectedId !== id)
    );
  };

  const allSelected =
    data?.data.results.length === selectedIds.length && selectedIds.length > 0;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const rows = data?.data.results.map((item) => (
    <Table.Tr
      key={item.id}
      bg={selectedIds.includes(item.id) ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Table.Td>
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onChange={(e) => handleSelectRow(item.id, e.currentTarget.checked)}
        />
      </Table.Td>
      <Table.Td>{item.filename}</Table.Td>
      <Table.Td>{item.fileType}</Table.Td>
      <Table.Td>{item.totalPoints.toFixed(2)}</Table.Td>
      <Table.Td>{new Date(item.gradedAt).toLocaleString('vi-VN')}</Table.Td>
    </Table.Tr>
  ));
  
  const totalPages = data ? Math.ceil(data.data.total / limit) : 1;

  if (isLoading) {
    return (
      <Container size="lg">
        <Center style={{ height: '50vh' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text>Đang tải lịch sử chấm bài...</Text>
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
          title="Không thể tải lịch sử" 
          color="red"
          mt="xl"
        >
          Đã xảy ra lỗi khi tải dữ liệu lịch sử chấm bài. Vui lòng thử lại sau.
          <br />
          <Text size="sm" c="dimmed" mt="xs">Chi tiết: {error?.message}</Text>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Lịch sử Chấm bài</Title>
          <Button
            leftSection={<IconFileExport size={16} />}
            disabled={selectedIds.length === 0}
            loading={exportMutation.isPending}
            onClick={handleExport}
          >
            Export ra Excel ({selectedIds.length})
          </Button>
        </Group>
        {data?.data.results.length === 0 ? (
          <Alert title="Chưa có dữ liệu" color="blue">
            <Text>Bạn chưa có lịch sử chấm bài nào. Hãy tải lên và chấm điểm một số file để xem lịch sử tại đây.</Text>
          </Alert>
        ) : (
          <>
            <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                    />
                  </Table.Th>
                  <Table.Th>Tên File</Table.Th>
                  <Table.Th>Loại File</Table.Th>
                  <Table.Th>Điểm</Table.Th>
                  <Table.Th>Ngày Chấm</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
            
            {totalPages > 1 && (
                <Group justify="center" mt="md">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/history')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: HistoryPage,
});
