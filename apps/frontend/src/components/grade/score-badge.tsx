/**
 * @file score-badge.tsx
 * @description Score badge component with color coding based on score percentage
 * @author Your Name
 * @example
 * <ScoreBadge percentage={85} size={100} />
 */

import { RingProgress, Text, Center } from '@mantine/core'

interface ScoreBadgeProps {
  percentage: number
  size?: number
}

/**
 * Score badge component that displays a ring progress with color coding
 * - < 50%: Red
 * - 50-70%: Orange
 * - ≥ 70%: Green
 */
export function ScoreBadge({ percentage, size = 100 }: ScoreBadgeProps) {
  // Determine color based on percentage
  const getColor = () => {
    if (percentage < 50) return 'red'
    if (percentage < 70) return 'orange'
    return 'green'
  }

  return (
    <RingProgress
      size={size}
      thickness={size / 10}
      sections={[{ value: percentage, color: getColor() }]}
      label={
        <Center>
          <Text size="xl" fw={700}>
            {percentage.toFixed(0)}%
          </Text>
        </Center>
      }
    />
  )
}