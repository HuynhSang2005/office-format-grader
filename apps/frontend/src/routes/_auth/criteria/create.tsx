/**
 * @file create.tsx
 * @description Page for creating a new criterion
 * @author Nguyễn Huỳnh Sang
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Container, 
  Title, 
  Button,
  Group,
  Box
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { CriteriaForm } from '../../../components/criteria/criteria-form'

export const Route = createFileRoute('/_auth/criteria/create')({
  component: CreateCriterionPage,
})

function CreateCriterionPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // Navigate back to criteria list after successful creation
    navigate({ to: '/criteria/list' })
  }

  const handleCancel = () => {
    // Navigate back to criteria list
    navigate({ to: '/criteria/list' })
  }

  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate({ to: '/criteria/list' })}
        >
          Quay lại
        </Button>
        <Title order={2}>Tạo tiêu chí mới</Title>
      </Group>
      
      <Box>
        <CriteriaForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  )
}