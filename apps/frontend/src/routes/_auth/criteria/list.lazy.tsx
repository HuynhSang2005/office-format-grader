/**
 * @file list.lazy.tsx
 * @description Criteria list page component
 * @author Your Name
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Select,
  TextInput,
  Button,
  Box,
  Badge,
  Accordion,
  Alert,
  Skeleton
} from '@mantine/core'
import { IconAlertCircle, IconSearch, IconFilter } from '@tabler/icons-react'
import { useState } from 'react'
import { useListCriteria } from '../../../hooks/use-criteria'
import type { Criterion } from '../../../schemas/criteria.schema'

export const Route = createLazyFileRoute('/_auth/criteria/list')({
  component: CriteriaListPage,
})

function CriteriaListPage() {
  const [source, setSource] = useState<'preset' | 'custom' | ''>('')
  const [fileType, setFileType] = useState<'PPTX' | 'DOCX' | ''>('')
  const [rubricName, setRubricName] = useState('')
  const navigate = useNavigate()
  
  // Build query params
  const queryParams = {
    ...(source && { source }),
    ...(fileType && { fileType }),
    ...(rubricName && { rubricName })
  }
  
  const { data: criteria, isLoading, error } = useListCriteria(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  )

  const handleSearch = () => {
    // The query will automatically refetch when queryParams change
  }

  const handleReset = () => {
    setSource('')
    setFileType('')
    setRubricName('')
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Danh sách tiêu chí chấm điểm</Title>
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="md">Bộ lọc</Title>
        
        <Group mb="md">
          <Select
            label="Nguồn"
            placeholder="Chọn nguồn"
            data={[
              { value: 'preset', label: 'Preset' },
              { value: 'custom', label: 'Custom' }
            ]}
            value={source}
            onChange={(value) => setSource(value as 'preset' | 'custom' | '')}
            style={{ flex: 1 }}
          />
          
          <Select
            label="Loại file"
            placeholder="Chọn loại file"
            data={[
              { value: 'PPTX', label: 'PowerPoint (.pptx)' },
              { value: 'DOCX', label: 'Word (.docx)' }
            ]}
            value={fileType}
            onChange={(value) => setFileType(value as 'PPTX' | 'DOCX' | '')}
            style={{ flex: 1 }}
          />
          
          <TextInput
            label="Tên rubric"
            placeholder="Nhập tên rubric"
            value={rubricName}
            onChange={(e) => setRubricName(e.target.value)}
            style={{ flex: 1 }}
          />
        </Group>
        
        <Group justify="flex-end">
          <Button variant="default" onClick={handleReset}>
            Đặt lại
          </Button>
          <Button 
            leftSection={<IconSearch size={16} />}
            onClick={handleSearch}
          >
            Tìm kiếm
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
          {error instanceof Error ? error.message : 'Không thể tải danh sách tiêu chí'}
        </Alert>
      )}
      
      {isLoading ? (
        <Card withBorder p="lg" radius="md">
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} width="70%" />
        </Card>
      ) : criteria && criteria.length > 0 ? (
        <Card withBorder p="lg" radius="md">
          <Text mb="md">Tìm thấy {criteria.length} tiêu chí</Text>
          
          <Accordion variant="contained">
            {criteria.map((criterion: Criterion) => (
              <Accordion.Item key={criterion.id} value={criterion.id}>
                <Accordion.Control>
                  <Group justify="space-between">
                    <Text fw={500}>{criterion.name}</Text>
                    <Badge color="blue" variant="light">
                      {criterion.detectorKey}
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box>
                    <Text size="sm" mb="sm">
                      {criterion.description}
                    </Text>
                    
                    {criterion.maxPoints !== undefined && (
                      <Text size="sm" mb="sm">
                        <Text component="span" fw={500}>Điểm tối đa:</Text> {criterion.maxPoints}
                      </Text>
                    )}
                    
                    {criterion.levels && criterion.levels.length > 0 && (
                      <Box mb="sm">
                        <Text fw={500} mb="xs">Các mức điểm:</Text>
                        {criterion.levels.map((level, index) => (
                          <Card key={index} withBorder p="sm" radius="sm" mb="xs">
                            <Group justify="space-between">
                              <Text fw={500}>{level.name}</Text>
                              <Badge color={level.points > 0 ? 'green' : 'red'}>
                                {level.points} điểm
                              </Badge>
                            </Group>
                            <Text size="sm" mt="xs">
                              {level.description}
                            </Text>
                          </Card>
                        ))}
                      </Box>
                    )}
                    
                    <Button
                      variant="light"
                      onClick={() => navigate({ to: '/criteria/$criterionId', params: { criterionId: criterion.id } })}
                    >
                      Xem chi tiết
                    </Button>
                  </Box>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card>
      ) : (
        <Card withBorder p="xl" radius="md" ta="center">
          <IconFilter size={32} color="var(--mantine-color-gray-6)" />
          <Text c="dimmed" mt="md">
            {Object.keys(queryParams).length > 0 
              ? 'Không tìm thấy tiêu chí nào phù hợp với bộ lọc' 
              : 'Chọn bộ lọc để xem danh sách tiêu chí'}
          </Text>
        </Card>
      )}
    </Container>
  )
}