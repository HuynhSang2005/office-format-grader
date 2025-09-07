/**
 * @file $resultId.lazy.tsx
 * @description Grade result page component with detailed view
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Flex, 
  Group,
  Box,
  Button,
  Alert,
  Skeleton,
  Table,
  Badge
} from '@mantine/core'
import { 
  IconDownload, 
  IconAlertCircle, 
  IconFileText,
  IconRefresh
} from '@tabler/icons-react'
import { useMemo } from 'react'
import { useGradeResult } from '../../../hooks/use-grade-result'
import { ScoreBadge } from '../../../components/grade/score-badge'
import type { CriterionEvalResult } from '../../../schemas/grade.schema'

// Import the rubric data
import pptxRubric from '../../../../../backend/src/config/presets/defaultRubric.pptx.json'
import docxRubric from '../../../../../backend/src/config/presets/defaultRubric.docx.json'

export const Route = createLazyFileRoute('/_auth/grade/$resultId')({
  component: GradeResultPage,
})

function GradeResultPage() {
  const { resultId } = Route.useParams()
  const { data: gradeResult, isLoading, error } = useGradeResult(resultId)

  const handleExportExcel = () => {
    // Navigate to export page with this result
    window.location.href = `/export?resultId=${resultId}&format=xlsx`
  }

  const handleRegrade = () => {
    // Mock regrade functionality
    alert('Regrade functionality would be implemented here')
  }

  // Get criteria names mapping from rubric
  const criteriaInfo = useMemo(() => {
    if (!gradeResult) return { names: {}, maxPoints: {} }
    
    const rubric = gradeResult.fileType === 'PPTX' ? pptxRubric : docxRubric
    const names: Record<string, string> = {}
    const maxPoints: Record<string, number> = {}
    
    rubric.criteria.forEach(criterion => {
      names[criterion.id] = criterion.name
      maxPoints[criterion.id] = criterion.maxPoints
    })
    
    return { names, maxPoints }
  }, [gradeResult])

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton height={28} width={200} mb={10} />
        <Skeleton height={20} width={300} mb="xl" />
        
        <Card withBorder p="lg" radius="md" mb="xl">
          <Skeleton height={200} />
        </Card>
        
        <Card withBorder p="lg" radius="md">
          <Skeleton height={300} />
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
          Không thể tải kết quả chấm điểm. Vui lòng thử lại sau.
        </Alert>
      </Container>
    )
  }

  if (!gradeResult) {
    return (
      <Container size="lg" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Không có dữ liệu" 
          color="yellow"
        >
          Không tìm thấy kết quả chấm điểm cho file này.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Flex justify="space-between" align="center" mb="xl">
        <Box>
          <Flex align="center" gap="md">
            <IconFileText size={32} color="var(--mantine-color-blue-6)" />
            <Box>
              <Title order={2}>{gradeResult.filename}</Title>
              <Text size="sm" c="dimmed">
                Đã chấm lúc {new Date(gradeResult.gradedAt).toLocaleString('vi-VN')}
              </Text>
            </Box>
          </Flex>
        </Box>
        
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="outline"
            onClick={handleRegrade}
          >
            Chấm lại
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportExcel}
          >
            Xuất Excel
          </Button>
        </Group>
      </Flex>

      {/* Overall Score Card */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <Text size="lg" fw={600}>Tổng điểm</Text>
          <Badge 
            color={gradeResult.percentage >= 80 ? 'green' : gradeResult.percentage >= 60 ? 'yellow' : 'red'}
            size="lg"
            radius="sm"
          >
            {gradeResult.percentage.toFixed(1)}%
          </Badge>
        </Flex>
        
        <Flex justify="center" mb="md">
          <ScoreBadge percentage={gradeResult.percentage} size={150} />
        </Flex>
        
        <Flex justify="space-between">
          <Text size="xl" fw={700}>
            {gradeResult.totalPoints.toFixed(2)} / 10
          </Text>
          <Text size="sm" c="dimmed">
            Thời gian xử lý: {gradeResult.processingTime.toFixed(1)} giây
          </Text>
        </Flex>
      </Card>

      {/* Criteria Breakdown Table */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="md">Chi tiết theo tiêu chí</Title>
        <CriteriaTable 
          criteriaData={gradeResult.byCriteria} 
          criteriaNames={criteriaInfo.names}
          criteriaMaxPoints={criteriaInfo.maxPoints}
        />
      </Card>

      {/* Action Buttons */}
      <Card withBorder p="lg" radius="md">
        <Flex gap="md" justify="center">
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportExcel}
          >
            Tải về bản chi tiết (Excel)
          </Button>
        </Flex>
      </Card>
    </Container>
  )
}

interface CriteriaTableProps {
  criteriaData: Record<string, CriterionEvalResult>
  criteriaNames: Record<string, string>
  criteriaMaxPoints: Record<string, number>
}

function CriteriaTable({ criteriaData, criteriaNames, criteriaMaxPoints }: CriteriaTableProps) {
  // Convert criteria data to array for rendering
  const criteriaArray = useMemo(() => Object.entries(criteriaData), [criteriaData])

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tiêu chí</Table.Th>
            <Table.Th style={{ width: '150px' }}>Điểm</Table.Th>
            <Table.Th>Phản hồi</Table.Th>
            <Table.Th style={{ width: '100px' }}>Mức độ</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {criteriaArray.map(([criteriaId, criteriaData]) => {
            const displayName = criteriaNames[criteriaId] || criteriaId
            const maxPoints = criteriaMaxPoints[criteriaId] || 10 // fallback to 10 if not found
            return (
              <Table.Tr key={criteriaId}>
                <Table.Td>
                  <Text fw={500}>{displayName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={600}>
                    {criteriaData.points.toFixed(2)} / {maxPoints.toFixed(2)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{criteriaData.reason}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    color={criteriaData.passed ? 'green' : 'red'} 
                    variant="light"
                  >
                    {criteriaData.level}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}