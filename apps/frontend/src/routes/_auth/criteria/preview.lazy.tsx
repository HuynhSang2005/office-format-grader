/**
 * @file preview.lazy.tsx
 * @description Criteria preview page component
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Alert,
  Button,
  TextInput,
  Select,
  Box,
  Progress
} from '@mantine/core'
import { IconAlertCircle, IconEye } from '@tabler/icons-react'
import { useState } from 'react'
import { usePreviewCriteria } from '../../../hooks/use-criteria'
import { FileDropzone } from '../../../components/file/dropzone'
import type { PreviewCriteriaResponse } from '../../../schemas/criteria.schema'

export const Route = createLazyFileRoute('/_auth/criteria/preview')({
  component: CriteriaPreviewPage,
})

function CriteriaPreviewPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('PPTX')
  const [rubricName, setRubricName] = useState('')
  const { mutate: previewCriteria, data, isPending, error } = usePreviewCriteria()

  const handleDrop = (droppedFile: File) => {
    setFile(droppedFile)
  }

  const handleRemove = () => {
    setFile(null)
  }

  const handlePreview = () => {
    if (file) {
      previewCriteria({
        file,
        fileType: fileType as 'PPTX' | 'DOCX',
        rubricName
      })
    }
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Xem trước tiêu chí chấm điểm</Title>
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="md">Chọn file để xem trước</Title>
        
        <FileDropzone
          onDrop={handleDrop}
          onRemove={handleRemove}
          uploadedFile={file}
          accept={['.pptx', '.docx']}
          mb="xl"
        />
        
        <Select
          label="Loại file"
          placeholder="Chọn loại file"
          data={[
            { value: 'PPTX', label: 'PowerPoint (.pptx)' },
            { value: 'DOCX', label: 'Word (.docx)' }
          ]}
          value={fileType}
          onChange={(value) => setFileType(value || 'PPTX')}
          mb="xl"
        />
        
        <TextInput
          label="Tên rubric (tùy chọn)"
          placeholder="Nhập tên rubric"
          value={rubricName}
          onChange={(e) => setRubricName(e.target.value)}
          mb="xl"
        />
        
        <Group justify="center">
          <Button
            leftSection={<IconEye size={16} />}
            onClick={handlePreview}
            disabled={!file || isPending}
            loading={isPending}
          >
            Xem trước tiêu chí
          </Button>
        </Group>
      </Card>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Có lỗi xảy ra" 
          color="red"
          mb="xl"
        >
          {error instanceof Error ? error.message : 'Không thể xem trước tiêu chí chấm điểm'}
        </Alert>
      )}
      
      {data && (
        <Card withBorder p="lg" radius="md" mb="xl">
          <Title order={3} mb="md">Kết quả xem trước</Title>
          
          <Box mb="xl">
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Thống kê</Text>
              <Text c="dimmed">{data.statistics.percentage}%</Text>
            </Group>
            <Progress 
              value={parseFloat(data.statistics.percentage)} 
              color={parseFloat(data.statistics.percentage) > 70 ? 'green' : parseFloat(data.statistics.percentage) > 40 ? 'yellow' : 'red'}
              size="md" 
              radius="xl"
            />
            
            <Group mt="md">
              <Box>
                <Text size="sm">Tiêu chí đạt: {data.statistics.passedCriteria}/{data.statistics.totalCriteria}</Text>
              </Box>
              <Box>
                <Text size="sm">Điểm: {data.statistics.totalPoints}/{data.statistics.maxPossiblePoints}</Text>
              </Box>
            </Group>
          </Box>
          
          {Object.keys(data.results).length > 0 ? (
            <Box>
              <Text mb="sm">Chi tiết các tiêu chí:</Text>
              {Object.entries(data.results).map(([criterionId, result]) => {
                const typedResult = result as PreviewCriteriaResponse['data']['results'][string];
                return (
                  <Card key={criterionId} withBorder p="md" radius="sm" mb="sm">
                    <Group justify="space-between">
                      <Text fw={500}>{criterionId}</Text>
                      <Text size="sm" c={typedResult.passed ? 'green' : 'red'}>
                        {typedResult.points} điểm
                      </Text>
                    </Group>
                    <Text size="sm" mt="xs">{typedResult.reason}</Text>
                  </Card>
                );
              })}

            </Box>
          ) : (
            <Text c="dimmed">Không tìm thấy tiêu chí phù hợp cho file này</Text>
          )}
        </Card>
      )}
      
      <Card withBorder p="lg" radius="md" mt="md">
        <Title order={3} mb="sm">Hướng dẫn</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Chức năng này giúp:</Text> Xem trước các tiêu chí chấm điểm có thể áp dụng cho file của bạn
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Loại file hỗ trợ:</Text> .pptx, .docx
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Kết quả:</Text> Hiển thị danh sách tiêu chí phù hợp với nội dung file
        </Text>
      </Card>
    </Container>
  )
}