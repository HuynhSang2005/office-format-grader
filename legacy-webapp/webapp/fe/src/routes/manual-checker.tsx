import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Title,
  Stack,
  Card,
  Button,
  Loader,
  Alert,
  Group,
  Text,
  Select,
} from '@mantine/core';
import { checkManually } from '../api/manualChecker.api';
import { FileDropzone } from '../components/FileDropzone';
import { ResultsTable } from '../components/ResultsTable';
import { AlertCircle, Download, CheckCircle, X } from 'lucide-react';

export const Route = createFileRoute('/manual-checker')({
  component: ManualCheckerPage,
});

function ManualCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  // Xóa state output không sử dụng vì chúng ta luôn sử dụng JSON cho mutation chính và Excel cho downloadMutation
  const [format, setFormat] = useState<'standard' | 'detailed'>('standard');

  const mutation = useMutation({
    mutationFn: ({ file, format }: { file: File, format: 'standard' | 'detailed' }) => 
      checkManually({ file, output: 'json', format }),
  });

  const downloadMutation = useMutation({
    mutationFn: (file: File) => checkManually({ file, output: 'excel', format }),
  });

  const handleFileDrop = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setFile(files[0]);
  };

  const handleCheck = () => {
    if (file) {
      // Chỉ truyền file và format cho mutation
      mutation.mutate({ file, format });
    }
  };

  const handleDownload = () => {
    if (file) {
      downloadMutation.mutate(file);
    }
  };

  return (
    <Stack gap="xl" align="center" maw={800} mx="auto">
      <Stack align="center" gap={4}>
        <Title order={2}>
          <CheckCircle style={{ marginRight: 8, verticalAlign: 'middle' }} size={28} />
          Chấm Điểm Thủ Công PowerPoint
        </Title>
        <Text c="dimmed" ta="center">
          Tải lên một file <b>.pptx</b> để chấm điểm theo bộ tiêu chí được định sẵn.
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
                leftSection={<X size={16} />}
              >
                Hủy
              </Button>
            </Group>
          )}

          <Select
            label="Chọn định dạng kết quả"
            data={[
              { value: 'standard', label: 'Tiêu chuẩn' },
              { value: 'detailed', label: 'Chi tiết' }
            ]}
            value={format}
            onChange={(value) => setFormat(value as 'standard' | 'detailed')}
          />

          <Button
            mt="md"
            onClick={handleCheck}
            disabled={!file || mutation.isPending}
            loading={mutation.isPending}
          >
            Chấm Điểm
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
        <>
          <ResultsTable result={mutation.data} />
          <Button
            mt="md"
            onClick={handleDownload}
            leftSection={<Download size={18} />}
            loading={downloadMutation.isPending}
          >
            Tải Báo Cáo Excel
          </Button>
          {downloadMutation.isError && (
            <Text c="red" size="sm" mt="xs">
              {downloadMutation.error.message}
            </Text>
          )}
        </>
      )}
    </Stack>
  );
}
