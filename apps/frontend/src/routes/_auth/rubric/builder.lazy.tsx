/**
 * @file builder.lazy.tsx
 * @description Custom rubric builder page with drag and drop functionality
 * @author Nguyễn Huỳnh Sang
 * @link https://docs.dndkit.com/
 */

import { 
  Button, 
  Container, 
  TextInput, 
  NumberInput, 
  Card, 
  ActionIcon, 
  Text, 
  Flex,
  Divider,
  Switch,
  FileButton,
  Title,
  Badge,
  Textarea
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  IconPlus, 
  IconTrash, 
  IconGripVertical, 
  IconUpload,
  IconDownload,
  IconCheck
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuthStore } from '../../../stores/auth.store'
import { useCreateRubric, useRubrics } from '../../../hooks/use-rubric'
import type { Criterion, Level, Rubric } from '../../../schemas/custom-rubric.schema'

export const Route = createLazyFileRoute('/_auth/rubric/builder')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([
    {
      id: '1',
      name: 'Tiêu chí 1',
      detectorKey: 'content',
      maxPoints: 10,
      levels: [
        { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt' },
        { points: 5, code: '5', name: 'Trung bình', description: 'Trung bình' },
        { points: 10, code: '10', name: 'Tốt', description: 'Tốt' }
      ]
    }
  ])
  const [isPublic, setIsPublic] = useState(false)
  
  const { data: rubricsData } = useRubrics()
  const { mutateAsync: createRubric } = useCreateRubric()
  
  const navigate = useNavigate()
  const [_opened, { open: _open, close: _close }] = useDisclosure(false)
  const [_jsonContent, _setJsonContent] = useState('')
  
  // Calculate total points
  const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0)

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setCriteria((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Add new criterion
  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: `criterion-${Date.now()}`,
      name: 'Tiêu chí mới',
      detectorKey: '',
      maxPoints: 10,
      levels: [
        {
          points: 0,
          code: '0',
          name: '',
          description: ''
        }
      ]
    }
    setCriteria([...criteria, newCriterion])
  }

  // Update criterion
  const updateCriterion = (updated: Criterion) => {
    setCriteria(criteria.map(c => c.id === updated.id ? updated : c))
  }

  // Delete criterion
  const deleteCriterion = (id: string) => {
    if (criteria.length <= 1) {
      notifications.show({
        title: 'Lỗi',
        message: 'Rubric phải có ít nhất 1 tiêu chí',
        color: 'red'
      })
      return
    }
    setCriteria(criteria.filter(c => c.id !== id))
  }

  // Save rubric
  const handleSave = async () => {
    if (!user) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng đăng nhập để tạo rubric',
        color: 'red'
      })
      return
    }

    if (!name.trim()) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng nhập tên rubric',
        color: 'red'
      })
      return
    }

    if (criteria.length === 0) {
      notifications.show({
        title: 'Lỗi',
        message: 'Rubric phải có ít nhất 1 tiêu chí',
        color: 'red'
      })
      return
    }

    try {
      const rubricData: Rubric = {
        title: name,
        version: '1.0',
        locale: 'vi-VN',
        totalPoints,
        scoring: {
          method: 'sum',
          rounding: 'half_up_0.25'
        },
        criteria
      }

      // Validate before saving
      // Note: We're assuming there's a validateRubric function in the useRubrics hook
      // If not, we'll need to implement it or remove this validation
      if (rubricsData?.data && rubricsData.data.length > 0) {
        // Just a placeholder validation - in a real app, you'd have proper validation
        console.log('Validating rubric:', rubricData);
      }

      const requestData = {
        ownerId: user.id, // Use authenticated user ID
        name,
        content: rubricData,
        isPublic
      }

      await createRubric(requestData)
      notifications.show({
        title: 'Thành công',
        message: 'Rubric đã được tạo',
        color: 'green'
      })
      navigate({ to: '/rubric/builder' })
    } catch (err) {
      notifications.show({
        title: 'Lỗi',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo rubric',
        color: 'red'
      })
    }
  }

  // Export rubric to JSON
  const handleExport = () => {
    if (criteria.length === 0) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không có dữ liệu để xuất',
        color: 'red'
      })
      return
    }

    const rubricData: Rubric = {
      title: name,
      version: '1.0',
      locale: 'vi-VN',
      totalPoints,
      scoring: {
        method: 'sum',
        rounding: 'half_up_0.25'
      },
      criteria
    }

    const dataStr = JSON.stringify(rubricData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `rubric-${name || 'custom'}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Import rubric from JSON
  const handleImport = (file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const rubricData: Rubric = JSON.parse(content)
        
        // Validate the imported rubric structure
        if (!rubricData.criteria || !Array.isArray(rubricData.criteria)) {
          throw new Error('Invalid rubric structure')
        }

        setName(rubricData.title || 'Imported Rubric')
        setCriteria(rubricData.criteria)
        
        notifications.show({
          title: 'Thành công',
          message: 'Rubric đã được nhập thành công',
          color: 'green'
        })
      } catch (_err) {
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể đọc file rubric. Vui lòng kiểm tra lại định dạng.',
          color: 'red'
        })
      }
    }

    reader.readAsText(file)
  }

  return (
    <Container size="lg" py="xl">
      <Flex justify="space-between" align="center" mb="xl">
        <Title order={2}>Tạo Rubric Tùy Chỉnh</Title>
        <Badge color="blue" size="lg">
          Tổng điểm: {totalPoints}
        </Badge>
      </Flex>

      {/* Rubric Info */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Flex gap="md" wrap="wrap">
          <TextInput
            placeholder="Tên rubric"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, minWidth: 300 }}
          />
          <Switch
            label="Công khai"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.currentTarget.checked)}
          />
        </Flex>
      </Card>

      {/* Action Bar */}
      <Card withBorder p="md" radius="md" mb="xl">
        <Flex gap="sm" wrap="wrap">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={addCriterion}
          >
            Thêm tiêu chí
          </Button>
          
          <Button
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            color="green"
          >
            Lưu rubric
          </Button>
          
          <FileButton onChange={handleImport} accept="application/json">
            {(props) => (
              <Button 
                leftSection={<IconUpload size={16} />} 
                variant="outline" 
                {...props}
              >
                Nhập JSON
              </Button>
            )}
          </FileButton>
          
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
            onClick={handleExport}
          >
            Xuất JSON
          </Button>
        </Flex>
      </Card>

      {/* Criteria List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={criteria.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {criteria.map((criterion) => (
            <SortableCriterionItem
              key={criterion.id}
              criterion={criterion}
              onUpdate={updateCriterion}
              onDelete={() => deleteCriterion(criterion.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {criteria.length === 0 && (
        <Card withBorder p="xl" radius="md" ta="center">
          <Text c="dimmed" mb="md">
            Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={addCriterion}
          >
            Thêm tiêu chí đầu tiên
          </Button>
        </Card>
      )}
    </Container>
  )
}

// Sortable Criterion Item Component
function SortableCriterionItem({ 
  criterion,
  onUpdate,
  onDelete
}: {
  criterion: Criterion
  onUpdate: (updated: Criterion) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: criterion.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [name, setName] = useState(criterion.name)
  const [detectorKey, setDetectorKey] = useState(criterion.detectorKey)
  const [maxPoints, setMaxPoints] = useState(criterion.maxPoints)
  const [levels, setLevels] = useState<Level[]>(criterion.levels)

  // Update parent when local state changes
  useEffect(() => {
    onUpdate({
      ...criterion,
      name,
      detectorKey,
      maxPoints,
      levels
    })
  }, [name, detectorKey, maxPoints, levels, criterion, onUpdate])

  const addLevel = () => {
    const newLevel: Level = {
      points: 0,
      code: `${levels.length + 1}`,
      name: '',
      description: ''
    }
    setLevels([...levels, newLevel])
  }

  const updateLevel = (index: number, updatedLevel: Level) => {
    const newLevels = [...levels]
    newLevels[index] = updatedLevel
    setLevels(newLevels)
  }

  const deleteLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index)
    setLevels(newLevels)
  }

  return (
    <Card withBorder p="md" radius="md" mb="md" ref={setNodeRef} style={style}>
      <Flex align="center" gap="sm" mb="md">
        <ActionIcon 
          variant="subtle" 
          color="gray" 
          {...attributes} 
          {...listeners}
        >
          <IconGripVertical size={16} />
        </ActionIcon>
        <TextInput
          placeholder="Tên tiêu chí"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <NumberInput
          placeholder="Điểm tối đa"
          value={maxPoints}
          onChange={(value) => setMaxPoints(Number(value) || 0)}
          min={1}
          max={10}
          w={120}
        />
        <ActionIcon 
          color="red" 
          variant="subtle" 
          onClick={onDelete}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Flex>

      <TextInput
        placeholder="Detector key"
        value={detectorKey}
        onChange={(e) => setDetectorKey(e.target.value)}
        mb="md"
      />

      <Divider my="sm" label="Mức điểm" labelPosition="center" />

      {levels.map((level, index) => (
        <Flex key={`${level.code}-${index}`} gap="sm" mb="sm" align="flex-end">
          <NumberInput
            placeholder="Điểm"
            value={level.points}
            onChange={(value) => {
              const newLevels = [...levels]
              newLevels[index] = { ...level, points: Number(value) || 0 }
              setLevels(newLevels)
            }}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Mô tả"
            value={level.description}
            onChange={(event) => {
              const newLevels = [...levels]
              newLevels[index] = { ...level, description: event.currentTarget.value }
              setLevels(newLevels)
            }}
            style={{ flex: 2 }}
          />
          <ActionIcon 
            color="red" 
            variant="light"
            onClick={() => deleteLevel(index)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Flex>
      ))}

      <Textarea
        placeholder="Mô tả chi tiết"
        value={levels[0]?.description || ''}
        onChange={(e) => levels.length > 0 && updateLevel(0, { ...levels[0], description: e.target.value })}
        mb="sm"
      />

      <Button 
        leftSection={<IconPlus size={16} />} 
        variant="light" 
        onClick={addLevel}
        size="xs"
      >
        Thêm mức điểm
      </Button>
    </Card>
  )
}