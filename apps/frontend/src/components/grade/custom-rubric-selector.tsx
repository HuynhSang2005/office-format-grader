/**
 * @file custom-rubric-selector.tsx
 * @description Component for selecting custom rubrics in grade flow
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
  Flex,
  Alert
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconList, IconPlus, IconChevronRight, IconAlertCircle } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useCustomRubric } from '../../hooks/use-custom-rubric'
import { useAuthStore } from '../../stores/auth.store'
import type { CustomRubricResponse } from '../../schemas/custom-rubric.schema'

interface CustomRubricSelectorProps {
  value: string | null;
  onChange: (rubricId: string | null) => void;
  fileType?: 'PPTX' | 'DOCX';
  disabled?: boolean;
}

export function CustomRubricSelectorComponent({ value, onChange, fileType, disabled }: CustomRubricSelectorProps) {
  const { user } = useAuthStore();
  const { rubrics, loading, error, loadRubrics } = useCustomRubric();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedRubric, setSelectedRubric] = useState<CustomRubricResponse | null>(null);

  // Load custom rubrics when component mounts
  useEffect(() => {
    if (user) {
      const loadPromise = loadRubrics();
      if (loadPromise) {
        loadPromise.catch((error) => {
          console.error('Failed to load rubrics:', error);
          notifications.show({
            title: 'Lỗi',
            message: 'Không thể tải danh sách rubric tùy chỉnh',
            color: 'red'
          });
        });
      }
    }
  }, [user, loadRubrics]);

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
    if (!disabled) {
      open();
    }
  };

  const handleCloseSelector = () => {
    close();
  };

  const handleConfirmSelection = () => {
    if (selectedRubric) {
      onChange(selectedRubric.id);
    } else {
      onChange(null);
    }
    close();
  };

  // Filter rubrics by file type if specified
  const filteredRubrics = fileType 
    ? rubrics.filter(rubric => 
        rubric.content?.criteria?.some(criterion => 
          criterion?.detectorKey?.toLowerCase().includes(fileType.toLowerCase())
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
                {selectedRubric.content?.criteria?.length ?? 0} tiêu chí | Tổng điểm: {selectedRubric.content?.totalPoints ?? 0}
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
          disabled={disabled}
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
          ) : error ? (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              title="Lỗi" 
              color="red"
            >
              {error}
            </Alert>
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
                              {rubric.content?.criteria?.length ?? 0} tiêu chí
                            </Badge>
                            <Badge variant="light" size="sm" color="green">
                              Tổng: {rubric.content?.totalPoints ?? 0} điểm
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