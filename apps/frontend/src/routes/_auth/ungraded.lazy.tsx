/**
 * @file ungraded.lazy.tsx
 * @description Ungraded files page component
 * @author Nguyễn Huỳnh Sang
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Badge,
  Group,
  Table,
  Button,
  Alert,
  Skeleton,
  ActionIcon,
  Checkbox,
  Divider
} from '@mantine/core'
import { 
  IconFileText,
  IconTrash,
  IconPlayerPlay,
  IconAlertCircle
} from '@tabler/icons-react'
import { useUngradedFiles, useDeleteUngradedFile } from '../../hooks/use-ungraded-files'
import { useGradeFile } from '../../hooks/use-grade-file'
import { useBatchGrade } from '../../hooks/use-batch-grade'
import type { UngradedFile } from '../../schemas/ungraded.schema'
import { useState, useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

export const Route = createLazyFileRoute('/_auth/ungraded')({
  component: UngradedPage,
})

function UngradedPage() {
  const { data: ungradedFilesData, isLoading, error } = useUngradedFiles()
  const ungradedFiles = ungradedFilesData?.files || []
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteUngradedFile()
  const queryClient = useQueryClient()

  const { mutate: gradeFile } = useGradeFile({
    onSuccess: () => {
      // Invalidate the ungraded files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] })
      notifications.show({
        title: 'Thành công',
        message: 'Bắt đầu chấm điểm file',
        color: 'green'
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi chấm điểm',
        color: 'red'
      })
    }
  })
  const { mutate: batchGrade, isPending: isBatchGrading } = useBatchGrade()
  
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  // Update isAllSelected when ungradedFiles changes
  useEffect(() => {
    if (ungradedFiles && ungradedFiles.length > 0) {
      setIsAllSelected(selectedFiles.size === ungradedFiles.length)
    } else {
      setIsAllSelected(false)
      setSelectedFiles(new Set())
    }
  }, [selectedFiles.size, ungradedFiles])

  const handleDelete = (fileId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa file này?')) {
      deleteFile(fileId)
      // Remove from selected files if it was selected
      if (selectedFiles.has(fileId)) {
        const newSelected = new Set(selectedFiles)
        newSelected.delete(fileId)
        setSelectedFiles(newSelected)
      }
    }
  }

  const handleGrade = (fileId: string) => {
    gradeFile({
      fileId: fileId
    })
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(fileId)
    } else {
      newSelected.delete(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && ungradedFiles) {
      setSelectedFiles(new Set(ungradedFiles.map(file => file.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const handleGradeSelected = () => {
    if (selectedFiles.size === 0) return;
    
    if (selectedFiles.size === 1) {
      // Grade single file using the existing endpoint
      const fileId = Array.from(selectedFiles)[0];
      handleGrade(fileId);
    } else {
      // Grade multiple files using batch endpoint
      batchGrade({
        files: Array.from(selectedFiles)
      });
    }
  }

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton height={28} width={200} mb={10} />
        <Skeleton height={20} width={300} mb="xl" />
        
        <Card withBorder p="lg" radius="md" mb="xl">
          <Skeleton height={400} />
        </Card>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Có lỗi xảy ra" 
          color="red"
        >
          Không thể tải danh sách file chưa chấm điểm. Vui lòng thử lại sau.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">File chưa chấm điểm</Title>
      
      {ungradedFiles && ungradedFiles.length === 0 ? (
        <Card withBorder p="xl" radius="md">
          <Text ta="center" c="dimmed">
            Không có file nào chưa chấm điểm
          </Text>
        </Card>
      ) : (
        <Card withBorder p="lg" radius="md">
          {ungradedFiles && ungradedFiles.length > 0 && (
            <>
              <Group justify="space-between" mb="md">
                <Checkbox
                  label="Chọn tất cả"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={handleGradeSelected}
                  disabled={selectedFiles.size === 0}
                  loading={isBatchGrading}
                >
                  Chấm điểm ({selectedFiles.size})
                </Button>
              </Group>
              <Divider mb="md" />
            </>
          )}
          
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '50px' }}></Table.Th>
                  <Table.Th>Tên file</Table.Th>
                  <Table.Th>Loại</Table.Th>
                  <Table.Th>Kích thước</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                  <Table.Th>Hành động</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ungradedFiles?.map((file: UngradedFile) => (
                  <Table.Tr key={file.id}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onChange={(e) => handleSelectFile(file.id, e.currentTarget.checked)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group align="center" gap="sm">
                        <IconFileText size={16} color="var(--mantine-color-blue-6)" />
                        <Text fw={500}>{file.filename}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={file.fileType === 'PPTX' ? 'blue' : 'green'} 
                        variant="light"
                      >
                        {file.fileType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(file.uploadedAt).toLocaleString('vi-VN')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          leftSection={<IconPlayerPlay size={16} />}
                          onClick={() => handleGrade(file.id)}
                        >
                          Chấm điểm
                        </Button>
                        <ActionIcon
                          variant="outline"
                          color="red"
                          onClick={() => handleDelete(file.id)}
                          loading={isDeleting}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}
    </Container>
  )
}