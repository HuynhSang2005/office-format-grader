import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Container, Title } from '@mantine/core';
import { RubricForm } from '@/features/rubrics/components/RubricForm';
import { createCustomRubric } from '@/api/rubricApi';
import { useAuthStore } from '@/store/authStore';

/**
 * Page for creating a new custom rubric.
 * @returns {JSX.Element} The rendered create rubric page.
 */
function CreateRubricPage() {
    const navigate = useNavigate({ from: '/rubrics/new' });
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const mutation = useMutation({
        mutationFn: createCustomRubric,
        onSuccess: () => {
            notifications.show({ 
                title: 'Thành công', 
                message: 'Đã tạo rubric mới!', 
                color: 'green' 
            });
            queryClient.invalidateQueries({ queryKey: ['customRubrics'] });
            navigate({ to: '/rubrics' });
        },
        onError: (error) => {
             notifications.show({ 
                title: 'Lỗi', 
                message: error.message, 
                color: 'red' 
            });
        }
    });

    const handleSubmit = (data: any) => {
        if (!user) return;
        
        // Transform form data to match backend expected structure
        const payload = {
            ownerId: user.id,
            name: data.title,
            isPublic: false,
            content: {
                title: data.title,
                version: '1.0',
                locale: 'vi',
                totalPoints: data.criteria.reduce((sum: number, criterion: any) => sum + criterion.maxPoints, 0),
                scoring: {
                    method: 'sum' as const,
                    rounding: 'half_up_0.25' as const,
                },
                criteria: data.criteria.map((criterion: any, index: number) => ({
                    id: `criterion_${index + 1}`,
                    name: criterion.name,
                    detectorKey: criterion.detectorKey,
                    maxPoints: criterion.maxPoints,
                    levels: criterion.levels.map((level: any, levelIndex: number) => ({
                        code: `level_${levelIndex + 1}`,
                        name: level.name,
                        points: level.points,
                        description: level.description,
                    })),
                })),
            }
        };
        mutation.mutate(payload);
    };

    return (
        <Container size="lg">
            <Title order={1} mb="lg">Tạo Rubric Mới</Title>
            <RubricForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
        </Container>
    );
}

export const Route = createFileRoute('/rubrics/new')({
    component: CreateRubricPage
});
