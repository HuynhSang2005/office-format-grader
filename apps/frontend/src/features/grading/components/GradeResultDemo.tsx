import { Container, Stack, Title } from '@mantine/core';
import { GradeResultDisplay } from '@/features/grading/components';
import type { GradeResult } from '@/types';

// Sample data for testing the GradeResultDisplay component
const sampleGradeResult: GradeResult = {
  fileId: 'sample-123',
  filename: 'test-document.docx',
  fileType: 'DOCX',
  totalPoints: 7.5,
  maxPossiblePoints: 10,
  percentage: 75,
  gradedAt: new Date().toISOString(),
  processingTime: 1250,
  byCriteria: {
    'Formatting': {
      points: 2.5,
      passed: true,
      reason: 'Document has proper formatting with consistent fonts and styles',
      level: 'Good'
    },
    'Content Structure': {
      points: 3,
      passed: true,
      reason: 'Well organized content with clear sections and headings',
      level: 'Excellent'
    },
    'Language Usage': {
      points: 2,
      passed: false,
      reason: 'Some grammatical errors and informal language detected',
      level: 'Fair'
    }
  }
};

/**
 * Demo page to showcase the GradeResultDisplay component.
 * This is for development/testing purposes only.
 * @returns {JSX.Element} The rendered demo page.
 */
export function GradeResultDemo() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">Grade Result Display Demo</Title>
        <GradeResultDisplay gradeResult={sampleGradeResult} />
      </Stack>
    </Container>
  );
}
