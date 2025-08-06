import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Title, Text, Stack, SimpleGrid, Button, Alert, Group } from '@mantine/core';
import { FileDropzone } from '../components/FileDropzone';
import { ResultsTable } from '../components/ResultsTable';
import type { GradeResponse } from '../types/api.types';
import { processGrading } from '../api/checker.api';
import { AlertCircle, X, Download } from 'lucide-react';

export const Route = createFileRoute('/ai-checker')({
  component: AICheckerPage,
});

function AICheckerPage() {
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null); 
  const [validationError, setValidationError] = useState<string>('');

  const gradeMutation = useMutation<GradeResponse, Error, { rubricFile: File; submissionFile: File }>({
  mutationFn: async (payload) => {
    // Chỉ gọi với output 'json'
    const result = await processGrading({ ...payload, output: 'json' });
    // Nếu trả về không phải GradeResponse, ném lỗi
    if (!result || !('gradingResult' in result)) {
      throw new Error('Kết quả trả về không hợp lệ!');
    }
    return result as GradeResponse;
  },
});
  const downloadMutation = useMutation<{ message: string }, Error, { rubricFile: File; submissionFile: File }>({
  mutationFn: async (payload) => {
    // Chỉ gọi với output 'excel'
    const result = await processGrading({ ...payload, output: 'excel' });
    // Nếu trả về không phải message, ném lỗi
    if (!result || !('message' in result)) {
      throw new Error('Không thể tải file Excel!');
    }
    return result as { message: string };
  },
});

  const handleFileDrop = useCallback(
    (files: File[], fileSetter: React.Dispatch<React.SetStateAction<File | null>>) => {
      setValidationError('');
      if (!files || files.length === 0) return;
      fileSetter(files[0]);
    },
    []
  );

  const handleDownload = () => {
    if (rubricFile && submissionFile) {
      downloadMutation.mutate({ rubricFile, submissionFile });
    }
  };

  const handleSubmit = useCallback(() => {
    if (!rubricFile || !submissionFile) {
      setValidationError("Vui lòng tải lên cả hai file!");
      return;
    }
    downloadMutation.reset();
    gradeMutation.mutate({ rubricFile, submissionFile });
  }, [rubricFile, submissionFile, gradeMutation, downloadMutation]);

  useEffect(() => {
    gradeMutation.reset();
  }, [rubricFile, submissionFile]);

  return (
    <Stack gap="xl" align="center" maw={1000} mx="auto">
      <Stack align="center" gap={4}>
        <Title order={2}>Trình Chấm Điểm bằng AI</Title>
        <Text c="dimmed" mt="sm" ta="center">
          Tải lên file tiêu chí và file bài nộp để bắt đầu chấm điểm tự động.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
        <Stack>
          <Title order={4} ta="center">1. Tải lên file Tiêu chí (.docx)</Title>
          <FileDropzone
            onDrop={(files) => handleFileDrop(files, setRubricFile)}
            accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
          />
          {rubricFile && (
            <Group justify="center" gap="xs">
              <Text c="green" fw={500} ta="center">
                Đã chọn: {rubricFile.name}
              </Text>
              <Button
                size="xs"
                color="red"
                variant="subtle"
                onClick={() => setRubricFile(null)}
                leftSection={<X size={16} />}
              >
                Hủy
              </Button>
            </Group>
          )}
        </Stack>
        <Stack>
          <Title order={4} ta="center">2. Tải lên file Bài nộp (.pptx, .docx)</Title>
          <FileDropzone
            onDrop={(files) => handleFileDrop(files, setSubmissionFile)}
            accept={{
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }}
          />
          {submissionFile && (
            <Group justify="center" gap="xs">
              <Text c="green" fw={500} ta="center">
                Đã chọn: {submissionFile.name}
              </Text>
              <Button
                size="xs"
                color="red"
                variant="subtle"
                onClick={() => setSubmissionFile(null)}
                leftSection={<X size={16} />}
              >
                Hủy
              </Button>
            </Group>
          )}
        </Stack>
      </SimpleGrid>

      {/* Hiển thị lỗi validation */}
      {validationError && (
        <Alert icon={<AlertCircle size={16} />} title="Thông tin chưa hợp lệ" color="orange" w="100%" withCloseButton onClose={() => setValidationError('')}>
          {validationError}
        </Alert>
      )}

      <Button size="lg" w="100%" onClick={handleSubmit} loading={gradeMutation.isPending} disabled={!rubricFile || !submissionFile || gradeMutation.isPending}>
        {gradeMutation.isPending ? 'Đang chấm điểm...' : 'Bắt đầu chấm điểm'}
      </Button>

      {/* Hiển thị lỗi từ API */}
      {gradeMutation.isError && (
        <Alert icon={<AlertCircle size={16} />} title="Có lỗi xảy ra!" color="red" w="100%" withCloseButton onClose={() => gradeMutation.reset()}>
          {gradeMutation.error.message}
        </Alert>
      )}

      {/* Hiển thị kết quả khi thành công */}
      {gradeMutation.isSuccess && (
        <>
          <ResultsTable result={gradeMutation.data.gradingResult} />
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

export default AICheckerPage;