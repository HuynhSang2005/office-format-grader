import {
  Accordion,
  Badge,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
  Title,
  rem,
  Divider,
} from '@mantine/core';
import { IconFileCheck } from '@tabler/icons-react';
import type { GradeResult } from '@/types';

/**
 * Props for the GradeResultDisplay component.
 */
interface GradeResultDisplayProps {
  gradeResult: GradeResult;
}

/**
 * A component to display the detailed results of a graded file.
 * It shows a summary with a progress ring and a detailed breakdown of each criterion in an accordion.
 * @param {GradeResultDisplayProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function GradeResultDisplay({ gradeResult }: GradeResultDisplayProps) {
  const {
    filename,
    totalPoints,
    maxPossiblePoints,
    percentage,
    byCriteria,
  } = gradeResult;

  const scoreColor = percentage >= 80 ? 'teal' : percentage >= 50 ? 'yellow' : 'red';

  // Find maxPoints for each criterion from the rubric (if available, otherwise estimate)
  // Since CriterionEvalResult doesn't have maxPoints, we'll estimate based on totalPoints distribution
  const criteriaItems = Object.entries(byCriteria).map(([key, result]) => {
    // Estimate maxPoints based on the proportion of this criterion's points to total
    const pointsProportion = result.points / totalPoints;
    const estimatedMaxPoints = Math.round((pointsProportion * maxPossiblePoints) + 1);

    return (
      <Accordion.Item key={key} value={key}>
        <Accordion.Control>
          <Group justify="space-between" gap="lg">
            <Text fw={500} size="sm">{key}</Text>
            <Group gap="xs">
              <Text size="sm" fw={500} c={result.passed ? 'teal' : 'red'}>
                {result.points.toFixed(1)} / {estimatedMaxPoints}
              </Text>
              <Badge 
                color={result.passed ? 'teal' : 'red'} 
                variant="light"
                size="sm"
              >
                {result.passed ? 'Đạt' : 'Không đạt'}
              </Badge>
            </Group>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="xs">
            <Group>
              <Text size="sm" fw={500}>Cấp độ:</Text>
              <Badge variant="outline" size="sm">{result.level}</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              <Text span fw={500}>Lý do:</Text> {result.reason}
            </Text>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    );
  });

  return (
    <Paper p="lg" withBorder radius="md" shadow="sm">
      <Stack gap="lg">
        <Group gap="md" justify="center">
          <IconFileCheck size={24} color="var(--mantine-color-blue-6)" />
          <Title order={3} ta="center" c="blue">
            {filename}
          </Title>
        </Group>
        
        <Divider />
        
        <Group justify="center">
          <RingProgress
            size={180}
            thickness={12}
            roundCaps
            sections={[{ value: percentage, color: scoreColor }]}
            label={
              <Stack align="center" gap={2}>
                <Text c={scoreColor} fw={700} style={{ fontSize: rem(32) }}>
                  {totalPoints.toFixed(1)}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  trên {maxPossiblePoints} điểm
                </Text>
                <Text size="sm" fw={500} c={scoreColor}>
                  {percentage.toFixed(1)}%
                </Text>
              </Stack>
            }
          />
        </Group>
        
        <Divider />
        
        <Stack gap="md">
          <Title order={4}>Chi tiết theo tiêu chí</Title>
          <Accordion variant="separated" radius="md">
            {criteriaItems}
          </Accordion>
        </Stack>
      </Stack>
    </Paper>
  );
}
