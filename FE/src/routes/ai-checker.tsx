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

  const mutation = useMutation({
    mutationFn: gradeSubmission, 
  });

  const handleFileDrop = async (files: File[], fileSetter: React.Dispatch<React.SetStateAction<UploadedFile | null>>) => {
  };

  const handleSubmit = () => {
    if (!rubricFile || !submissionFile) {
      // Có thể dùng notification của Mantine để thông báo lỗi này
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
      </SimpleGrid>

      <Button size="lg" fullWidth onClick={handleSubmit} loading={mutation.isPending}>
        {mutation.isPending ? 'Đang chấm điểm...' : 'Bắt đầu chấm điểm'}
      </Button>

      {/* Hiển thị lỗi nếu có */}
      {mutation.isError && (
        <Alert icon={<AlertCircle size={16} />} title="Có lỗi xảy ra!" color="red" withCloseButton onClose={() => mutation.reset()}>
          {mutation.error.message}
        </Alert>
      )}

      {/* Hiển thị kết quả khi thành công */}
      {mutation.isSuccess && <ResultsTable result={mutation.data} />}
    </Stack>
  );
}