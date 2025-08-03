import { useState, useEffect } from 'react';
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
  JsonInput,
  Group,
  Text,
} from '@mantine/core';
import { analyzeFile } from '../api/analyzer.api';
import { encodeFileToBase64 } from '../lib/fileUtils';
import type { UploadedFile } from '../types/api.types';
import { FileDropzone } from '../components/FileDropzone';
import { AlertCircle, CheckCircle, FileText, FileDown } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [analysisFile, setAnalysisFile] = useState<UploadedFile | null>(null);
  const [mode, setMode] = useState('full');
  const [output, setOutput] = useState('json');

  const mutation = useMutation({
    mutationFn: analyzeFile,
  });

  const handleFileDrop = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const base64Content = await encodeFileToBase64(file);
      setAnalysisFile({
        filename: file.name,
        content: base64Content,
      });
    } catch (error) {
      console.error("Lỗi mã hóa file:", error);
    }
  };

  const handleAnalyze = () => {
    if (analysisFile) {
      mutation.mutate({ file: analysisFile, mode, output });
    }
  };

  useEffect(() => {
    mutation.reset();
  }, [analysisFile, mode, output]);

  return (
      <Stack gap="xl" maw={800} w="100%">
        <Stack align="center" gap={4}>
          <Title order={2}>
            <FileText style={{ marginRight: 8, verticalAlign: 'middle' }} size={28} />
            Trình Phân Tích File Chi Tiết
          </Title>
          <Text c="dimmed" ta="center">
            Tải lên một file <b>.docx</b> hoặc <b>.pptx</b> để xem phân tích chi tiết về nội dung và định dạng.
          </Text>
        </Stack>

        <Card withBorder shadow="sm" radius="md" p="xl">
          <Stack>
            <Title order={4} ta="center">
              <FileDown style={{ marginRight: 6, verticalAlign: 'middle' }} size={20} />
              1. Tải lên file cần phân tích
            </Title>
            <FileDropzone
              onDrop={handleFileDrop}
              accept={{
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
              }}
            />
            {analysisFile && (
              <Text c="green" fw={500} ta="center">
                Đã chọn: {analysisFile.filename}
              </Text>
            )}

            <Group grow>
              <Select
                label="2. Chọn chế độ phân tích"
                data={[
                  { value: 'full', label: 'Phân tích đầy đủ' },
                  { value: 'content', label: 'Chỉ lấy nội dung' }
                ]}
                value={mode}
                onChange={(value) => setMode(value || 'full')}
              />
              <Select
                label="3. Chọn định dạng đầu ra"
                data={[
                  { value: 'json', label: 'JSON (Hiển thị tại đây)' },
                  { value: 'excel', label: 'Tải về file Excel' }
                ]}
                value={output}
                onChange={(value) => setOutput(value || 'json')}
              />
            </Group>
            <Button
              size="md"
              mt="md"
              onClick={handleAnalyze}
              disabled={!analysisFile || mutation.isPending}
              loading={mutation.isPending}
              leftSection={<FileText size={18} />}
            >
              Phân Tích
            </Button>
          </Stack>
        </Card>

        {/* Loader khi đang xử lý */}
        {mutation.isPending && (
          <Loader color="blue" size="lg" style={{ alignSelf: 'center' }} />
        )}

        {/* Hiển thị lỗi từ API */}
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

        {/* Hiển thị kết quả khi thành công */}
        {mutation.isSuccess && (
          output === 'json' ? (
            <JsonInput
              label={
                <span>
                  <CheckCircle size={18} color="green" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Kết quả phân tích (JSON)
                </span>
              }
              value={JSON.stringify(mutation.data, null, 2)}
              readOnly
              autosize
              minRows={10}
              maxRows={30}
            />
          ) : (
            <Alert
              icon={<CheckCircle size={18} />}
              title="Thành công!"
              color="green"
              w="100%"
            >
              File Excel đã được tải về. Vui lòng kiểm tra thư mục download của bạn.
            </Alert>
          )
        )}
      </Stack>
  );
}