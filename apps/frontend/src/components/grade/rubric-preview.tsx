/**
 * @file rubric-preview.tsx
 * @description Rubric preview component that displays the rubric used for grading
 * @author Your Name
 * @example
 * <RubricPreview rubric={rubricData} />
 */

import { Accordion, Text, List, ThemeIcon } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import type { Rubric, Level } from '../../types'
import type { Criterion } from '../../schemas/criteria.schema'

interface RubricPreviewProps {
  rubric: Rubric
}

/**
 * Rubric preview component that displays the rubric used for grading in an accordion
 */
export function RubricPreview({ rubric }: RubricPreviewProps) {
  return (
    <Accordion variant="contained">
      <Accordion.Item value="rubric">
        <Accordion.Control>
          <Text fw={600}>Rubric: {rubric.title}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Text size="sm" c="dimmed" mb="sm">
            Version: {rubric.version} | Total Points: {rubric.totalPoints}
          </Text>
          
          {rubric.criteria.map((criterion: Criterion) => (
            <Accordion key={criterion.id} variant="filled" mb="sm">
              <Accordion.Item value={criterion.id}>
                <Accordion.Control>
                  <Text fw={500}>{criterion.name}</Text>
                  <Text size="sm" c="dimmed">
                    Max Points: {criterion.maxPoints}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <List spacing="xs" size="sm" center>
                    {criterion.levels?.map((level: Level) => (
                      <List.Item
                        key={level.code}
                        icon={
                          <ThemeIcon color={level.points > 0 ? 'green' : 'red'} size={20} radius="xl">
                            {level.points > 0 ? <IconCheck size={12} /> : <IconX size={12} />}
                          </ThemeIcon>
                        }
                      >
                        <Text fw={500}>{level.name}</Text>
                        <Text size="sm">{level.description}</Text>
                        <Text size="xs" c="dimmed">
                          Points: {level.points}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          ))}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}