import { createFileRoute } from '@tanstack/react-router'

import { FileDropzone } from '../components/FileDropzone';

import { ResultsTable } from '../components/ResultsTable';
import { Title, Text, Stack, SimpleGrid, Button } from '@mantine/core';

export const Route = createFileRoute('/ai-checker')({
  component: AICheckerPage,
})

function AICheckerPage() {
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
            <FileDropzone accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }} />
        </Stack>
        <Stack>
            <Title order={4}>2. Tải lên file Bài nộp (.pptx, .docx)</Title>
            <FileDropzone accept={{
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }} />
        </Stack>
      </SimpleGrid>

      <Button size="lg" fullWidth>
        Bắt đầu chấm điểm
      </Button>

      {/* Phần kết quả sẽ được hiển thị ở đây */}
      <ResultsTable />

    </Stack>
  )
}