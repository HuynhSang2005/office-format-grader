/**
 * @file custom-criteria-manager.tsx
 * @description Component for managing custom criteria through custom rubrics
 * @author Nguyễn Huỳnh Sang
 */

import { 
  Button, 
  Card, 
  Text, 
  Group, 
  ActionIcon, 
  Modal, 
  TextInput, 
  NumberInput, 
  Textarea,
  Box,
  Flex,
  Badge,
  Checkbox,
  Accordion,
  Select
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCheck,
  IconCopy,
  IconSettings
} from '@tabler/icons-react'
import { useState } from 'react'
import { useSupportedCriteria } from '../../hooks/use-criteria'
import type { Criterion, Level } from '../../schemas/criteria.schema'

// Define type for fixed criteria from the backend
interface FixedCriterion {
  id: string
  name: string
  detectorKey: string
  description?: string
  maxPoints?: number
  levels?: Array<{
    points: number
    code: string
    name: string
    description: string
  }>
}

interface CustomCriteriaManagerProps {
  criteria: Criterion[]
  onCriteriaChange: (criteria: Criterion[]) => void
  fileType?: 'PPTX' | 'DOCX'
}

export function CustomCriteriaManager({ criteria, onCriteriaChange, fileType: initialFileType }: CustomCriteriaManagerProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [fileType, setFileType] = useState<'PPTX' | 'DOCX' | ''>(initialFileType || '')
  const [name, setName] = useState('')
  const [detectorKey, setDetectorKey] = useState('')
  const [maxPoints, setMaxPoints] = useState(10)
  const [description, setDescription] = useState('')
  const [levels, setLevels] = useState<Level[]>([
    { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
    { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
    { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
  ])
  const [selectedFixedCriteria, setSelectedFixedCriteria] = useState<string[]>([])
  const [showFixedCriteria, setShowFixedCriteria] = useState(false)
  
  // Fetch fixed criteria based on file type
  const { data: fixedCriteria, isLoading: isLoadingFixedCriteria } = useSupportedCriteria(fileType || undefined)

  const resetForm = () => {
    // Don't reset fileType if it was provided as initial prop
    if (!initialFileType) {
      setFileType('')
    }
    setName('')
    setDetectorKey('')
    setMaxPoints(10)
    setDescription('')
    setLevels([
      { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
      { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
      { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
    ])
    setEditingCriterion(null)
  }

  const handleOpen = (criterion?: Criterion) => {
    if (criterion) {
      setEditingCriterion(criterion)
      setName(criterion.name)
      setDetectorKey(criterion.detectorKey)
      setMaxPoints(criterion.maxPoints || 10)
      setDescription(criterion.levels?.[0]?.description || '')
      setLevels(criterion.levels || [
        { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
        { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
        { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
      ])
    } else {
      resetForm()
    }
    open()
  }

  const handleClose = () => {
    resetForm()
    close()
  }

  const handleSave = () => {
    // Validate required fields
    if (!name.trim()) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng nhập tên tiêu chí (1-100 ký tự)',
        color: 'red'
      })
      return
    }

    if (name.length > 100) {
      notifications.show({
        title: 'Lỗi',
        message: 'Tên tiêu chí không được quá 100 ký tự',
        color: 'red'
      })
      return
    }

    if (!fileType) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn loại file (PPTX hoặc DOCX)',
        color: 'red'
      })
      return
    }

    if (!detectorKey.trim()) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn detector key',
        color: 'red'
      })
      return
    }

    // Validate maxPoints
    if (maxPoints < 0.25 || maxPoints > 10) {
      notifications.show({
        title: 'Lỗi',
        message: 'Điểm tối đa phải từ 0.25 đến 10',
        color: 'red'
      })
      return
    }

    // Validate levels
    if (levels.length < 2 || levels.length > 10) {
      notifications.show({
        title: 'Lỗi',
        message: 'Phải có từ 2 đến 10 mức điểm',
        color: 'red'
      })
      return
    }

    // Check if any level has points exceeding maxPoints
    const maxLevelPoints = Math.max(...levels.map(l => l.points));
    if (maxLevelPoints > maxPoints) {
      notifications.show({
        title: 'Lỗi',
        message: 'Points của level không được vượt quá điểm tối đa',
        color: 'red'
      })
      return
    }

    // Check if there's at least one level with 0 points
    const hasZeroPointLevel = levels.some(l => l.points === 0);
    if (!hasZeroPointLevel) {
      notifications.show({
        title: 'Lỗi',
        message: 'Phải có ít nhất 1 level với points = 0 (trường hợp không đạt)',
        color: 'red'
      })
      return
    }

    // Check if level codes are unique
    const codes = levels.map(l => l.code);
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      notifications.show({
        title: 'Lỗi',
        message: 'Level codes phải là duy nhất',
        color: 'red'
      })
      return
    }

    const newCriterion: Criterion = {
      id: editingCriterion?.id || `criterion-${Date.now()}`,
      name,
      detectorKey,
      maxPoints: maxPoints > 0 ? maxPoints : 10,
      levels: levels && levels.length > 0 ? levels : [
        { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' }
      ]
    }

    if (editingCriterion) {
      // Update existing criterion
      const updatedCriteria = criteria.map(c => 
        c.id === editingCriterion.id ? newCriterion : c
      )
      onCriteriaChange(updatedCriteria)
      notifications.show({
        title: 'Thành công',
        message: 'Tiêu chí đã được cập nhật',
        color: 'green'
      })
    } else {
      // Add new criterion
      onCriteriaChange([...criteria, newCriterion])
      notifications.show({
        title: 'Thành công',
        message: 'Tiêu chí mới đã được thêm',
        color: 'green'
      })
    }

    handleClose()
  }

  const handleDelete = (id: string) => {
    if (criteria.length <= 1) {
      notifications.show({
        title: 'Lỗi',
        message: 'Phải có ít nhất 1 tiêu chí',
        color: 'red'
      })
      return
    }
    
    const updatedCriteria = criteria.filter(c => c.id !== id)
    onCriteriaChange(updatedCriteria)
    notifications.show({
      title: 'Thành công',
      message: 'Tiêu chí đã được xóa',
      color: 'green'
    })
  }

  const addLevel = () => {
    const newLevel: Level = {
      points: 0,
      code: `${levels.length}`,
      name: '',
      description: ''
    }
    setLevels([...levels, newLevel])
  }

  // Create unique list of detector keys based on selected file type
  // Ensure no duplicate detector keys are passed to the Select component
  const detectorOptions = fixedCriteria ? 
    Array.from(
      new Map(
        fixedCriteria.map(item => [
          item.detectorKey, 
          {
            value: item.detectorKey,
            label: `${item.name} (${item.detectorKey})`
          }
        ])
      ).values()
    ) : 
    [];
  
  // Additional check to ensure no duplicates
  const uniqueDetectorOptions = detectorOptions.filter((option, index, self) => 
    index === self.findIndex(o => o.value === option.value)
  );

  // Add fixed criteria to custom criteria
  const addFixedCriteria = (fixedCriterion: FixedCriterion) => {
    // Ensure the fixed criterion has all required properties
    const validCriterion: Criterion = {
      id: fixedCriterion.id,
      name: fixedCriterion.name,
      detectorKey: fixedCriterion.detectorKey,
      maxPoints: fixedCriterion.maxPoints && fixedCriterion.maxPoints > 0 ? fixedCriterion.maxPoints : 10,
      levels: fixedCriterion.levels && fixedCriterion.levels.length > 0 
        ? fixedCriterion.levels 
        : [{ points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' }]
    };

    // Check if criterion already exists
    if (criteria.some(c => c.id === validCriterion.id)) {
      notifications.show({
        title: 'Lưu ý',
        message: 'Tiêu chí này đã được thêm',
        color: 'yellow'
      })
      return
    }
    
    onCriteriaChange([...criteria, validCriterion])
    notifications.show({
      title: 'Thành công',
      message: 'Tiêu chí cố định đã được thêm',
      color: 'green'
    })
  }

  // Add selected fixed criteria
  const addSelectedFixedCriteria = () => {
    if (fixedCriteria) {
      const selected = fixedCriteria.filter(c => selectedFixedCriteria.includes(c.id))
      const newCriteria = [...criteria]
      let addedCount = 0
      
      selected.forEach((criterion: FixedCriterion) => {
        // Ensure the criterion has all required properties
        const validCriterion: Criterion = {
          id: criterion.id,
          name: criterion.name,
          detectorKey: criterion.detectorKey,
          maxPoints: criterion.maxPoints && criterion.maxPoints > 0 ? criterion.maxPoints : 10,
          levels: criterion.levels && criterion.levels.length > 0 
            ? criterion.levels 
            : [{ points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' }]
        };

        // Check if criterion already exists
        if (!criteria.some(c => c.id === validCriterion.id)) {
          newCriteria.push(validCriterion)
          addedCount++
        }
      })
      
      onCriteriaChange(newCriteria)
      
      notifications.show({
        title: 'Thành công',
        message: `Đã thêm ${addedCount} tiêu chí cố định`,
        color: 'green'
      })
      
      setSelectedFixedCriteria([])
    }
  }

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Tiêu chí tùy chỉnh</Text>
        <Group>
          {fixedCriteria && fixedCriteria.length > 0 && (
            <Button 
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={() => setShowFixedCriteria(!showFixedCriteria)}
            >
              {showFixedCriteria ? 'Ẩn' : 'Hiển thị'} tiêu chí cố định
            </Button>
          )}
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => handleOpen()}
            size="sm"
          >
            Thêm tiêu chí
          </Button>
        </Group>
      </Group>

      {showFixedCriteria && fixedCriteria && fixedCriteria.length > 0 && (
        <Card withBorder p="md" mb="md">
          <Text fw={500} mb="sm">Tiêu chí cố định từ {fileType || 'hệ thống'}</Text>
          
          {isLoadingFixedCriteria ? (
            <Text>Đang tải tiêu chí cố định...</Text>
          ) : (
            <>
              <Box mb="sm">
                <Checkbox.Group
                  value={selectedFixedCriteria}
                  onChange={setSelectedFixedCriteria}
                >
                  <Accordion variant="contained">
                    {fixedCriteria.map((criterion: FixedCriterion) => (
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
                            
                            <Checkbox 
                              value={criterion.id}
                              label="Chọn tiêu chí này"
                              mb="sm"
                            />
                            
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconCopy size={14} />}
                              onClick={(e) => {
                                e.stopPropagation()
                                addFixedCriteria(criterion)
                              }}
                            >
                              Thêm vào rubric
                            </Button>
                          </Box>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Checkbox.Group>
              </Box>
              
              <Group justify="flex-end">
                <Button
                  variant="light"
                  onClick={addSelectedFixedCriteria}
                  disabled={selectedFixedCriteria.length === 0}
                >
                  Thêm {selectedFixedCriteria.length} tiêu chí đã chọn
                </Button>
              </Group>
            </>
          )}
        </Card>
      )}

      {criteria.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed" mb="md">
            Chưa có tiêu chí tùy chỉnh nào.
          </Text>
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => handleOpen()}
          >
            Thêm tiêu chí đầu tiên
          </Button>
        </Card>
      ) : (
        <Box>
          {criteria.map((criterion) => (
            <Card key={criterion.id} withBorder p="md" mb="sm">
              <Group justify="space-between">
                <Box>
                  <Text fw={500}>{criterion.name}</Text>
                  <Text size="sm" c="dimmed">{criterion.detectorKey}</Text>
                </Box>
                <Group>
                  <ActionIcon 
                    variant="light" 
                    color="blue"
                    onClick={() => handleOpen(criterion)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="light" 
                    color="red"
                    onClick={() => handleDelete(criterion.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              <Flex justify="space-between" mt="sm">
                <Badge color="blue" variant="light">
                  Max: {criterion.maxPoints} điểm
                </Badge>
                <Text size="sm">
                  {criterion.levels?.length || 0} mức điểm
                </Text>
              </Flex>
            </Card>
          ))}
        </Box>
      )}

      <Modal 
        opened={opened} 
        onClose={handleClose} 
        title={editingCriterion ? "Chỉnh sửa tiêu chí" : "Thêm tiêu chí mới"}
        size="lg"
        centered
      >
        <Box>
          <Select
            label="Loại file"
            placeholder="Chọn loại file"
            value={fileType}
            onChange={(value) => {
              setFileType(value as 'PPTX' | 'DOCX' | '')
              setDetectorKey('') // Reset detector key when file type changes
            }}
            data={[
              { value: 'PPTX', label: 'PowerPoint (.pptx)' },
              { value: 'DOCX', label: 'Word (.docx)' }
            ]}
            mb="md"
            required
            disabled={!!initialFileType} // Disable if fileType was provided as prop
          />
          
          <TextInput
            label="Tên tiêu chí"
            placeholder="Nhập tên tiêu chí"
            value={name}
            onChange={(e) => setName(e.target.value)}
            mb="md"
            required
          />
          
          <Select
            label="Detector Key"
            placeholder={fileType ? "Chọn detector key" : "Vui lòng chọn loại file trước"}
            value={detectorKey}
            onChange={(value) => setDetectorKey(value as string)}
            data={uniqueDetectorOptions}
            mb="md"
            required
            searchable
            disabled={!fileType} // Disable until file type is selected
            allowDeselect={false} // Prevent deselection issues
          />
          
          <NumberInput
            label="Điểm tối đa"
            placeholder="Nhập điểm tối đa"
            value={maxPoints}
            onChange={(value) => setMaxPoints(typeof value === 'number' ? value : 10)}
            mb="md"
            min={0.25}
            max={10}
            step={0.25}
            required
          />
          
          <Textarea
            label="Mô tả chi tiết"
            placeholder="Nhập mô tả chi tiết cho tiêu chí"
            value={description}
            onChange={(e) => {
              // Update the first level's description
              if (levels.length > 0) {
                const newLevels = [...levels]
                newLevels[0] = { ...newLevels[0], description: e.target.value }
                setLevels(newLevels)
              }
              setDescription(e.target.value)
            }}
            mb="md"
            required
          />
          
          <Button 
            leftSection={<IconPlus size={16} />} 
            variant="light" 
            onClick={addLevel}
            mb="md"
          >
            Thêm mức điểm
          </Button>
          
          <Group justify="flex-end" mt="md">
            <Button 
              variant="default" 
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button 
              leftSection={<IconCheck size={16} />} 
              onClick={handleSave}
            >
              {editingCriterion ? "Cập nhật" : "Thêm"}
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  )
}