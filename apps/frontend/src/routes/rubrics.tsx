import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { Container, Title, Stack, Button, Group, Text } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useAuthStore } from '@/store/authStore';
import { getCustomRubrics, deleteCustomRubric } from '@/api/rubricApi';
import { RubricList } from '@/features/rubrics/components/RubricList';
import { IconPlus } from '@tabler/icons-react';

/**
 * The Rubrics page, displaying a list of custom rubrics with management actions.
 * @returns {JSX.Element} The rendered rubrics page.
 */
function RubricsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['customRubrics'],
    queryFn: getCustomRubrics,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomRubric,
    onSuccess: () => {
      notifications.show({ 
        title: 'Thành công', 
        message: 'Đã xóa rubric.', 
        color: 'green' 
      });
      queryClient.invalidateQueries({ queryKey: ['customRubrics'] });
    },
    onError: (error) => {
      notifications.show({ 
        title: 'Lỗi', 
        message: error.message, 
        color: 'red' 
      });
    }
  });

  const openDeleteModal = (rubricId: string, rubricName: string) =>
    modals.openConfirmModal({
      title: 'Xác nhận Xóa',
      children: <Text size="sm">Bạn có chắc chắn muốn xóa rubric "{rubricName}" không?</Text>,
      labels: { confirm: 'Xóa', cancel: 'Hủy' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(rubricId),
    });

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Rubric Tùy chỉnh</Title>
          <Link to="/rubrics/new">
            <Button leftSection={<IconPlus size={16} />}>Tạo Rubric Mới</Button>
          </Link>
        </Group>
        <RubricList data={data ?? []} isLoading={isLoading} onDelete={openDeleteModal} />
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/rubrics')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: RubricsPage,
});
