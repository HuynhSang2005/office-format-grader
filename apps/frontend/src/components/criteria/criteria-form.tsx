/**
 * @file criteria-form.tsx
 * @description Form component for creating and editing criteria
 * @author Nguyễn Huỳnh Sang
 */

import { 
  Button, 
  Card, 
  Text, 
  Group, 
  TextInput, 
  NumberInput, 
  Textarea,
  Box,
  Flex,
  Badge,
  Accordion,
  Select
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconPlus, 
  IconTrash, 
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useCreateCriterion, useUpdateCriterion, useSupportedCriteria } from '../../hooks/use-criteria'
import type { Criterion, Level, CreateCriterion } from '../../schemas/criteria.schema'

interface CriteriaFormProps {
  criterion?: Criterion | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function CriteriaForm({ criterion, onSuccess, onCancel }: CriteriaFormProps) {
  const [fileType, setFileType] = useState<'PPTX' | 'DOCX' | ''>('')
  const [name, setName] = useState('')
  const [detectorKey, setDetectorKey] = useState('')
  const [maxPoints, setMaxPoints] = useState(10)
  const [description, setDescription] = useState('')
  const [levels, setLevels] = useState<Level[]>([
    { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
    { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
    { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
  ])
  
  const { mutate: createCriterion, isPending: isCreating } = useCreateCriterion()
  const { mutate: updateCriterion, isPending: isUpdating } = useUpdateCriterion()
  
  // Fetch supported criteria based on selected file type
  const { data: supportedCriteria } = useSupportedCriteria(fileType || undefined)
  
  // Create unique list of detector keys based on selected file type
  // Ensure no duplicate detector keys are passed to the Select component
  const detectorOptions = supportedCriteria ? 
    Array.from(
      new Map(
        supportedCriteria.map(item => [
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
  
  const isPending = isCreating || isUpdating

  // Populate form when editing
  useEffect(() => {
    if (criterion) {
      setName(criterion.name)
      setDetectorKey(criterion.detectorKey)
      setMaxPoints(criterion.maxPoints || 10)
      setDescription(criterion.levels?.[0]?.description || '')
      setLevels(criterion.levels || [
        { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
        { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
        { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
      ])
    }
  }, [criterion])

  const resetForm = () => {
    setFileType('')
    setName('')
    setDetectorKey('')
    setMaxPoints(10)
    setDescription('')
    setLevels([
      { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
      { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
      { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
    ])
  }

  const handleSubmit = () => {
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

    if (!description.trim()) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng nhập mô tả tiêu chí (1-500 ký tự)',
        color: 'red'
      })
      return
    }

    if (description.length > 500) {
      notifications.show({
        title: 'Lỗi',
        message: 'Mô tả tiêu chí không được quá 500 ký tự',
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

    const criterionData: CreateCriterion = {
      name,
      description,
      detectorKey,
      maxPoints,
      levels
    }

    if (criterion) {
      // Update existing criterion
      updateCriterion({ id: criterion.id, ...criterionData }, {
        onSuccess: () => {
          notifications.show({
            title: 'Thành công',
            message: 'Tiêu chí đã được cập nhật',
            color: 'green'
          })
          resetForm()
          onSuccess?.()
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Lỗi',
            message: error.message || 'Không thể cập nhật tiêu chí',
            color: 'red'
          })
        }
      })
    } else {
      // Create new criterion
      createCriterion(criterionData, {
        onSuccess: () => {
          notifications.show({
            title: 'Thành công',
            message: 'Tiêu chí mới đã được tạo',
            color: 'green'
          })
          resetForm()
          onSuccess?.()
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Lỗi',
            message: error.message || 'Không thể tạo tiêu chí mới',
            color: 'red'
          })
        }
      })
    }
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

  const updateLevel = (index: number, field: keyof Level, value: any) => {
    const newLevels = [...levels]
    newLevels[index] = { ...newLevels[index], [field]: value }
    
    // Validate points don't exceed maxPoints
    if (field === 'points' && typeof value === 'number') {
      if (value > maxPoints) {
        notifications.show({
          title: 'Lỗi',
          message: `Points của level không được vượt quá điểm tối đa (${maxPoints})`,
          color: 'red'
        })
        return
      }
    }
    
    setLevels(newLevels)
  }

  const removeLevel = (index: number) => {
    if (levels.length <= 2) {
      notifications.show({
        title: 'Lỗi',
        message: 'Phải có ít nhất 2 mức điểm',
        color: 'red'
      })
      return
    }
    setLevels(levels.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Card withBorder p="lg" radius="md">
        <Text fw={500} size="lg" mb="md">
          {criterion ? "Chỉnh sửa tiêu chí" : "Tạo tiêu chí mới"}
        </Text>
        
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
          label="Mô tả tiêu chí"
          placeholder="Nhập mô tả tiêu chí"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb="md"
          required
        />
        
        <Text size="sm" fw={500} mb="xs">Các mức điểm:</Text>
        <Accordion variant="contained" mb="md">
          {levels.map((level, index) => (
            <Accordion.Item key={index} value={`level-${index}`}>
              <Accordion.Control>
                <Group justify="space-between">
                  <Text fw={500}>{level.name || `Mức ${index + 1}`}</Text>
                  <Badge color={level.points > 0 ? 'green' : 'red'}>
                    {level.points} điểm
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <TextInput
                  label="Tên mức"
                  placeholder="Nhập tên mức điểm"
                  value={level.name}
                  onChange={(e) => updateLevel(index, 'name', e.target.value)}
                  mb="sm"
                />
                
                <NumberInput
                  label="Điểm"
                  placeholder="Nhập điểm"
                  value={level.points}
                  onChange={(value) => updateLevel(index, 'points', typeof value === 'number' ? value : 0)}
                  mb="sm"
                  min={0}
                  step={0.25}
                />
                
                <TextInput
                  label="Mã"
                  placeholder="Nhập mã mức điểm"
                  value={level.code}
                  onChange={(e) => updateLevel(index, 'code', e.target.value)}
                  mb="sm"
                />
                
                <Textarea
                  label="Mô tả"
                  placeholder="Nhập mô tả cho mức điểm này"
                  value={level.description}
                  onChange={(e) => updateLevel(index, 'description', e.target.value)}
                  mb="sm"
                />
                
                <Flex justify="flex-end">
                  <Button
                    variant="outline"
                    color="red"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => removeLevel(index)}
                    disabled={levels.length <= 2}
                  >
                    Xóa mức này
                  </Button>
                </Flex>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        
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
            onClick={() => {
              resetForm()
              onCancel?.()
            }}
            leftSection={<IconX size={16} />}
          >
            Hủy
          </Button>
          <Button 
            leftSection={<IconCheck size={16} />} 
            onClick={handleSubmit}
            loading={isPending}
          >
            {criterion ? "Cập nhật" : "Tạo tiêu chí"}
          </Button>
        </Group>
      </Card>
    </Box>
  )
}