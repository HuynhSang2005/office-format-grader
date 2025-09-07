/**
 * @file validate.lazy.tsx
 * @description Rubric validation page component
 * @author Your Name
 */

import { createLazyFileRoute } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Container, 
  Group, 
  Button,
  Box,
  Alert,
  FileButton,
  Code,
  List,
  ThemeIcon
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconUpload, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useValidateRubric } from '../../../hooks/use-criteria'

export const Route = createLazyFileRoute('/_auth/criteria/validate')({
  component: RubricValidatePage,
})

function RubricValidatePage() {
  const [file, setFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { mutate: validateRubric, isPending } = useValidateRubric()

  const handleFileChange = (file: File | null) => {
    setFile(file)
    setValidationResult(null)
    setError(null)
  }

  const handleValidate = () => {
    if (!file) {
      setError('Vui lòng chọn file rubric để kiểm tra')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const rubricData = JSON.parse(content)
        
        validateRubric(rubricData, {
          onSuccess: (data) => {
            setValidationResult(data)
            setError(null)
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi kiểm tra rubric')
            setValidationResult(null)
          }
        })
      } catch (err) {
        setError('Không thể đọc file JSON. Vui lòng kiểm tra lại định dạng.')
        setValidationResult(null)
      }
    }

    reader.readAsText(file)
  }

  const handleReset = () => {
    setFile(null)
    setValidationResult(null)
    setError(null)
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Kiểm tra rubric</Title>
      
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="md">Tải lên rubric để kiểm tra</Title>
        
        <Text size="sm" c="dimmed" mb="xl">
          Chọn file JSON chứa rubric để kiểm tra cấu trúc và tính hợp lệ
        </Text>
        
        <Group mb="xl">
          <FileButton 
            onChange={handleFileChange} 
            accept="application/json"
            disabled={isPending}
          >
            {(props) => (
              <Button 
                leftSection={<IconUpload size={16} />} 
                variant="outline"
                {...props}
              >
                Chọn file JSON
              </Button>
            )}
          </FileButton>
          
          {file && (
            <Button 
              variant="default" 
              onClick={handleReset}
              disabled={isPending}
            >
              Hủy bỏ
            </Button>
          )}
        </Group>
        
        {file && (
          <Alert 
            title="File đã chọn" 
            color="blue" 
            mb="xl"
          >
            <Text size="sm">
              <Text component="span" fw={500}>{file.name}</Text> ({(file.size / 1024).toFixed(2)} KB)
            </Text>
          </Alert>
        )}
        
        <Group>
          <Button
            onClick={handleValidate}
            disabled={!file || isPending}
            loading={isPending}
          >
            Kiểm tra rubric
          </Button>
        </Group>
      </Card>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Có lỗi xảy ra" 
          color="red"
          mb="xl"
        >
          {error}
        </Alert>
      )}
      
      {validationResult && (
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Title order={3}>Kết quả kiểm tra</Title>
            {validationResult.success ? (
              <ThemeIcon color="green" size="xl">
                <IconCheck size={20} />
              </ThemeIcon>
            ) : (
              <ThemeIcon color="red" size="xl">
                <IconX size={20} />
              </ThemeIcon>
            )}
          </Group>
          
          <Text mb="md">
            <Text component="span" fw={500}>Thông báo:</Text> {validationResult.message}
          </Text>
          
          {validationResult.data?.validation && (
            <Box>
              <Text fw={500} mb="sm">Chi tiết kiểm tra:</Text>
              
              {validationResult.data.validation.isValid ? (
                <Alert color="green">
                  Rubric hợp lệ và có thể sử dụng để chấm điểm
                </Alert>
              ) : (
                <Box>
                  <Alert color="red" mb="sm">
                    Rubric không hợp lệ. Vui lòng kiểm tra các lỗi sau:
                  </Alert>
                  
                  {validationResult.data.validation.errors && (
                    <List spacing="sm" mb="md">
                      {validationResult.data.validation.errors.map((error: string, index: number) => (
                        <List.Item key={index}>{error}</List.Item>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          )}
          
          {validationResult.data?.rubric && (
            <Box mt="md">
              <Text fw={500} mb="sm">Thông tin rubric:</Text>
              <Code block>
                {JSON.stringify(validationResult.data.rubric, null, 2)}
              </Code>
            </Box>
          )}
        </Card>
      )}
      
      <Card withBorder p="lg" radius="md" mt="md">
        <Title order={3} mb="sm">Hướng dẫn</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Định dạng file:</Text> Chỉ chấp nhận file .json chứa cấu trúc rubric hợp lệ
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Mục đích:</Text> Kiểm tra cấu trúc rubric trước khi sử dụng để chấm điểm
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Kết quả:</Text> Thông báo rubric có hợp lệ hay không và các lỗi nếu có
        </Text>
      </Card>
    </Container>
  )
}