import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Title, Text, Stack, SimpleGrid, Button } from '@mantine/core';
import { FileDropzone } from '../components/FileDropzone';
import { ResultsTable } from '../components/ResultsTable';
import { encodeFileToBase64 } from '../lib/fileUtils'; 

export const Route = createFileRoute('/ai-checker')({
  component: AICheckerPage,
});

// define kiểu dữ liệu cho state của file
interface UploadedFile {
    filename: string;
    content: string; 
}

function AICheckerPage() {
  // State để lưu trữ thông tin file sau khi đã xử lý
  const [rubricFile, setRubricFile] = useState<UploadedFile | null>(null);
  const [submissionFile, setSubmissionFile] = useState<UploadedFile | null>(null);

  // Hàm xử lý chung khi file được thả vào
  const handleFileDrop = async (files: File[], fileSetter: React.Dispatch<React.SetStateAction<UploadedFile | null>>) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const base64Content = await encodeFileToBase64(file);
      fileSetter({
        filename: file.name,
        content: base64Content,
      });
    } catch (error) {
      console.error("Lỗi mã hóa file:", error);
    }
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
                accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
            />
            {rubricFile && <Text c="green" fw={500}>Đã chọn: {rubricFile.filename}</Text>}
        </Stack>
        <Stack>
            <Title order={4}>2. Tải lên file Bài nộp (.pptx, .docx)</Title>
            <FileDropzone
                onDrop={(files) => handleFileDrop(files, setSubmissionFile)}
                accept={{
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                }}
            />
            {submissionFile && <Text c="green" fw={500}>Đã chọn: {submissionFile.filename}</Text>}
        </Stack>
      </SimpleGrid>

      <Button size="lg" fullWidth>
        Bắt đầu chấm điểm
      </Button>

    </Stack>
  );
}