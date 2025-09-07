/**
 * @file $criterionId.lazy.tsx
 * @description Criterion detail page component
 * @author Your Name
 */

import { createLazyFileRoute, useParams } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Badge,
  Box,
  Alert,
  Skeleton,
  Button
} from '@mantine/core'
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import { useCriterion } from '../../../hooks/use-criteria'
import { useNavigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/criteria/$criterionId')({
  component: CriterionDetailPage,
})

function CriterionDetailPage() {
  const { criterionId } = useParams({ from: '/_auth/criteria/$criterionId' })
  const { data: criterion, isLoading, error } = useCriterion(criterionId)
  const navigate = useNavigate()
  
  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton height={30} mb="md" />
        <Card withBorder p="lg" radius="md">
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} mb="sm" />
          <Skeleton height={20} width="70%" />
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
          {error instanceof Error ? error.message : 'Không thể tải thông tin tiêu chí'}
        </Alert>
      </Container>
    )
  }
  
  if (!criterion) {
    return (
      <Container size="lg" py="xl">
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
      <Button
        leftSection={<IconArrowLeft size={16} />}
        variant="subtle"
        mb="md"
        onClick={() => navigate({ to: '/criteria/list' })}
      >
        Quay lại danh sách
      </Button>
      
      <Card withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>{criterion.name}</Title>
          <Badge color="blue" size="lg">
            {criterion.detectorKey}
          </Badge>
        </Group>
        
        {criterion.description && (
          <Text size="lg" mb="xl">
            {criterion.description}
          </Text>
        )}
        
        <Box mb="xl">
          <Text fw={500} size="lg" mb="sm">Thông tin chi tiết</Text>
          
          {criterion.maxPoints !== undefined && (
            <Text mb="sm">
              <Text component="span" fw={500}>Điểm tối đa:</Text> {criterion.maxPoints}
            </Text>
          )}
        </Box>
        
        {criterion.levels && criterion.levels.length > 0 && (
          <Box>
            <Text fw={500} size="lg" mb="sm">Các mức điểm</Text>
            
            {criterion.levels.map((level, index) => (
              <Card key={index} withBorder p="md" radius="sm" mb="sm">
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{level.name}</Text>
                  <Badge color={level.points > 0 ? 'green' : 'red'}>
                    {level.points} điểm
                  </Badge>
                </Group>
                <Text size="sm">
                  {level.description}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Mã: {level.code}
                </Text>
              </Card>
            ))}
          </Box>
        )}
      </Card>
    </Container>
  )
}