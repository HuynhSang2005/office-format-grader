/**
 * @file list.lazy.tsx
 * @description Criteria list page component
 * @author Nguyễn Huỳnh Sang
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  TextInput,
  Button,
  Box,
  Badge,
  Alert,
  Skeleton,
  Tabs,
  Modal,
  Select,
  Checkbox,
  ActionIcon
} from '@mantine/core'
import { 
  IconAlertCircle, 
  IconSearch, 
  IconPlus, 
  IconList, 
  IconEdit, 
  IconTrash,
  IconEye,
  IconX,
  IconSelectAll
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useListCriteria, useDeleteCriterion } from '../../../hooks/use-criteria'
import { useRubricStore } from '../../../stores/rubric.store'
import type { Criterion } from '../../../schemas/criteria.schema'

export const Route = createLazyFileRoute('/_auth/criteria/list')({
  component: CriteriaListPage,
})

function CriteriaListPage() {
  const [source, setSource] = useState<'preset' | 'custom' | ''>('')
  const [fileType, setFileType] = useState<'PPTX' | 'DOCX' | ''>('')
  const [rubricName, setRubricName] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>('view')
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [criterionToDelete, setCriterionToDelete] = useState<Criterion | null>(null)
  const navigate = useNavigate()
  
  const { listRubrics } = useRubricStore()
  
  // Load custom rubrics on component mount
  useEffect(() => {
    listRubrics({ ownerId: 1 }) // Use a default ownerId for now
  }, [listRubrics])
  
  // Build query params - only include fileType when source is 'preset'
  const queryParams = {
    ...(source && { source }),
    ...((source === 'preset' || source === 'custom') && fileType && { fileType }),
    ...(rubricName && { rubricName })
  }
  
  // Enable the query when we have the required parameters or when showing all criteria
  const shouldEnableQuery = source === '' || source === 'custom' || (source === 'preset' && fileType)
  
  const { data: criteria, isLoading, error } = useListCriteria(
    shouldEnableQuery ? queryParams : undefined
  )
  
  const { mutate: deleteCriterion } = useDeleteCriterion()

  const handleSearch = () => {
    // The query will automatically refetch when queryParams change
  }

  const handleReset = () => {
    setSource('')
    setFileType('')
    setRubricName('')
    setSelectedCriteria([])
  }
  
  const handleDeleteCriterion = (criterion: Criterion) => {
    setCriterionToDelete(criterion)
    setDeleteModalOpened(true)
  }
  
  const confirmDeleteCriterion = () => {
    if (criterionToDelete) {
      deleteCriterion(criterionToDelete.id, {
        onSuccess: () => {
          setDeleteModalOpened(false)
          setCriterionToDelete(null)
          // Remove deleted criterion from selected list
          setSelectedCriteria(selectedCriteria.filter(id => id !== criterionToDelete.id))
        }
      })
    }
  }

  // Toggle selection of a single criterion
  const toggleCriterionSelection = (id: string) => {
    setSelectedCriteria(prev => 
      prev.includes(id) 
        ? prev.filter(criterionId => criterionId !== id) 
        : [...prev, id]
    )
  }

  // Toggle selection of all criteria
  const toggleSelectAll = () => {
    if (criteria && selectedCriteria.length === criteria.length) {
      // If all are selected, deselect all
      setSelectedCriteria([])
    } else if (criteria) {
      // If not all are selected, select all
      setSelectedCriteria(criteria.map(criterion => criterion.id))
    }
  }

  // Handle batch delete
  const handleBatchDelete = () => {
    // For now, we'll just show a confirmation for the first selected criterion
    // In a real implementation, you might want to handle batch deletion differently
    if (selectedCriteria.length > 0 && criteria) {
      const firstSelected = criteria.find(c => c.id === selectedCriteria[0])
      if (firstSelected) {
        setCriterionToDelete(firstSelected)
        setDeleteModalOpened(true)
      }
    }
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Quản lý tiêu chí chấm điểm</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate({ to: '/criteria/create' })}
        >
          Tạo tiêu chí mới
        </Button>
      </Group>
      
      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="view" leftSection={<IconList size={14} />}>
            Xem tiêu chí
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="view" pt="xs">
          <Card withBorder p="lg" radius="md" mb="xl">
            <Title order={3} mb="md">Bộ lọc</Title>
            
            <Group mb="md">
              <Select
                label="Nguồn"
                placeholder="Chọn nguồn"
                value={source}
                onChange={(value) => {
                  setSource(value as 'preset' | 'custom' | '')
                  setSelectedCriteria([])
                }}
                data={[
                  { value: '', label: 'Tất cả' },
                  { value: 'preset', label: 'Preset' },
                  { value: 'custom', label: 'Custom' }
                ]}
                style={{ flex: 1 }}
              />
              
              <Select
                label="Loại file"
                placeholder="Chọn loại file"
                value={fileType}
                onChange={(value) => {
                  setFileType(value as 'PPTX' | 'DOCX' | '')
                  setSelectedCriteria([])
                }}
                data={[
                  { value: '', label: 'Tất cả' },
                  { value: 'PPTX', label: 'PowerPoint (.pptx)' },
                  { value: 'DOCX', label: 'Word (.docx)' }
                ]}
                style={{ flex: 1 }}
                disabled={!source}
                required={source === 'preset'}
              />
              
              <TextInput
                label="Tên rubric"
                placeholder="Nhập tên rubric"
                value={rubricName}
                onChange={(e) => {
                  setRubricName(e.target.value)
                  setSelectedCriteria([])
                }}
                style={{ flex: 1 }}
                disabled={source !== 'preset'}
              />
            </Group>
            
            <Group justify="flex-end">
              <Button variant="default" onClick={handleReset}>
                Đặt lại
              </Button>
              <Button 
                leftSection={<IconSearch size={16} />}
                onClick={handleSearch}
                disabled={source === 'preset' && !fileType}
              >
                Tìm kiếm
              </Button>
            </Group>
          </Card>
          
          {source === 'preset' && !fileType && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              title="Cần chọn loại file" 
              color="yellow"
              mb="xl"
            >
              Vui lòng chọn loại file (PPTX hoặc DOCX) khi xem tiêu chí preset.
            </Alert>
          )}
          
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
              <Group justify="space-between" mb="md">
                <Text>Tìm thấy {criteria.length} tiêu chí</Text>
                <Group>
                  {selectedCriteria.length > 0 && (
                    <Text size="sm" c="blue">
                      {selectedCriteria.length} tiêu chí đã chọn
                    </Text>
                  )}
                  <ActionIcon
                    variant="subtle"
                    color={selectedCriteria.length === criteria.length && criteria.length > 0 ? "blue" : "gray"}
                    onClick={toggleSelectAll}
                    title={selectedCriteria.length === criteria.length && criteria.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  >
                    {selectedCriteria.length === criteria.length && criteria.length > 0 ? (
                      <IconSelectAll size={16} />
                    ) : (
                      <IconSelectAll size={16} />
                    )}
                  </ActionIcon>
                  {selectedCriteria.length > 0 && (
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={14} />}
                      onClick={handleBatchDelete}
                    >
                      Xóa đã chọn
                    </Button>
                  )}
                </Group>
              </Group>
              
              <Box>
                {criteria.map((criterion: any) => (
                  <Card key={criterion.id} withBorder p="sm" mb="xs">
                    <Group justify="space-between">
                      <Group>
                        <Checkbox
                          checked={selectedCriteria.includes(criterion.id)}
                          onChange={() => toggleCriterionSelection(criterion.id)}
                          aria-label="Chọn tiêu chí"
                        />
                        <Text fw={500}>{criterion.name}</Text>
                      </Group>
                      <Group>
                        <Badge color="blue" variant="light">
                          {criterion.detectorKey}
                        </Badge>
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() => navigate({ to: '/criteria/$criterionId', params: { criterionId: criterion.id } })}
                          leftSection={<IconEye size={14} />}
                        >
                          Xem
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() => navigate({ to: '/criteria/edit/$criterionId', params: { criterionId: criterion.id } })}
                          leftSection={<IconEdit size={14} />}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteCriterion(criterion)}
                          leftSection={<IconTrash size={14} />}
                        >
                          Xóa
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Box>
            </Card>
          ) : shouldEnableQuery && !isLoading ? (
            <Card withBorder p="xl" radius="md" ta="center">
              <IconSearch size={32} color="var(--mantine-color-gray-6)" />
              <Text c="dimmed" mt="md">
                Không tìm thấy tiêu chí nào phù hợp với bộ lọc
              </Text>
              
              <Button
                leftSection={<IconPlus size={16} />}
                mt="md"
                onClick={() => navigate({ to: '/criteria/create' })}
              >
                Tạo tiêu chí mới
              </Button>
            </Card>
          ) : (
            <Card withBorder p="xl" radius="md" ta="center">
              <IconSearch size={32} color="var(--mantine-color-gray-6)" />
              <Text c="dimmed" mt="md">
                {source === 'preset' && !fileType 
                  ? 'Chọn loại file để xem tiêu chí preset' 
                  : 'Chọn bộ lọc để xem danh sách tiêu chí'}
              </Text>
              
              <Button
                leftSection={<IconPlus size={16} />}
                mt="md"
                onClick={() => navigate({ to: '/criteria/create' })}
              >
                Tạo tiêu chí mới
              </Button>
            </Card>
          )}
        </Tabs.Panel>
      </Tabs>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Xác nhận xóa tiêu chí"
        centered
      >
        <Text size="sm" mb="md">
          Bạn có chắc chắn muốn xóa tiêu chí "{criterionToDelete?.name}" không? Hành động này không thể hoàn tác.
        </Text>
        
        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => setDeleteModalOpened(false)}
            leftSection={<IconX size={16} />}
          >
            Hủy
          </Button>
          <Button
            color="red"
            onClick={confirmDeleteCriterion}
          >
            Xóa
          </Button>
        </Group>
      </Modal>
    </Container>
  )
}