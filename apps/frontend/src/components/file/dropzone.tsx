/**
 * @file dropzone.tsx
 * @description File dropzone component with drag & drop functionality
 * @author Your Name
 */

import { 
  Dropzone as MantineDropzone, 
  type DropzoneProps as MantineDropzoneProps,
} from '@mantine/dropzone';
import { 
  Text, 
  Group, 
  rem, 
  Badge,
  Box,
  ActionIcon,
  Stack
} from '@mantine/core';
import { IconUpload, IconX, IconCheck } from '@tabler/icons-react';
import { useState, useRef } from 'react';

interface FileDropzoneProps extends Omit<MantineDropzoneProps, 'onDrop'> {
  onDrop: (files: File[]) => void;
  onRemove?: (index: number) => void;
  uploadedFiles?: File[];
  accept?: string[];
  multiple?: boolean;
}

export function FileDropzone({
  onDrop,
  onRemove,
  uploadedFiles = [],
  accept = ['.pptx', '.docx', '.zip'],
  maxSize = 52428800, // 50MB in bytes
  multiple = false,
  ...props
}: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>(uploadedFiles);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleDrop = (droppedFiles: File[]) => {
    if (multiple) {
      // For multiple file uploads, add new files to existing ones
      const newFiles = [...files, ...droppedFiles];
      setFiles(newFiles);
      onDrop(newFiles);
    } else {
      // For single file upload, replace existing file
      if (droppedFiles.length > 0) {
        const droppedFile = droppedFiles[0];
        setFiles([droppedFile]);
        onDrop([droppedFile]);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  // Create accept object without using spread in reduce
  const acceptObject: Record<string, string[]> = {};
  accept.forEach(ext => {
    acceptObject[ext] = [];
  });

  return (
    <MantineDropzone
      ref={dropzoneRef}
      onDrop={handleDrop}
      maxSize={maxSize}
      accept={acceptObject}
      multiple={multiple}
      {...props}
    >
      {files.length > 0 ? (
        <Stack gap="xs" p="md">
          {files.map((file, index) => (
            <Group key={index} justify="space-between" align="center">
              <Box>
                <Text size="sm" fw={500}>
                  {file.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(file.size)}
                </Text>
              </Box>
              <Group gap="xs">
                <Badge 
                  leftSection={<IconCheck size={14} />} 
                  color="green"
                  variant="light"
                >
                  Ready
                </Badge>
                {onRemove && (
                  <ActionIcon 
                    variant="outline" 
                    color="red" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFiles = files.filter((_, i) => i !== index);
                      setFiles(newFiles);
                      onRemove(index);
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )}
              </Group>
            </Group>
          ))}
        </Stack>
      ) : (
        <Group justify="center" align="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
          <MantineDropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
              stroke={1.5}
            />
          </MantineDropzone.Accept>
          <MantineDropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
              stroke={1.5}
            />
          </MantineDropzone.Reject>
          <MantineDropzone.Idle>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
              stroke={1.5}
            />
          </MantineDropzone.Idle>

          <div>
            <Text size="xl" inline>
              Kéo file vào đây hoặc click để chọn file
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Chấp nhận file: {accept.join(', ')} với dung lượng tối đa 50MB
            </Text>
            {multiple && (
              <Text size="sm" c="dimmed" inline mt={7}>
                Bạn có thể chọn nhiều file cùng lúc
              </Text>
            )}
          </div>
        </Group>
      )}
    </MantineDropzone>
  );
}