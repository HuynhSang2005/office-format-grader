/**
 * @file rubric-selector.tsx
 * @description Component for selecting custom rubrics during file upload
 * @author Your Name
 */

import { 
  Group, 
  Text, 
  Badge, 
  Box, 
  Button,
  Modal,
  Stack,
  ScrollArea,
  Card,
  Flex
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconList, IconPlus, IconChevronRight } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useRubrics } from '../../hooks/use-rubric'
import { useAuthStore } from '../../stores/auth.store'
import type { CustomRubricResponse } from '../../schemas/custom-rubric.schema'

interface RubricSelectorProps {
  value: string | null;
  onChange: (rubricId: string | null) => void;
  fileType?: 'PPTX' | 'DOCX';
}

export function RubricSelector({ value, onChange, fileType }: RubricSelectorProps) {
  const { user } = useAuthStore();
  const { data: rubricsData, isLoading: loading } = useRubrics(user?.id?.toString());
  const rubrics = rubricsData?.data || [];
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedRubric, setSelectedRubric] = useState<CustomRubricResponse | null>(null);

  // Find the selected rubric by ID
  useEffect(() => {
    if (value && rubrics.length > 0) {
      const rubric = rubrics.find(r => r.id === value);
      setSelectedRubric(rubric || null);
    } else {
      setSelectedRubric(null);
    }
  }, [value, rubrics]);

  const handleOpenSelector = () => {
    open();
  };

  const handleCloseSelector = () => {
    close();
  };

  const handleConfirmSelection = () => {
    if (selectedRubric) {
      onChange(selectedRubric.id);
    }
    close();
  };

  // Filter rubrics by file type if specified
  const filteredRubrics = fileType 
    ? rubrics.filter(rubric => 
        rubric.content?.criteria?.some(criterion => 
          criterion.detectorKey.includes(fileType.toLowerCase()) || 
          criterion.detectorKey.includes(fileType)
        )
      )
    : rubrics;

  return (
    <>
      <Group justify="space-between" align="center">
        <Box>
          <Text size="sm" fw={500} mb={4}>Chọn rubric tùy chỉnh</Text>
          {selectedRubric ? (
            <Group>
              <Badge color="blue" variant="light">
                {selectedRubric.name}
              </Badge>
              <Text size="sm" c="dimmed">
                {selectedRubric.content?.criteria?.length} tiêu chí | Tổng điểm: {selectedRubric.content?.totalPoints}
              </Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">Chưa chọn rubric</Text>
          )}
        </Box>
        <Button 
          variant="outline" 
          size="xs" 
          onClick={handleOpenSelector}
          leftSection={<IconList size={14} />}
        >
          Chọn rubric
        </Button>
      </Group>

      <Modal 
        opened={opened} 
        onClose={handleCloseSelector} 
        title="Chọn rubric tùy chỉnh" 
        size="lg"
        centered
      >
        <Stack gap="md">
          {loading ? (
            <Text>Đang tải rubrics...</Text>
          ) : filteredRubrics.length === 0 ? (
            <Box ta="center" py="xl">
              <Text c="dimmed" mb="md">Bạn chưa có rubric tùy chỉnh nào</Text>
              <Button 
                component="a" 
                href="/rubric/builder"
                variant="light"
                leftSection={<IconPlus size={16} />}
              >
                Tạo rubric mới
              </Button>
            </Box>
          ) : (
            <>
              <ScrollArea h={300}>
                <Stack gap="sm">
                  {filteredRubrics.map((rubric) => (
                    <Card
                      key={rubric.id}
                      withBorder
                      radius="md"
                      p="md"
                      onClick={() => setSelectedRubric(rubric)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedRubric?.id === rubric.id 
                          ? 'var(--mantine-color-blue-light)' 
                          : undefined
                      }}
                    >
                      <Flex justify="space-between" align="center">
                        <Box>
                          <Text fw={500}>{rubric.name}</Text>
                          <Group mt={4}>
                            <Badge variant="light" size="sm">
                              {rubric.content?.criteria?.length} tiêu chí
                            </Badge>
                            <Badge variant="light" size="sm" color="green">
                              Tổng: {rubric.content?.totalPoints} điểm
                            </Badge>
                          </Group>
                        </Box>
                        <IconChevronRight size={16} />
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
              
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseSelector}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={!selectedRubric}
                >
                  Chọn
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}