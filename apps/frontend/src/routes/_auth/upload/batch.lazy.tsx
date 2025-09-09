/**
 * @file batch.lazy.tsx
 * @description Batch file upload page (.zip/.rar only) with custom rubric support
 * @author Nguyễn Huỳnh Sang
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Container, 
  Group, 
  Alert,
  Box,
  Switch,
  Flex,
  Badge,
  Progress
} from '@mantine/core'
import { IconUpload, IconAlertCircle, IconCheck, IconPackage, IconHistory } from '@tabler/icons-react'
import { useState } from 'react'
import { FileDropzone } from '../../../components/file/dropzone'
import { useUpload } from '../../../hooks/use-upload'
import { RubricSelector } from '../../../components/grade/rubric-selector'

export const Route = createLazyFileRoute('/_auth/upload/batch')({
  component: BatchUploadPage,
});

function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null); // Change to single file
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useCustomRubric, setUseCustomRubric] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gradeResults, setGradeResults] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // Add progress state
  const [isIndeterminate, setIsIndeterminate] = useState(false); // Add indeterminate state
  const navigate = useNavigate();
  
  const { mutate: uploadFile, isPending } = useUpload({
    onSuccessRedirect: () => {
      // Handle success redirect in the handleSubmit function instead
    }
  });

  const handleDrop = (droppedFiles: File[]) => {
    // Only accept 1 file for compressed file upload
    if (droppedFiles.length > 1) {
      setUploadError('Chỉ được upload 1 file nén (.zip hoặc .rar) tại một thời điểm.');
      setFile(null);
      return;
    }
    
    // Validate file extension - only zip or rar allowed
    const validFiles = droppedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'zip' || extension === 'rar';
    });
    
    if (validFiles.length !== droppedFiles.length) {
      setUploadError('File không hợp lệ. Chỉ chấp nhận file .zip hoặc .rar cho upload file nén.');
      setFile(null);
    } else {
      setUploadError(null);
      setFile(validFiles[0]); // Set single file
    }
    
    setGradeResults([]); // Clear previous results
  };

  const handleRemove = () => {
    setFile(null);
    setUploadError(null);
    setGradeResults([]); // Clear results
  };

  const handleSubmit = async () => {
    if (!file) {
      setUploadError('Vui lòng chọn 1 file .zip hoặc .rar để upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0); // Initialize progress
    setIsIndeterminate(true); // Start with indeterminate state
    setGradeResults([]);
    
    // Prepare upload options
    const uploadOptions: { customRubricId?: string } = {};
    if (useCustomRubric && selectedRubricId) {
      uploadOptions.customRubricId = selectedRubricId;
    }
    
    try {
      // Limit file size (example: 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File ${file.name} vượt quá dung lượng tối đa 50MB`);
        setUploading(false);
        setUploadProgress(null);
        setIsIndeterminate(false); // Reset indeterminate state
        return;
      }
      
      // Update progress
      setUploadProgress(50);
      setIsIndeterminate(false); // Switch to determinate state
      
      // Create a promise that wraps the upload mutation
      await new Promise<void>((resolve, reject) => {
        uploadFile(
          { file, options: uploadOptions },
          {
            onSuccess: (data) => {
              // Update progress to complete
              setUploadProgress(100);
              
              // Store successful results
              if (data?.data?.gradeResult) {
                setGradeResults([{
                  ...data.data.gradeResult,
                  filename: file.name,
                  fileId: data.data.fileId
                }])
              }
              resolve()
            },
            onError: (error) => {
              setUploadProgress(null);
              setIsIndeterminate(false); // Reset indeterminate state
              reject(error)
            }
          }
        )
      })
      
      // Navigate to history page after successful upload
      setTimeout(() => {
        navigate({ to: '/history' });
      }, 1000); // Small delay to show completion
    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      setUploadError(`Upload thất bại cho file ${file.name}. Vui lòng thử lại.`);
      setUploadProgress(null);
      setIsIndeterminate(false); // Reset indeterminate state
    }
    
    setUploading(false);
  };

  return (
    <Container size="sm" py="xl">
      <Card withBorder shadow="sm" radius="md" p="xl">
        <Group justify="center" mb="md">
          <IconPackage size={32} color="var(--mantine-color-blue-6)" />
        </Group>
        <Title order={2} mb="md" ta="center">Tải file nén</Title>
        <Text size="sm" c="dimmed" mb="xl" ta="center">
          Chọn 1 file .zip hoặc .rar để tải lên hệ thống. Hệ thống sẽ tự động xử lý và chấm điểm các file bên trong.
        </Text>
        
        <FileDropzone
          onDrop={handleDrop}
          onRemove={handleRemove}
          onRemoveAll={handleRemove}
          uploadedFiles={file ? [file] : []} // Convert single file to array for dropzone
          accept={['.zip', '.rar']}
          multiple={false}
          maxFiles={1}
          mb="xl"
        />
        
        {uploadError && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Lỗi" 
            color="red" 
            mb="xl"
          >
            {uploadError}
          </Alert>
        )}
        
        {/* Show progress bar during upload */}
        {uploading && (
          <Box>
            <Progress
              value={isIndeterminate ? 0 : (uploadProgress || 0)}
              color="blue"
              size="md"
              radius="xl"
              mb="xs"
              animated
              striped={isIndeterminate}
              transitionDuration={200}
            />
            <Text ta="center" size="sm" c="dimmed">
              {isIndeterminate 
                ? 'Đang khởi tạo...' 
                : uploadProgress !== null 
                  ? `${uploadProgress}%` 
                  : 'Đang xử lý file'}
              {' '} - {isIndeterminate ? 'Đang kết nối...' : 'Đang xử lý...'}
            </Text>
          </Box>
        )}
        
        {file && !uploadError && (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="File sẵn sàng" 
            color="green" 
            mb="xl"
          >
            <Text size="sm">
              <Text component="span" fw={500}>{file.name}</Text> ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          </Alert>
        )}
        
        {gradeResults.length > 0 && (
          <Card withBorder p="lg" radius="md" mb="xl">
            <Title order={3} mb="md">Kết quả chấm điểm</Title>
            {gradeResults.map((result, index) => (
              <Flex key={index} justify="space-between" align="center" mb="md">
                <Text size="sm">
                  File {index + 1}: {result?.filename || 'Unknown file'}
                </Text>
                <Badge 
                  color={result.percentage >= 80 ? 'green' : result.percentage >= 60 ? 'yellow' : 'red'}
                  size="sm"
                  radius="sm"
                >
                  {result.percentage.toFixed(1)}%
                </Badge>
              </Flex>
            ))}
            
            <Flex justify="center" mt="md">
              <Button
                leftSection={<IconHistory size={16} />}
                onClick={() => navigate({ to: '/history' })}
              >
                Xem lịch sử chấm điểm
              </Button>
            </Flex>
          </Card>
        )}
        
        {/* Custom Rubric Selection */}
        <Card withBorder p="md" radius="md" mb="xl">
          <Group justify="space-between" mb="md">
            <Text fw={500}>Sử dụng rubric tùy chỉnh</Text>
            <Switch
              checked={useCustomRubric}
              onChange={(event) => setUseCustomRubric(event.currentTarget.checked)}
            />
          </Group>
          
          {useCustomRubric && (
            <Box mt="md">
              <RubricSelector 
                value={selectedRubricId} 
                onChange={setSelectedRubricId}
                fileType="PPTX" // Default to PPTX for batch uploads
              />
            </Box>
          )}
        </Card>
        
        <Group justify="center">
          <Button
            onClick={handleSubmit}
            disabled={!file || uploading || isPending}
            loading={uploading || isPending}
            size="md"
            leftSection={<IconUpload size={16} />}
            variant="filled"
            color="blue"
            radius="md"
            styles={{
              root: {
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }
              }
            }}
          >
            {uploading || isPending ? 'Đang xử lý...' : 'Tải lên và xử lý'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={!file}
            size="md"
            color="gray"
            radius="md"
            styles={{
              root: {
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }
              }
            }}
          >
            Hủy bỏ
          </Button>
        </Group>
      </Card>
      
      <Card withBorder shadow="sm" radius="md" p="xl" mt="md">
        <Title order={3} mb="sm">Hướng dẫn upload file nén</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Định dạng hỗ trợ:</Text> .zip, .rar
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Dung lượng tối đa:</Text> 50 MB
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Quy trình xử lý:</Text> Hệ thống sẽ tự động giải nén và chấm điểm từng file bên trong
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Thời gian xử lý:</Text> Tùy thuộc vào số lượng và độ phức tạp của tài liệu
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Lưu ý:</Text> File nén phải chứa ít nhất một tài liệu Office (.docx hoặc .pptx)
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Cấu trúc file hợp lệ:</Text> File .zip hoặc .rar chứa các file .docx hoặc .pptx. Hệ thống sẽ tự động tìm và xử lý các file Office bên trong archive.
        </Text>
      </Card>
    </Container>
  );
}