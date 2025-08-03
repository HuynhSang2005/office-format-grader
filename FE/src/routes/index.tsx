import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Title, Stack, Card, Select, Button, Loader, Alert, JsonInput, Group } from '@mantine/core';
import { getAvailableFiles, getFileDetails } from '../api/analyzer.api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mode, setMode] = useState('content');
  const [output, setOutput] = useState('json');

  // Query 1: Tự động lấy danh sách file khi trang được tải
  const filesQuery = useQuery({
    queryKey: ['availableFiles'],
    queryFn: getAvailableFiles,
  });

  // Query 2: Chỉ chạy khi được kích hoạt để phân tích file
  const detailsQuery = useQuery({
    queryKey: ['fileDetails', selectedFile, mode, output],
    queryFn: () => getFileDetails({ filename: selectedFile!, mode, output }),
    enabled: false, // Chỉ chạy khi gọi refetch()
    retry: false, // Không tự động thử lại khi có lỗi
  });

  const handleAnalyze = () => {
    if (selectedFile) {
      detailsQuery.refetch();
    }
  };

  return (
    <Stack gap="xl">
      <Title order={2}>Trình Phân Tích File Chi Tiết</Title>

      <Card withBorder shadow="sm" radius="md">
        <Stack>
          <Select
            label="1. Chọn file để phân tích"
            placeholder="Đang tải danh sách file..."
            data={filesQuery.data || []}
            value={selectedFile}
            onChange={setSelectedFile}
            disabled={filesQuery.isLoading || !filesQuery.data}
            searchable
          />
          <Group grow>
            <Select
              label="2. Chọn chế độ phân tích"
              data={[{ value: 'content', label: 'Chỉ lấy nội dung' }, { value: 'full', label: 'Phân tích đầy đủ' }]}
              value={mode}
              onChange={(value) => setMode(value || 'content')}
            />
            <Select
              label="3. Chọn định dạng đầu ra"
              data={[{ value: 'json', label: 'JSON (Hiển thị tại đây)' }, { value: 'excel', label: 'Tải về file Excel' }]}
              value={output}
              onChange={(value) => setOutput(value || 'json')}
            />
          </Group>
          <Button onClick={handleAnalyze} disabled={!selectedFile || detailsQuery.isFetching} loading={detailsQuery.isFetching}>
            Phân Tích
          </Button>
        </Stack>
      </Card>

      {detailsQuery.isFetching && <Loader />}

      {detailsQuery.isError && (
        <Alert icon={<AlertCircle size={16} />} title="Có lỗi xảy ra!" color="red">
          {detailsQuery.error.message}
        </Alert>
      )}

      {detailsQuery.isSuccess && (
        output === 'json' ? (
            <JsonInput
                label="Kết quả phân tích (JSON)"
                value={JSON.stringify(detailsQuery.data, null, 2)}
                readOnly
                autosize
                minRows={10}
                maxRows={30}
            />
        ) : (
            <Alert icon={<CheckCircle size={16} />} title="Thành công!" color="green">
                File Excel đã được tải về. Vui lòng kiểm tra thư mục download của bạn.
            </Alert>
        )
      )}
    </Stack>
  );
}