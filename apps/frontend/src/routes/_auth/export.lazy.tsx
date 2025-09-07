/**
 * @file export.lazy.tsx
 * @description Export grade results to Excel page
 * @author Your Name
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Container, 
  Group, 
  Alert,
  rem,
  Tabs,
  Table,
  Badge
} from '@mantine/core'
import { IconDownload, IconCheck, IconFileText, IconClock } from '@tabler/icons-react'
import { useState } from 'react'
import { useExportExcel } from '../../hooks/use-export-excel'
import { useGradeHistory } from '../../hooks/use-grade-history'
import { useUngradedFiles } from '../../hooks/use-ungraded-files'
import type { GradeHistoryItem } from '../../schemas/grade.schema'
import type { UngradedFile } from '../../schemas/ungraded.schema'

export const Route = createLazyFileRoute('/_auth/export')({
  component: ExportPage,
})

function ExportPage() {
  const [selectedGradedIds, setSelectedGradedIds] = useState<string[]>([])
  const [selectedUngradedIds, setSelectedUngradedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('graded')
  const navigate = useNavigate()
  
  const { mutate: exportResults, isPending } = useExportExcel({
    onSuccess: () => {
      // Show success message
      setSelectedGradedIds([])
      setSelectedUngradedIds([])
    }
  })
  
  // Fetch grade history to populate result options
  const { data: historyData, isLoading: isLoadingHistory } = useGradeHistory({
    limit: 100,
    offset: 0
  })

  // Fetch ungraded files
  const { data: ungradedData, isLoading: isLoadingUngraded } = useUngradedFiles()

  const handleExportGraded = () => {
    if (selectedGradedIds.length > 0) {
      exportResults({
        resultIds: selectedGradedIds,
        format: 'xlsx',
        includeDetails: true,
        groupBy: 'none'
      })
    }
  }

  const handleExportUngraded = () => {
    if (selectedUngradedIds.length > 0) {
      // For ungraded files, we need to grade them first
      alert('Vui lòng chấm điểm các file chưa chấm trước khi xuất.')
    }
  }

  // Format history data for display
  const gradedItems = historyData?.results || []

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Xuất điểm sang Excel</Title>
      
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="graded">Kết quả đã chấm</Tabs.Tab>
          <Tabs.Tab value="ungraded">File chưa chấm</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="graded" pt="xs">
          <Card withBorder shadow="sm" radius="md" p="xl" mb="xl">
            <Title order={3} mb="md">Chọn kết quả đã chấm để xuất</Title>
            
            {isLoadingHistory ? (
              <Text>Loading results...</Text>
            ) : (
              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '40px' }}></Table.Th>
                      <Table.Th>Tên file</Table.Th>
                      <Table.Th>Loại</Table.Th>
                      <Table.Th>Điểm</Table.Th>
                      <Table.Th>Thời gian</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {gradedItems.length > 0 ? (
                      gradedItems.map((item: GradeHistoryItem) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <input
                              type="checkbox"
                              checked={selectedGradedIds.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGradedIds(prev => [...prev, item.id])
                                } else {
                                  setSelectedGradedIds(prev => prev.filter(id => id !== item.id))
                                }
                              }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group align="center" gap="sm">
                              <IconFileText size={16} color="var(--mantine-color-blue-6)" />
                              <Text>{item.filename}</Text>
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
                              {new Date(item.gradedAt).toLocaleString('vi-VN')}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={5} ta="center">
                          <Text c="dimmed">Không có kết quả chấm điểm nào</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
            
            {selectedGradedIds.length > 0 && (
              <Alert 
                icon={<IconCheck size={16} />} 
                title="Đã chọn" 
                color="green" 
                mb="xl"
              >
                <Text size="sm">
                  Đã chọn {selectedGradedIds.length} kết quả để xuất
                </Text>
              </Alert>
            )}
            
            <Group justify="center">
              <Button
                onClick={handleExportGraded}
                disabled={selectedGradedIds.length === 0 || isPending}
                loading={isPending}
                size="md"
                leftSection={<IconDownload size={rem(16)} />}
              >
                {isPending ? 'Đang xử lý...' : 'Xuất sang Excel'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                size="md"
              >
                Quay lại trang chủ
              </Button>
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="ungraded" pt="xs">
          <Card withBorder shadow="sm" radius="md" p="xl" mb="xl">
            <Title order={3} mb="md">File chưa chấm điểm</Title>
            
            {isLoadingUngraded ? (
              <Text>Loading ungraded files...</Text>
            ) : (
              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '40px' }}></Table.Th>
                      <Table.Th>Tên file</Table.Th>
                      <Table.Th>Loại</Table.Th>
                      <Table.Th>Kích thước</Table.Th>
                      <Table.Th>Thời gian</Table.Th>
                      <Table.Th>Hành động</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ungradedData && ungradedData.length > 0 ? (
                      ungradedData.map((file: UngradedFile) => (
                        <Table.Tr key={file.id}>
                          <Table.Td>
                            <input
                              type="checkbox"
                              checked={selectedUngradedIds.includes(file.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUngradedIds(prev => [...prev, file.id])
                                } else {
                                  setSelectedUngradedIds(prev => prev.filter(id => id !== file.id))
                                }
                              }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group align="center" gap="sm">
                              <IconClock size={16} color="var(--mantine-color-yellow-6)" />
                              <Text>{file.filename}</Text>
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
                        <Table.Td colSpan={6} ta="center">
                          <Text c="dimmed">Không có file nào chưa chấm điểm</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
            
            {selectedUngradedIds.length > 0 && (
              <Alert 
                icon={<IconCheck size={16} />} 
                title="Đã chọn" 
                color="yellow" 
                mb="xl"
              >
                <Text size="sm">
                  Đã chọn {selectedUngradedIds.length} file chưa chấm. Vui lòng chấm điểm trước khi xuất.
                </Text>
              </Alert>
            )}
            
            <Group justify="center">
              <Button
                onClick={handleExportUngraded}
                disabled={selectedUngradedIds.length === 0 || isPending}
                loading={isPending}
                size="md"
                leftSection={<IconDownload size={rem(16)} />}
              >
                {isPending ? 'Đang xử lý...' : 'Xuất sang Excel'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                size="md"
              >
                Quay lại trang chủ
              </Button>
            </Group>
          </Card>
        </Tabs.Panel>
      </Tabs>
      
      <Card withBorder shadow="sm" radius="md" p="xl" mt="md">
        <Title order={3} mb="sm">Hướng dẫn xuất file</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Định dạng đầu vào:</Text> Chọn từ danh sách kết quả chấm điểm
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Định dạng đầu ra:</Text> File Excel (.xlsx)
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Cấu trúc file:</Text> Bao gồm tất cả thông tin điểm số, tiêu chí chấm và nhận xét
        </Text>
      </Card>
    </Container>
  )
}