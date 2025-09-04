import { useState } from 'react';
import {
  Group,
  Text,
  useMantineTheme,
  rem,
  Table,
  ActionIcon,
  Button,
  Stack,
  Title,
  Progress,
  Badge,
  Loader,
  Select,
} from '@mantine/core';
import { IconUpload, IconFileText, IconX } from '@tabler/icons-react';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useMutation, useQuery } from '@tanstack/react-query';
import { uploadFile, gradeFile } from '@/api/gradeApi';
import { getCustomRubrics } from '@/api/rubricApi';
import { notifications } from '@mantine/notifications';
import type { GradeResult } from '@/types';
import { GradeResultDisplay } from './GradeResultDisplay';

// Expanded status type to include grading process
type FileProcessStatus =
  | 'pending'
  | 'uploading'
  | 'success' // Successfully uploaded, ready to grade
  | 'error'
  | 'grading'
  | 'graded'
  | 'grade_error';

interface FileProgress {
  status: FileProcessStatus;
  fileId?: string;
  error?: string;
  gradeResult?: GradeResult;
}

/**
 * Props for the FileUpload component.
 */
interface FileUploadProps {
  onGradeComplete: (result: GradeResult) => void;
}

/**
 * Formats file size from bytes to a human-readable string (KB, MB).
 * @param bytes The file size in bytes.
 * @returns The formatted file size string.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * A component for handling file uploads via drag-and-drop or selection.
 * It displays a list of selected files and allows users to manage them, track upload progress, and grade them.
 * @param {FileUploadProps} props - The props for the component.
 * @returns {JSX.Element} The rendered file upload component.
 */
export function FileUpload({ onGradeComplete }: FileUploadProps) {
  const theme = useMantineTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, FileProgress>>({});
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>('default');

  const { data: rubrics, isLoading: isLoadingRubrics } = useQuery({
    queryKey: ['customRubrics'],
    queryFn: getCustomRubrics,
  });

  const rubricOptions = [
    { value: 'default', label: 'Rubric Mặc định' },
    ...(rubrics?.map(r => ({ value: r.id, label: r.name })) ?? []),
  ];

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onMutate: (file) => {
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: { status: 'uploading' },
      }));
    },
    onSuccess: (data, file) => {
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: { status: 'success', fileId: data.data.fileId },
      }));
      notifications.show({
        title: 'Thành công',
        message: `File ${file.name} đã được tải lên thành công`,
        color: 'green',
      });
    },
    onError: (error, file) => {
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: { status: 'error', error: error.message },
      }));
      notifications.show({
        title: `Lỗi tải lên file: ${file.name}`,
        message: error.message,
        color: 'red',
      });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: gradeFile,
    onMutate: (payload) => {
      // Find fileName from fileId to update progress
      const fileName = Object.keys(fileProgress).find(
        (name) => fileProgress[name].fileId === payload.fileId
      );
      if (fileName) {
        setFileProgress((prev) => ({
          ...prev,
          [fileName]: { ...prev[fileName], status: 'grading' },
        }));
      }
    },
    onSuccess: (data) => {
      const fileName = data.data.gradeResult.filename;
      const gradeResult = data.data.gradeResult;
      setFileProgress((prev) => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          status: 'graded',
          gradeResult: gradeResult,
        },
      }));
      notifications.show({
        title: 'Chấm điểm thành công',
        message: `File ${fileName} đã được chấm điểm xong`,
        color: 'teal',
      });
      // Call callback to notify parent component
      onGradeComplete(gradeResult);
    },
    onError: (error, payload) => {
      const fileName = Object.keys(fileProgress).find(
        (name) => fileProgress[name].fileId === payload.fileId
      );
      if (fileName) {
        setFileProgress((prev) => ({
          ...prev,
          [fileName]: { ...prev[fileName], status: 'grade_error', error: error.message },
        }));
        notifications.show({
          title: `Lỗi chấm điểm file: ${fileName}`,
          message: error.message,
          color: 'red',
        });
      }
    },
  });

  const handleSetFiles = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    const initialProgress: Record<string, FileProgress> = {};
    acceptedFiles.forEach((file) => {
      initialProgress[file.name] = { status: 'pending' };
    });
    setFileProgress(initialProgress);
  };

  const handleRemoveFile = (index: number) => {
    const fileName = files[index].name;
    setFiles((currentFiles) => currentFiles.filter((_, i) => i !== index));
    setFileProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleUpload = () => {
    files.forEach((file) => {
      if (fileProgress[file.name]?.status === 'pending') {
        uploadMutation.mutate(file);
      }
    });
  };

  const handleGradeAll = () => {
    Object.values(fileProgress).forEach((progress) => {
      if (progress.status === 'success' && progress.fileId) {
        const payload = {
          fileId: progress.fileId,
          rubricId: selectedRubricId === 'default' || selectedRubricId === null ? undefined : selectedRubricId,
        };
        gradeMutation.mutate(payload);
      }
    });
  };

  const isUploading = uploadMutation.isPending;
  const isGrading = gradeMutation.isPending;
  const pendingFilesCount = files.filter(f => fileProgress[f.name]?.status === 'pending').length;
  const filesReadyToGrade = Object.values(fileProgress).filter(p => p.status === 'success').length;
  const gradedFiles = Object.entries(fileProgress).filter(([_, progress]) => progress.status === 'graded' && progress.gradeResult);

  const fileRows = files.map((file, index) => {
    const progress = fileProgress[file.name];
    const statusCell = () => {
      switch (progress?.status) {
        case 'uploading':
          return <Progress value={100} striped animated />;
        case 'success':
          return <Badge color="green">Sẵn sàng chấm</Badge>;
        case 'error':
          return <Badge color="red" title={progress.error}>Lỗi tải lên</Badge>;
        case 'grading':
          return <Group gap="xs"><Loader size="xs" /><Text size="xs">Đang chấm...</Text></Group>;
        case 'graded':
          return <Badge color="teal">Đã chấm xong</Badge>;
        case 'grade_error':
          return <Badge color="maroon" title={progress.error}>Lỗi chấm điểm</Badge>;
        case 'pending':
        default:
          return <Text size="sm" c="dimmed">Chờ tải lên</Text>;
      }
    };

    return (
      <Table.Tr key={file.name + index}>
        <Table.Td>{file.name}</Table.Td>
        <Table.Td>{formatFileSize(file.size)}</Table.Td>
        <Table.Td>{statusCell()}</Table.Td>
        <Table.Td>
          <ActionIcon
            color="red"
            onClick={() => handleRemoveFile(index)}
            disabled={isUploading || isGrading || (progress && progress.status !== 'pending')}
          >
            <IconX size="1rem" />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="xl">
      <Title order={2}>Tải lên và Chấm điểm Tài liệu</Title>
      
      <Dropzone
        onDrop={handleSetFiles}
        onReject={(rejectedFiles) => console.log('rejected files', rejectedFiles)}
        maxSize={50 * 1024 ** 2} // 50MB
        accept={[MIME_TYPES.docx, MIME_TYPES.pptx]}
        disabled={isUploading || isGrading}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: theme.colors.blue[6] }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: theme.colors.red[6] }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileText
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Kéo file vào đây hoặc nhấn để chọn file
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Hỗ trợ các file .docx, .pptx, dung lượng không quá 50MB
            </Text>
          </div>
        </Group>
      </Dropzone>

      {files.length > 0 && (
        <Stack>
          <Title order={4}>Các file đã chọn:</Title>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tên File</Table.Th>
                <Table.Th>Kích thước</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th>Hành động</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{fileRows}</Table.Tbody>
          </Table>
          <Select
            label="Chọn Rubric để chấm điểm"
            placeholder="Chọn rubric..."
            data={rubricOptions}
            value={selectedRubricId}
            onChange={setSelectedRubricId}
            disabled={isUploading || isGrading || isLoadingRubrics}
            mb="md"
          />
          <Group mt="md">
            <Button
              onClick={handleUpload}
              loading={isUploading}
              disabled={files.length === 0 || isGrading || pendingFilesCount === 0}
              size="lg"
            >
              Tải lên ({pendingFilesCount} file)
            </Button>
            <Button
              onClick={handleGradeAll}
              loading={isGrading}
              disabled={filesReadyToGrade === 0 || isUploading}
              size="lg"
              color="teal"
            >
              Chấm điểm ({filesReadyToGrade} file)
            </Button>
          </Group>
        </Stack>
      )}

      {gradedFiles.length > 0 && (
        <Stack>
          <Title order={3}>Kết quả chấm điểm</Title>
          {gradedFiles.map(([fileName, progress]) => 
            progress.gradeResult ? (
              <GradeResultDisplay
                key={fileName}
                gradeResult={progress.gradeResult}
              />
            ) : null
          )}
        </Stack>
      )}
    </Stack>
  );
}
