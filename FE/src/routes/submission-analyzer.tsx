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
  SimpleGrid,
} from '@mantine/core';
import { analyzeSubmission } from '../api/submission.api';
import { FileDropzone } from '../components/FileDropzone';
import { SubmissionSummaryViewer } from '../components/SubmissionSummaryViewer';
import { AlertCircle, FileText, X } from 'lucide-react';

export const Route = createFileRoute('/submission-analyzer')({
  component: SubmissionAnalyzerPage,
});

function SubmissionAnalyzerPage() {
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: analyzeSubmission,
  });

  const handleSubmissionDrop = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setSubmissionFile(files[0]);
  };

  const handleRubricDrop = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setRubricFile(files[0]);
  };

  const handleAnalyze = () => {
    if (submissionFile) {
      mutation.mutate({ 
        submissionFile, 
        rubricFile: rubricFile || undefined 
      });
    }
  };

  return (
    <Stack gap="xl" align="center" maw={800} mx="auto">
      <Stack align="center" gap={4}>
        <Title order={2}>
          <FileText style={{ marginRight: 8, verticalAlign: 'middle' }} size={28} />
          Trình Phân Tích Bài Nộp
        </Title>
        <Text c="dimmed" ta="center">
          Tải lên file bài nộp và file rubric (tùy chọn) để xem báo cáo phân tích.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
        <Card withBorder shadow="sm" radius="md" p="xl">
          <Stack>
            <Title order={4} ta="center">File Bài Nộp (.docx, .pptx)</Title>
            <FileDropzone
              onDrop={handleSubmissionDrop}
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
        </Card>
        
        <Card withBorder shadow="sm" radius="md" p="xl">
          <Stack>
            <Title order={4} ta="center">File Rubric (.docx) - Tùy chọn</Title>
            <FileDropzone
              onDrop={handleRubricDrop}
              accept={{
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
              }}
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
        </Card>
      </SimpleGrid>

      <Button
        mt="md"
        w="100%"
        onClick={handleAnalyze}
        disabled={!submissionFile || mutation.isPending}
        loading={mutation.isPending}
      >
        Phân Tích Bài Nộp
      </Button>

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
        <SubmissionSummaryViewer summary={mutation.data} />
      )}
    </Stack>
  );
}
