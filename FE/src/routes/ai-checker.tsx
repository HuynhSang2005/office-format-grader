import { useState, useCallback, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Title, Text, Stack, SimpleGrid, Button, Alert } from '@mantine/core';
import { FileDropzone } from '../components/FileDropzone';
import { ResultsTable } from '../components/ResultsTable';
import { encodeFileToBase64 } from '../lib/fileUtils';
import type { UploadedFile, GradingResult } from '../types/api.types';
import { gradeSubmission } from '../api/checker.api';
import { AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/ai-checker')({
  component: AICheckerPage,
});

function AICheckerPage() {
  const [rubricFile, setRubricFile] = useState<UploadedFile | null>(null);
  const [submissionFile, setSubmissionFile] = useState<UploadedFile | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const handleFileDrop = useCallback(async (
    files: File[],
    fileSetter: React.Dispatch<React.SetStateAction<UploadedFile | null>>
  ) => {
    setValidationError('');
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const base64Content = await encodeFileToBase64(file);
      fileSetter({
        filename: file.name,
        content: base64Content,
      });
    } catch (error) {
        setValidationError(`Lỗi mã hóa file: ${(error as Error).message}`);
    }
  }, []);

  // Cung cấp kiểu dữ liệu cho useMutation để tăng cường type-safety
  const mutation = useMutation<GradingResult, Error, { rubricFile: UploadedFile; submissionFile: UploadedFile }>({
    mutationFn: gradeSubmission,
  });

  const handleSubmit = useCallback(() => {
    if (!rubricFile || !submissionFile) {
        setValidationError("Vui lòng tải lên cả hai file!");
        return;
    }
    mutation.mutate({ rubricFile, submissionFile });
  }, [rubricFile, submissionFile, mutation]);

  // Reset mutation state khi rubricFile hoặc submissionFile thay đổi
  useEffect(() => {
    mutation.reset();
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
          {rubricFile && <Text c="green" fw={500} ta="center">Đã chọn: {rubricFile.filename}</Text>}
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
          {submissionFile && <Text c="green" fw={500} ta="center">Đã chọn: {submissionFile.filename}</Text>}
        </Stack>
      </SimpleGrid>

      {/* Hiển thị lỗi validation */}
      {validationError && (
        <Alert icon={<AlertCircle size={16} />} title="Thông tin chưa hợp lệ" color="orange" w="100%" withCloseButton onClose={() => setValidationError('')}>
          {validationError}
        </Alert>
      )}

      <Button size="lg" w="100%" onClick={handleSubmit} loading={mutation.isPending} disabled={!rubricFile || !submissionFile || mutation.isPending}>
        {mutation.isPending ? 'Đang chấm điểm...' : 'Bắt đầu chấm điểm'}
      </Button>

      {/* Hiển thị lỗi từ API */}
      {mutation.isError && (
        <Alert icon={<AlertCircle size={16} />} title="Có lỗi xảy ra!" color="red" w="100%" withCloseButton onClose={() => mutation.reset()}>
          {mutation.error.message}
        </Alert>
      )}

      {/* Hiển thị kết quả khi thành công */}
      {mutation.isSuccess && <ResultsTable result={mutation.data} />}
    </Stack>
  );
}