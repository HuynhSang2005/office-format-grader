/**
 * @file history.lazy.tsx
 * @description Grade history page component
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
  Pagination,
  Select,
  TextInput,
  ActionIcon,
  Flex,
  Checkbox,
  Tabs
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useQuery } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { 
  IconSearch,
  IconFilter,
  IconFileText,
  IconDownload,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconTrash
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useExportExcel } from '../../hooks/use-export-excel'
import { useUngradedFiles } from '../../hooks/use-ungraded-files'
import { useDeleteGradeResult } from '../../hooks/use-delete-grade-result'
import { apiClient } from '../../lib/api-client'
import { 
  GradeHistoryResponseSchema, 
  GradeHistoryQuerySchema,
  type GradeHistoryItem
} from '../../schemas/grade.schema'
import type { ExportRequest } from '../../schemas/export.schema'
import type { UngradedFile } from '../../schemas/ungraded.schema'

export const Route = createLazyFileRoute('/_auth/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [activePage, setActivePage] = useState(1)
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [scoreMin, setScoreMin] = useState<string>('')
  const [scoreMax, setScoreMax] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('graded')
  const [filtersChanged, setFiltersChanged] = useState(false)
  
  const limit = 10
  const offset = (activePage - 1) * limit

  // Export mutation
  const { mutate: exportExcel, isPending: isExporting } = useExportExcel({
    onSuccess: () => {
      // Reset selection after export
      setSelectedItems([])
    }
  })

  // Delete mutation
  const { mutate: deleteGradeResult, isPending: isDeleting } = useDeleteGradeResult({
    onSuccess: () => {
      // Reset selection after delete
      setSelectedItems([])
    }
  })

  // Fetch ungraded files
  const { data: ungradedData, isLoading: isUngradedLoading } = useUngradedFiles()

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date | null): string | undefined => {
    if (!date) return undefined
    return date.toISOString().split('T')[0]
  }

  // Reset to first page when filters change
  useEffect(() => {
    if (filtersChanged) {
      setActivePage(1)
      setFiltersChanged(false)
    }
  }, [filtersChanged])

  // Fetch history data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['grade-history', activePage, fileTypeFilter, searchQuery, dateFrom, dateTo, scoreMin, scoreMax],
    queryFn: async () => {
      // Build query parameters
      const queryParams: Record<string, string | number> = {
        limit,
        offset
      }

      // Add filters if they exist
      if (fileTypeFilter) queryParams.fileType = fileTypeFilter
      if (searchQuery) queryParams.search = searchQuery
      if (dateFrom) queryParams.dateFrom = formatDate(dateFrom) || ''
      if (dateTo) queryParams.dateTo = formatDate(dateTo) || ''
      if (scoreMin) queryParams.scoreMin = parseFloat(scoreMin)
      if (scoreMax) queryParams.scoreMax = parseFloat(scoreMax)

      // Validate query parameters with Zod
      const validatedQuery = GradeHistoryQuerySchema.parse({
        limit,
        offset,
        fileType: fileTypeFilter || undefined,
        search: searchQuery || undefined,
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
        scoreMin: scoreMin ? parseFloat(scoreMin) : undefined,
        scoreMax: scoreMax ? parseFloat(scoreMax) : undefined
      })

      // Make API request
      const response = await apiClient.get('/api/grade/history', {
        params: validatedQuery
      })

      // Check if response is successful
      if (!response.data.success) {
        throw new Error(response.data.message || 'Có lỗi xảy ra khi tải dữ liệu')
      }

      // Validate response with Zod
      const validatedResponse = GradeHistoryResponseSchema.parse(response.data)
      
      return validatedResponse.data
    },
    placeholderData: (previousData) => previousData
  })

  const historyData = data?.results || []
  const total = data?.total || 0

  const handleViewResult = (id: string) => {
    window.location.href = `/grade/${id}`
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn ít nhất một kết quả để export',
        color: 'red',
      })
      return
    }
    
    exportExcel({
      resultIds: selectedItems,
      includeDetails: true,
      groupBy: 'none',
      format: 'xlsx'
    } as ExportRequest)
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn ít nhất một kết quả để xóa',
        color: 'red',
      })
      return
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} kết quả đã chọn?`)) {
      // Delete each selected item
      selectedItems.forEach(id => {
        deleteGradeResult(id)
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(historyData.map((item: GradeHistoryItem) => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    }
  }

  const isAllSelected = historyData.length > 0 && selectedItems.length === historyData.length

  // Apply filters function
  const applyFilters = () => {
    setFiltersChanged(true)
    // Refetch data with new filters
    refetch()
  }

  if (isLoading || isUngradedLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton height={28} width={200} mb={10} />
        <Skeleton height={20} width={300} mb="xl" />
        
        <Card withBorder p="lg" radius="md" mb="xl">
          <Skeleton height={400} />
        </Card>
        
        <Flex justify="center">
          <Skeleton height={36} width={200} />
        </Flex>
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
          Không thể tải lịch sử chấm điểm. Vui lòng thử lại sau.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Flex justify="space-between" align="center" mb="xl">
        <Title order={2}>Lịch sử chấm điểm</Title>
        <Text size="sm" c="dimmed">
          Tổng cộng {total} kết quả đã chấm
        </Text>
      </Flex>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="graded">Đã chấm điểm</Tabs.Tab>
          <Tabs.Tab value="ungraded">Chưa chấm điểm</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="graded" pt="xs">
          {/* Filters */}
          <Card withBorder p="lg" radius="md" mb="xl">
            <Flex gap="md" wrap="wrap">
              <TextInput
                placeholder="Tìm kiếm theo tên file"
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: 200 }}
              />
              
              <Select
                placeholder="Loại file"
                leftSection={<IconFilter size={16} />}
                data={[
                  { value: 'PPTX', label: 'PowerPoint (.pptx)' },
                  { value: 'DOCX', label: 'Word (.docx)' }
                ]}
                value={fileTypeFilter}
                onChange={setFileTypeFilter}
                clearable
                style={{ minWidth: 200 }}
              />
              
              <DatePickerInput
                placeholder="Từ ngày"
                leftSection={<IconCalendar size={16} />}
                value={dateFrom}
                onChange={(value) => setDateFrom(value as Date | null)}
                clearable
                style={{ minWidth: 150 }}
              />
              
              <DatePickerInput
                placeholder="Đến ngày"
                leftSection={<IconCalendar size={16} />}
                value={dateTo}
                onChange={(value) => setDateTo(value as Date | null)}
                clearable
                style={{ minWidth: 150 }}
              />
              
              <TextInput
                placeholder="Điểm từ"
                type="number"
                min={0}
                max={10}
                value={scoreMin}
                onChange={(e) => setScoreMin(e.target.value)}
                style={{ minWidth: 100 }}
              />
              
              <TextInput
                placeholder="Đến"
                type="number"
                min={0}
                max={10}
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                style={{ minWidth: 100 }}
              />
              
              <Button
                leftSection={<IconSearch size={16} />}
                onClick={applyFilters}
              >
                Áp dụng
              </Button>
            </Flex>
          </Card>

          {/* Action Bar */}
          {selectedItems.length > 0 && (
            <Card withBorder p="md" radius="md" mb="xl">
              <Flex justify="space-between" align="center">
                <Text size="sm">
                  Đã chọn {selectedItems.length} kết quả
                </Text>
                <Group>
                  <Button
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExportSelected}
                    loading={isExporting}
                    variant="outline"
                  >
                    Export đã chọn
                  </Button>
                  <Button
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteSelected}
                    loading={isDeleting}
                    color="red"
                  >
                    Xóa đã chọn
                  </Button>
                </Group>
              </Flex>
            </Card>
          )}

          {/* History Table */}
          <Card withBorder p="lg" radius="md" mb="xl">
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '40px' }}>
                      <Checkbox
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                        aria-label="Chọn tất cả"
                      />
                    </Table.Th>
                    <Table.Th>Tên file</Table.Th>
                    <Table.Th>Loại</Table.Th>
                    <Table.Th>Điểm</Table.Th>
                    <Table.Th>Thời gian</Table.Th>
                    <Table.Th>Hành động</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {historyData.map((item: GradeHistoryItem) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => handleSelectItem(item.id, e.currentTarget.checked)}
                          aria-label={`Chọn ${item.filename}`}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group align="center" gap="sm">
                          <IconFileText size={16} color="var(--mantine-color-blue-6)" />
                          <Text fw={500}>{item.filename}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={item.fileType === 'PPTX' ? 'blue' : 'green'} 
                          variant="light"
                        >
                          {item.fileType}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{item.totalPoints}/10</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(item.gradedAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleViewResult(item.id)}
                          >
                            Xem chi tiết
                          </Button>
                          <ActionIcon
                            variant="outline"
                            onClick={() => {
                              // Export single item
                              exportExcel({
                                resultIds: [item.id],
                                includeDetails: true,
                                groupBy: 'none',
                                format: 'xlsx'
                              } as ExportRequest)
                            }}
                            loading={isExporting}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="outline"
                            color="red"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa kết quả này?`)) {
                                deleteGradeResult(item.id)
                              }
                            }}
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

          {/* Pagination */}
          <Flex justify="center">
            <Pagination
              total={Math.ceil(total / limit)}
              value={activePage}
              onChange={setActivePage}
              withControls
              siblings={1}
              boundaries={1}
            />
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="ungraded" pt="xs">
          {/* Ungraded Files Table */}
          <Card withBorder p="lg" radius="md">
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tên file</Table.Th>
                    <Table.Th>Loại</Table.Th>
                    <Table.Th>Kích thước</Table.Th>
                    <Table.Th>Thời gian</Table.Th>
                    <Table.Th>Hành động</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ungradedData && ungradedData.files && ungradedData.files.length > 0 ? (
                    ungradedData.files.map((file: UngradedFile) => (
                      <Table.Tr key={file.id}>
                        <Table.Td>
                          <Group align="center" gap="sm">
                            <IconClock size={16} color="var(--mantine-color-yellow-6)" />
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
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/ungraded`
                            }}
                          >
                            Chấm điểm
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} ta="center">
                        <Text c="dimmed">Không có file nào chưa chấm điểm</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}