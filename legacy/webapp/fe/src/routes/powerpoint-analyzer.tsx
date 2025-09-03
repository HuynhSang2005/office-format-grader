import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Title,
  Stack,
  Card,
  Select,
  Button,
  Loader,
  Alert,
  Group,
  Text,
} from '@mantine/core';
import { analyzePowerPoint } from '../api/powerpoint.api';
import { FileDropzone } from '../components/FileDropzone';
import { PowerPointResultViewer } from '../components/PowerPointResultViewer';
import { AlertCircle, Presentation } from 'lucide-react';

export const Route = createFileRoute('/powerpoint-analyzer')({
  component: PowerPointAnalyzerPage,
});

function PowerPointAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'full' | 'overview'>('full');

  const mutation = useMutation({
    mutationFn: analyzePowerPoint,
  });

  const handleFileDrop = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setFile(files[0]);
  };

  const handleAnalyze = () => {
    if (file) {
      mutation.mutate({ file, mode });
    }
  };

  return (
    <Stack gap="xl" align="center" maw={800} mx="auto">
      <Stack align="center" gap={4}>
        <Title order={2}>
          <Presentation style={{ marginRight: 8, verticalAlign: 'middle' }} size={28} />
          Trình Phân Tích PowerPoint
        </Title>
        <Text c="dimmed" ta="center">
          Tải lên một file <b>.pptx</b> để xem phân tích chi tiết về nội dung và định dạng.
        </Text>
      </Stack>

      <Card withBorder shadow="sm" radius="md" p="xl">
        <Stack>
          <FileDropzone
            onDrop={handleFileDrop}
            accept={{
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            }}
          />
          {file && (
            <Group justify="center" gap="xs">
              <Text c="green" fw={500} ta="center">
                Đã chọn: {file.name}
              </Text>
              <Button
                size="xs"
                color="red"
                variant="subtle"
                onClick={() => setFile(null)}
              >
                Hủy
              </Button>
            </Group>
          )}

          <Select
            label="Chọn chế độ phân tích"
            data={[
              { value: 'full', label: 'Phân tích chi tiết' },
              { value: 'overview', label: 'Chỉ xem tổng quan' }
            ]}
            value={mode}
            onChange={(value) => setMode(value as 'full' | 'overview')}
          />

          <Button
            mt="md"
            onClick={handleAnalyze}
            disabled={!file || mutation.isPending}
            loading={mutation.isPending}
          >
            Phân Tích PowerPoint
          </Button>
        </Stack>
      </Card>

      {mutation.isPending && (
        <Loader color="blue" size="lg" />
      )}

      {mutation.isError && (
        <Alert
          icon={<AlertCircle size={18} />}
          title="Có lỗi xảy ra!"
          color="red"
          w="100%"
          withCloseButton
          onClose={() => mutation.reset()}
        >
          {mutation.error.message}
        </Alert>
      )}

      {mutation.isSuccess && (
        <PowerPointResultViewer 
          data={mutation.data} 
          mode={mode} 
        />
      )}
    </Stack>
  );
}
