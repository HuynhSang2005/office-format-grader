import { useState } from 'react';
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

  // Xử lý upload file và chuyển sang base64
  const handleFileDrop = async (
    files: File[],
    fileSetter: React.Dispatch<React.SetStateAction<UploadedFile | null>>
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const base64Content = await encodeFileToBase64(file);
      fileSetter({
        filename: file.name,
        content: base64Content,
      });
    } catch (error) {
      alert("Lỗi mã hóa file: " + (error as Error).message);
    }
  };

  // Gửi request chấm điểm
  const mutation = useMutation({
    mutationFn: gradeSubmission,
  });

  const handleSubmit = () => {
    if (!rubricFile || !submissionFile) {
      alert("Vui lòng tải lên cả hai file!");
      return;
    }
    mutation.mutate({ rubricFile, submissionFile });
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Trình Chấm Điểm bằng AI</Title>
        <Text c="dimmed" mt="sm">
          Tải lên file tiêu chí và file bài nộp để bắt đầu chấm điểm tự động.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Stack>
          <Title order={4}>1. Tải lên file Tiêu chí (.docx)</Title>
          <FileDropzone
            onDrop={(files) => handleFileDrop(files, setRubricFile)}
            accept={{
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
          />
          {rubricFile && <Text c="green" fw={500}>Đã chọn: {rubricFile.filename}</Text>}
        </Stack>
        <Stack>
          <Title order={4}>2. Tải lên file Bài nộp (.pptx, .docx)</Title>
          <FileDropzone
            onDrop={(files) => handleFileDrop(files, setSubmissionFile)}
            accept={{
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
          />
          {submissionFile && <Text c="green" fw={500}>Đã chọn: {submissionFile.filename}</Text>}
        </Stack>
      </SimpleGrid>

      <Button size="lg" fullWidth onClick={handleSubmit} loading={mutation.isPending}>
        {mutation.isPending ? 'Đang chấm điểm...' : 'Bắt đầu chấm điểm'}
      </Button>

      {/* Hiển thị lỗi nếu có */}
      {mutation.isError && (
        <Alert icon={<AlertCircle size={16} />} title="Có lỗi xảy ra!" color="red" withCloseButton onClose={() => mutation.reset()}>
          {(mutation.error as Error).message}
        </Alert>
      )}

      {/* Hiển thị kết quả khi thành công */}
      {mutation.isSuccess && <ResultsTable result={mutation.data as GradingResult} />}
    </Stack>
  );
}