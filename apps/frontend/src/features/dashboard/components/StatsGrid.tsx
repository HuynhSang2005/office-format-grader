import { Card, Text, SimpleGrid, Group } from '@mantine/core';
import { IconFileCheck, IconFileX, IconNotebook } from '@tabler/icons-react';

/**
 * Props for the StatsGrid component.
 */
interface StatsGridProps {
  data: {
    totalGraded: number;
    totalUngraded: number;
    totalCustomRubrics: number;
  };
}

/**
 * Displays a grid of key statistics for the dashboard.
 * @param {StatsGridProps} props - The statistics data.
 * @returns {JSX.Element} The rendered grid of stat cards.
 */
export function StatsGrid({ data }: StatsGridProps) {
  const stats = [
    { title: 'Bài đã chấm', value: data.totalGraded, icon: IconFileCheck },
    { title: 'Bài chưa chấm', value: data.totalUngraded, icon: IconFileX },
    { title: 'Rubric tùy chỉnh', value: data.totalCustomRubrics, icon: IconNotebook },
  ];

  const items = stats.map((stat) => (
    <Card key={stat.title} withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {stat.title}
        </Text>
        <stat.icon size="1.4rem" stroke={1.5} />
      </Group>
      <Text size="xl" fw={700}>
        {stat.value}
      </Text>
    </Card>
  ));

  return <SimpleGrid cols={{ base: 1, sm: 3 }}>{items}</SimpleGrid>;
}
