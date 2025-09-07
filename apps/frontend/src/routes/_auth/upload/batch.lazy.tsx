/**
 * @file batch.lazy.tsx
 * @description Batch file upload page (.zip/.rar only) with custom rubric support
 * @author Your Name
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Container, 
  Group, 
  Alert,
  Box,
  rem,
  Switch
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconAlertCircle, IconCheck, IconPackage } from '@tabler/icons-react';
import { useState } from 'react';
import { FileDropzone } from '../../../components/file/dropzone'
import { useUpload } from '../../../hooks/use-upload'
import { RubricSelector } from '../../../components/grade/rubric-selector'

export const Route = createLazyFileRoute('/_auth/upload/batch')({
  component: BatchUploadPage,
});

function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useCustomRubric, setUseCustomRubric] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { mutate: uploadFile, isPending } = useUpload({
    onSuccessRedirect: (fileId, hasGradeResult) => {
      if (hasGradeResult) {
        // Redirect to grade result page when grading is complete
        navigate({ to: '/grade/$resultId', params: { resultId: fileId } });
      } else {
        // For files without automatic grading, go to ungraded files page
        navigate({ to: '/ungraded' });
        notifications.show({
          title: 'Thông báo',
          message: 'File đã được tải lên. Vui lòng chấm điểm trong trang "File chưa chấm".',
          color: 'blue',
        });
      }
    }
  });

  const handleDrop = (droppedFile: File) => {
    // Validate file extension - only .zip or .rar allowed
    const extension = droppedFile.name.split('.').pop()?.toLowerCase();
    if (extension === 'zip' || extension === 'rar') {
      setFile(droppedFile);
      setUploadError(null);
    } else {
      setUploadError('Chỉ chấp nhận file .zip hoặc .rar cho upload hàng loạt');
      setFile(null);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadError(null);
  };

  const handleSubmit = () => {
    if (file) {
      if (useCustomRubric && selectedRubricId) {
        uploadFile({ file, options: { customRubricId: selectedRubricId } });
      } else {
        uploadFile({ file });
      }
    }
  };

  return (
    <Container size="sm" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Group justify="center" mb="md">
          <IconPackage size={32} color="var(--mantine-color-blue-6)" />
        </Group>
        <Title order={2} mb="md" ta="center">Tải file hàng loạt</Title>
        <Text size="sm" c="dimmed" mb="xl" ta="center">
          Chọn file .zip hoặc .rar để tải lên hệ thống. Hệ thống sẽ tự động xử lý và chấm điểm.
        </Text>
        
        <FileDropzone
          onDrop={handleDrop}
          onRemove={handleRemove}
          uploadedFile={file}
          accept={['.zip', '.rar']}
          mb="xl"
        />
        
        {uploadError && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Lỗi" 
            color="red" 
            mb="xl"
          >
            {uploadError}
          </Alert>
        )}
        
        {file && !uploadError && (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="File sẵn sàng" 
            color="green" 
            mb="xl"
          >
            <Text size="sm">
              <Text component="span" fw={500}>{file.name}</Text> ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          </Alert>
        )}
        
        {/* Custom Rubric Selection */}
        <Card withBorder p="md" radius="md" mb="xl">
          <Group justify="space-between" mb="md">
            <Text fw={500}>Sử dụng rubric tùy chỉnh</Text>
            <Switch
              checked={useCustomRubric}
              onChange={(event) => setUseCustomRubric(event.currentTarget.checked)}
            />
          </Group>
          
          {useCustomRubric && (
            <Box mt="md">
              <RubricSelector 
                value={selectedRubricId} 
                onChange={setSelectedRubricId}
                fileType="PPTX" // Default to PPTX for batch uploads
              />
            </Box>
          )}
        </Card>
        
        <Group justify="center">
          <Button
            onClick={handleSubmit}
            disabled={!file || isPending}
            loading={isPending}
            size="md"
            leftSection={<IconUpload size={rem(16)} />}
          >
            {isPending ? 'Đang xử lý...' : 'Tải lên và xử lý'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={!file}
            size="md"
          >
            Hủy bỏ
          </Button>
        </Group>
      </Card>
      
      <Card withBorder shadow="sm" radius="md" p="xl" mt="md">
        <Title order={3} mb="sm">Hướng dẫn upload hàng loạt</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Định dạng hỗ trợ:</Text> .zip, .rar
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Dung lượng tối đa:</Text> 50 MB
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Quy trình xử lý:</Text> Hệ thống sẽ tự động giải nén và chấm điểm từng file
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Thời gian xử lý:</Text> Tùy thuộc vào số lượng và độ phức tạp của tài liệu
        </Text>
      </Card>
    </Container>
  );
}