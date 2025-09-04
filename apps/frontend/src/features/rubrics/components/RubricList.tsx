import { Card, Text, SimpleGrid, Group, Button, Loader, Stack, Center, Alert } from '@mantine/core';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { CustomRubric } from '@/types';

interface RubricListProps {
  data: CustomRubric[];
  isLoading: boolean;
  onDelete: (rubricId: string, rubricName: string) => void;
}

/**
 * Component to display a list of custom rubrics in a grid layout.
 * @param props - The props for the component.
 * @returns {JSX.Element} The rendered rubric list.
 */
export function RubricList({ data, isLoading, onDelete }: RubricListProps) {
  // Loading state with improved UX
  if (isLoading) {
    return (
      <Center>
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text size="sm" c="dimmed">Đang tải danh sách rubric...</Text>
        </Stack>
      </Center>
    );
  }

  // Empty state with call-to-action
  if (data.length === 0) {
    return (
      <Alert 
        icon={<IconAlertCircle size={16} />}
        title="Chưa có rubric nào"
        color="blue"
        variant="light"
      >
        <Stack gap="md">
          <Text>Bạn chưa tạo rubric tùy chỉnh nào. Hãy tạo rubric đầu tiên để bắt đầu!</Text>
          <Group>
            <Link to="/rubrics/new">
              <Button 
                leftSection={<IconPlus size={16} />}
                variant="filled"
                size="sm"
              >
                Tạo Rubric Mới
              </Button>
            </Link>
          </Group>
        </Stack>
      </Alert>
    );
  }

  // Render rubric cards
  const cards = data.map((rubric) => (
    <Card key={rubric.id} withBorder radius="md" p="md" shadow="sm">
      <Stack gap="sm">
        <Text fw={500} size="lg">{rubric.name}</Text>
        <Text size="sm" c="dimmed">
          Tổng điểm: <Text span fw={500} c="blue">{rubric.total}</Text> - {rubric.content.criteria.length} tiêu chí
        </Text>
        <Group justify="flex-end" mt="xs">
          <Link to="/rubrics/$rubricId/edit" params={{ rubricId: rubric.id }}>
            <Button variant="default" size="xs">Chỉnh sửa</Button>
          </Link>
          <Button 
            variant="outline" 
            color="red" 
            size="xs" 
            onClick={() => onDelete(rubric.id, rubric.name)}
          >
            Xoá
          </Button>
        </Group>
      </Stack>
    </Card>
  ));

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {cards}
    </SimpleGrid>
  );
}
