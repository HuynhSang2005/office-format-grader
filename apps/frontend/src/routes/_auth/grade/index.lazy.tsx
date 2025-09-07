/**
 * @file index.lazy.tsx
 * @description Grade page for custom rubric selection and grading
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Flex,
  Box,
  Alert,
  Switch,
  Group,
  Button,
  TextInput
} from '@mantine/core'
import { IconAlertCircle, IconPlayerPlay } from '@tabler/icons-react'
import { useState } from 'react'
import { CustomRubricSelectorComponent as CustomRubricSelector } from '../../../components/grade/custom-rubric-selector'
import { useGradeFile } from '../../../hooks/use-grade-file' // Added import for regular grade hook
import { useGradeCustom } from '../../../hooks/use-grade-custom' // Kept import for custom grade hook
import { useAuthStore } from '../../../stores/auth.store'
import type { GradeResult } from '../../../schemas/grade.schema'
import type { ReactNode } from 'react'

export const Route = createLazyFileRoute('/_auth/grade/')({
  component: GradePage,
});

function GradePage() {
  const { user } = useAuthStore();
  const [useCustomRubric, setUseCustomRubric] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string>(''); // This would come from URL params or file selection
  
  // Use the appropriate hook based on whether custom rubric is selected
  const { mutate: gradeFileWithDefault, isPending: isGradingDefault } = useGradeFile({
    onSuccess: (result: GradeResult) => {
      // Redirect to grade result page
      window.location.href = `/grade/${result.fileId}`;
    }
  });
  
  const { mutate: gradeFileWithCustom, isPending: isGradingCustom } = useGradeCustom({
    onSuccess: (result: GradeResult) => {
      // Redirect to grade result page
      window.location.href = `/grade/${result.fileId}`;
    }
  });
  
  // Determine which hook to use based on state
  const isPending = useCustomRubric ? isGradingCustom : isGradingDefault;

  const handleGrade = () => {
    if (!fileId) {
      alert('Vui lòng chọn file để chấm điểm');
      return;
    }
    
    if (useCustomRubric) {
      if (!selectedRubricId) {
        alert('Vui lòng chọn rubric tùy chỉnh');
        return;
      }
      
      // Use custom grading
      gradeFileWithCustom({
        files: [fileId],
        rubricId: selectedRubricId
      });
    } else {
      // Use default hard-coded rubric grading
      gradeFileWithDefault({
        fileId: fileId
      });
    }
  };

  const renderError = (): ReactNode => {
    // Error handling would need to be updated to handle both hooks
    return null;
  };

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Yêu cầu đăng nhập" 
          color="yellow"
        >
          Vui lòng đăng nhập để sử dụng chức năng chấm điểm.
        </Alert>
      </Container>
    );
  }

  const errorMessage = renderError();

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xl">Chấm điểm file</Title>
      
      {errorMessage && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Lỗi" 
          color="red"
          mb="xl"
        >
          {errorMessage}
        </Alert>
      )}
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <Text fw={500}>File ID</Text>
          <TextInput 
            value={fileId} 
            onChange={(e) => setFileId(e.currentTarget.value)}
            placeholder="Nhập file ID"
            style={{ width: '300px' }}
          />
        </Flex>
      </Card>
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Sử dụng rubric tùy chỉnh</Text>
          <Switch
            checked={useCustomRubric}
            onChange={(event) => setUseCustomRubric(event.currentTarget.checked)}
          />
        </Group>
        
        {useCustomRubric && (
          <Box mt="md">
            <CustomRubricSelector 
              value={selectedRubricId} 
              onChange={setSelectedRubricId}
            />
          </Box>
        )}
      </Card>
      
      <Group justify="center">
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          onClick={handleGrade}
          disabled={!fileId || isPending}
          loading={isPending}
          size="md"
        >
          {isPending ? 'Đang chấm điểm...' : 'Bắt đầu chấm điểm'}
        </Button>
      </Group>
    </Container>
  );
}