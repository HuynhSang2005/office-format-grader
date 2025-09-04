import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { z } from 'zod';
import { TextInput, Button, Stack, Group, ActionIcon, Title, Paper, NumberInput, Textarea, Select, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

// Placeholder for detector keys
const detectorKeyOptions = [
    'docx.toc', 'docx.headerFooter', 'pptx.theme', 'pptx.animations', 'common.filenameConvention'
];

// Zod schema for validation
const rubricFormSchema = z.object({
    title: z.string().min(1, 'Tên rubric không được để trống'),
    criteria: z.array(z.object({
        name: z.string().min(1, 'Tên tiêu chí không được để trống'),
        detectorKey: z.string().min(1, 'Detector key là bắt buộc'),
        maxPoints: z.number().min(0, 'Điểm tối đa phải lớn hơn 0'),
        levels: z.array(z.object({
            name: z.string().min(1, 'Tên mức độ không được để trống'),
            points: z.number(),
            description: z.string().min(1, 'Mô tả không được để trống'),
        })).min(1, 'Mỗi tiêu chí phải có ít nhất 1 mức độ'),
    })).min(1, 'Rubric phải có ít nhất 1 tiêu chí'),
});

type RubricFormValues = z.infer<typeof rubricFormSchema>;

interface RubricFormProps {
    initialValues?: RubricFormValues;
    onSubmit: (data: RubricFormValues) => void;
    isLoading: boolean;
}

/**
 * Dynamic form component for creating/editing custom rubrics.
 * @param props - The props for the component.
 * @returns {JSX.Element} The rendered rubric form.
 */
export function RubricForm({ initialValues, onSubmit, isLoading }: RubricFormProps) {
    const { control, register, handleSubmit, formState: { errors }, reset } = useForm<RubricFormValues>({
        // resolver: zodResolver(rubricFormSchema),
        defaultValues: initialValues || {
            title: '',
            criteria: [{ name: '', detectorKey: '', maxPoints: 1, levels: [{ name: '', points: 0, description: '' }] }],
        },
    });

    useEffect(() => {
        if (initialValues) {
            reset(initialValues);
        }
    }, [initialValues, reset]);

    const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion } = useFieldArray({
        control,
        name: 'criteria',
    });
    
    // Placeholder submit handler
    const handleFormSubmit = (data: RubricFormValues) => {
        onSubmit(data);
    };

    return (
        <Paper p="lg" withBorder>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Stack gap="lg">
                    <Title order={2}>Tạo/Chỉnh sửa Rubric</Title>
                    <TextInput
                        label="Tên Rubric"
                        placeholder="Ví dụ: Rubric chấm bài cuối kỳ"
                        required
                        {...register('title')}
                        error={errors.title?.message}
                    />

                    <Title order={4} mt="md">Các Tiêu chí</Title>
                    <Stack gap="md">
                        {criteriaFields.map((criterion, criterionIndex) => (
                            <Paper key={criterion.id} withBorder p="md">
                                <Stack>
                                    <Group justify="space-between">
                                        <Title order={5}>Tiêu chí #{criterionIndex + 1}</Title>
                                        <ActionIcon color="red" onClick={() => removeCriterion(criterionIndex)}>
                                            <IconTrash />
                                        </ActionIcon>
                                    </Group>
                                    <TextInput
                                        label="Tên Tiêu chí"
                                        required
                                        {...register(`criteria.${criterionIndex}.name`)}
                                        error={errors.criteria?.[criterionIndex]?.name?.message}
                                    />
                                    <Controller
                                        name={`criteria.${criterionIndex}.detectorKey`}
                                        control={control}
                                        render={({ field }) => (
                                            <Select label="Detector Key" data={detectorKeyOptions} required {...field} error={errors.criteria?.[criterionIndex]?.detectorKey?.message}/>
                                        )}
                                    />
                                    <Controller
                                        name={`criteria.${criterionIndex}.maxPoints`}
                                        control={control}
                                        render={({ field }) => (
                                            <NumberInput label="Điểm tối đa" required {...field} error={errors.criteria?.[criterionIndex]?.maxPoints?.message}/>
                                        )}
                                    />
                                    
                                    <LevelsArray control={control} criterionIndex={criterionIndex} errors={errors} />

                                </Stack>
                            </Paper>
                        ))}
                    </Stack>

                    <Button leftSection={<IconPlus size={16} />} variant="outline" onClick={() => appendCriterion({ name: '', detectorKey: '', maxPoints: 1, levels: [{ name: '', points: 0, description: '' }] })}>
                        Thêm Tiêu chí
                    </Button>
                    
                    <Button type="submit" mt="xl" loading={isLoading}>Lưu Rubric</Button>
                </Stack>
            </form>
        </Paper>
    );
}

// Nested Field Array Component for Levels
function LevelsArray({ control, criterionIndex, errors }: any) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `criteria.${criterionIndex}.levels`,
    });

    return (
        <Stack gap="xs" mt="sm">
            <Title order={6}>Các Mức độ Đánh giá</Title>
            {fields.map((level, levelIndex) => (
                <Paper key={level.id} p="xs" withBorder radius="sm">
                    <Stack>
                         <Group justify="space-between">
                            <Text size="sm" fw={500}>Mức độ #{levelIndex + 1}</Text>
                            <ActionIcon size="xs" color="red" onClick={() => remove(levelIndex)}>
                                <IconTrash />
                            </ActionIcon>
                        </Group>
                        <Controller
                            name={`criteria.${criterionIndex}.levels.${levelIndex}.name`}
                            control={control}
                            render={({ field }) => (
                                <TextInput label="Tên mức độ" required {...field} error={errors.criteria?.[criterionIndex]?.levels?.[levelIndex]?.name?.message}/>
                            )}
                        />
                        <Controller
                            name={`criteria.${criterionIndex}.levels.${levelIndex}.points`}
                            control={control}
                            render={({ field }) => (
                                <NumberInput label="Điểm" required {...field} error={errors.criteria?.[criterionIndex]?.levels?.[levelIndex]?.points?.message}/>
                            )}
                        />
                        <Controller
                            name={`criteria.${criterionIndex}.levels.${levelIndex}.description`}
                            control={control}
                            render={({ field }) => (
                                <Textarea label="Mô tả" required {...field} error={errors.criteria?.[criterionIndex]?.levels?.[levelIndex]?.description?.message}/>
                            )}
                        />
                    </Stack>
                </Paper>
            ))}
             <Button size="xs" variant="light" leftSection={<IconPlus size={14}/>} onClick={() => append({ name: '', points: 0, description: '' })}>
                Thêm Mức độ
            </Button>
        </Stack>
    );
}
