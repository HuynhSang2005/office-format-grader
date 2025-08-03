import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Title, Text, Stack, SimpleGrid, Button } from '@mantine/core';
import { FileDropzone } from '../components/FileDropzone';
import { ResultsTable } from '../components/ResultsTable';
import { encodeFileToBase64 } from '../lib/fileUtils';

import type { UploadedFile, GradingResult } from '../types/api.types';

export const Route = createFileRoute('/ai-checker')({
  component: AICheckerPage,
});

function AICheckerPage() {
  // Sử dụng type 'UploadedFile' cho state
  const [rubricFile, setRubricFile] = useState<UploadedFile | null>(null);
  const [submissionFile, setSubmissionFile] = useState<UploadedFile | null>(null);

  // Sử dụng type 'GradingResult' cho state kết quả
  const [result, setResult] = useState<GradingResult | null>(null);

  // (interface UploadedFile đã được chuyển ra ngoài)

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
      {result && <ResultsTable result={result} />}
    </Stack>
  );
}