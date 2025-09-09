/**
 * @file edit.$criterionId.tsx
 * @description Page for editing a criterion
 * @author Nguyễn Huỳnh Sang
 */

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { 
  Container, 
  Title, 
  Text, 
  Alert,
  Skeleton,
  Box
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useCriterion } from '../../../hooks/use-criteria'
import { CriteriaForm } from '../../../components/criteria/criteria-form'

export const Route = createFileRoute('/_auth/criteria/edit/$criterionId')({
  component: EditCriterionPage,
})

function EditCriterionPage() {
  const { criterionId } = useParams({ from: '/_auth/criteria/edit/$criterionId' })
  const navigate = useNavigate()
  
  const { data: criterion, isLoading, error } = useCriterion(criterionId)

  const handleSuccess = () => {
    // Navigate back to criteria list after successful update
    navigate({ to: '/criteria/list' })
  }

  const handleCancel = () => {
    // Navigate back to criteria list
    navigate({ to: '/criteria/list' })
  }

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} mb="xl">Chỉnh sửa tiêu chí</Title>
        <Skeleton height={40} mb="md" />
        <Skeleton height={200} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} mb="xl">Chỉnh sửa tiêu chí</Title>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Có lỗi xảy ra" 
          color="red"
        >
          {error instanceof Error ? error.message : 'Không thể tải thông tin tiêu chí'}
        </Alert>
      </Container>
    )
  }

  if (!criterion) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} mb="xl">Chỉnh sửa tiêu chí</Title>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Không tìm thấy" 
          color="yellow"
        >
          Không tìm thấy tiêu chí với ID: {criterionId}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Chỉnh sửa tiêu chí</Title>
      
      <Box mb="md">
        <Text size="sm" c="dimmed">
          ID: {criterion.id}
        </Text>
      </Box>
      
      <CriteriaForm 
        criterion={criterion ? {
          id: criterion.id,
          name: criterion.name,
          detectorKey: criterion.detectorKey,
          description: criterion.description,
          maxPoints: criterion.maxPoints || 10,
          levels: criterion.levels || []
        } : null} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Container>
  )
}