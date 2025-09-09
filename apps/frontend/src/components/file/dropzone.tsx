/**
 * @file dropzone.tsx
 * @description File dropzone component with preview and remove functionality
 * @author Nguyễn Huỳnh Sang
 */

import { 
  Group, 
  Text, 
  Box, 
  Stack, 
  ActionIcon, 
  Card
} from '@mantine/core'
import { IconUpload, IconX, IconFile } from '@tabler/icons-react'
import { useDropzone } from 'react-dropzone'
import type { Accept } from 'react-dropzone'

interface FileDropzoneProps {
  onDrop: (files: File[]) => void
  onRemove: (index?: number) => void
  onRemoveAll: () => void
  uploadedFiles: File[]
  accept?: string[]
  multiple?: boolean
  maxFiles?: number
  mb?: string | number
}

export function FileDropzone({ 
  onDrop, 
  onRemove, 
  onRemoveAll,
  uploadedFiles, 
  accept = [],
  multiple = true,
  maxFiles = 0,
  mb = 0
}: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.length > 0 ? accept.reduce((acc, ext) => {
      acc[ext] = [];
      return acc;
    }, {} as Accept) : undefined,
    multiple,
    maxFiles
  })

  return (
    <Box mb={mb}>
      {uploadedFiles.length === 0 ? (
        <Box
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? '#228be6' : '#e9ecef'}`,
            borderRadius: '4px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f8f9fa' : '#ffffff'
          }}
        >
          <input {...getInputProps()} />
          <IconUpload 
            size={48} 
            color="#adb5bd" 
            stroke={1.5} 
            style={{ margin: '0 auto 16px' }} 
          />
          <Text size="lg" fw={500} c="dimmed" mb="xs">
            Kéo thả file vào đây hoặc click để chọn
          </Text>
          <Text size="sm" c="dimmed">
            Hỗ trợ các định dạng: {accept.length > 0 ? accept.join(', ') : 'Tất cả'}
          </Text>
        </Box>
      ) : (
        <Stack gap="xs" p="md">
          {uploadedFiles.map((file, index) => (
            <Group key={`${file.name}-${file.size}-${file.lastModified}`} justify="space-between" align="center">
              <Box>
                <Group>
                  <IconFile size={20} color="#228be6" />
                  <Box>
                    <Text size="sm" fw={500}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </Box>
                </Group>
              </Box>
              <ActionIcon 
                variant="light" 
                color="red" 
                onClick={() => onRemove(index)}
                aria-label="Remove file"
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          ))}
          
          <Card withBorder p="sm" radius="sm">
            <Group justify="space-between">
              <Text size="sm">
                Tổng cộng: {uploadedFiles.length} file
              </Text>
              <ActionIcon 
                variant="light" 
                color="red" 
                onClick={onRemoveAll}
                aria-label="Remove all files"
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Card>
        </Stack>
      )}
    </Box>
  )
}