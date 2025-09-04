import { Paper, Title, Text } from '@mantine/core';

/**
 * A placeholder component for the score distribution chart.
 * @returns {JSX.Element} The rendered placeholder.
 */
export function ScoreDistributionChart() {
  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4}>Phân bổ Điểm</Title>
      <Text c="dimmed" mt="sm">
        Biểu đồ sẽ được cập nhật trong phiên bản tới.
      </Text>
    </Paper>
  );
}
