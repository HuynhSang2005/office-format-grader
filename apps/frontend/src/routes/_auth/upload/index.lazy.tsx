/**
 * @file index.lazy.tsx
 * @description Single file upload page with custom rubric support
 * @author Your Name
 */

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Container, 
  Group, 
  Alert,
  rem,
  Switch,
  Box,
  Tabs,
  Flex, // Add Flex import
  Badge // Add Badge import
} from '@mantine/core';
// import { notifications } from '@mantine/notifications';
import { IconUpload, IconAlertCircle, IconCheck, IconPackage, IconHistory } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { FileDropzone } from '../../../components/file/dropzone'
import { useUpload } from '../../../hooks/use-upload'
import { RubricSelector } from '../../../components/grade/rubric-selector'

export const Route = createLazyFileRoute('/_auth/upload/')({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useCustomRubric, setUseCustomRubric] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('single');
  const [gradeResults, setGradeResults] = useState<any[]>([]); // Add state for grade results
  const [uploading, setUploading] = useState(false);
  
  const { mutate: uploadFile, isPending: isUploadingSingle, isError, error } = useUpload({
    onSuccessRedirect: (fileId, hasGradeResult, gradeResultData) => {
      // For single file uploads with grade results, redirect to grade page
      if (hasGradeResult && activeTab === 'single' && files.length === 1) {
        window.location.href = `/grade/${fileId}`;
      } 
      // For batch uploads, show success message and provide link to history
      else if (hasGradeResult && activeTab === 'single' && files.length > 1) {
        setGradeResults(prev => [...prev, {
          ...gradeResultData,
          fileId: fileId
        }]);
      }
    }
  });
  
  // Handle unauthorized errors
  useEffect(() => {
    if (isError && error && typeof error === 'object' && 'message' in error) {
      if (error.message === 'UNAUTHORIZED') {
        navigate({ to: '/login' });
      }
    }
  }, [isError, error, navigate]);

  const handleDrop = (droppedFiles: File[]) => {
    // For single uploads, only allow pptx or docx files
    if (activeTab === 'single') {
      const validFiles = droppedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'pptx' || extension === 'docx';
      });
      
      if (validFiles.length !== droppedFiles.length) {
        setUploadError('Một số file không hợp lệ. Chỉ chấp nhận file .pptx hoặc .docx cho upload đơn lẻ');
      } else {
        setUploadError(null);
      }
      
      setFiles(validFiles);
    }
    
    // For batch uploads, only allow zip or rar files
    if (activeTab === 'batch') {
      const validFiles = droppedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'zip' || extension === 'rar';
      });
      
      if (validFiles.length !== droppedFiles.length) {
        setUploadError('Một số file không hợp lệ. Chỉ chấp nhận file .zip hoặc .rar cho upload hàng loạt');
      } else {
        setUploadError(null);
      }
      
      setFiles(validFiles);
    }
    
    setGradeResults([]); // Clear previous results
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setUploadError(null);
    setGradeResults([]); // Clear results
  };

  const handleRemoveAll = () => {
    setFiles([]);
    setUploadError(null);
    setGradeResults([]); // Clear results
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setUploadError('Vui lòng chọn ít nhất một file để upload');
      return;
    }
    
    setUploading(true);
    setGradeResults([]);
    
    // Prepare upload options
    const uploadOptions: { customRubricId?: string } = {};
    if (useCustomRubric && selectedRubricId) {
      uploadOptions.customRubricId = selectedRubricId;
    }
    
    // Upload files one by one
    for (const file of files) {
      try {
        // For batch uploads, limit file size (example: 50MB)
        if (activeTab === 'batch' && file.size > 50 * 1024 * 1024) {
          setUploadError('File vượt quá dung lượng tối đa 50MB');
          setUploading(false);
          return;
        }
        
        // Create a promise that wraps the upload mutation
        await new Promise<void>((resolve, reject) => {
          uploadFile(
            { file, options: uploadOptions },
            {
              onSuccess: () => resolve(),
              onError: (error) => reject(error)
            }
          );
        });
      } catch (error) {
        console.error('Upload failed for file:', file.name, error);
        // Continue with other files even if one fails
      }
    }
    
    setUploading(false);
    
    // If we're in single tab with multiple files, show a button to go to history
    if (activeTab === 'single' && files.length > 1) {
      // Results will be in gradeResults state
    }
  };

  return (
    <Container size="sm" py="xl">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="single" leftSection={<IconUpload size={14} />}>
            Upload đơn lẻ
          </Tabs.Tab>
          <Tabs.Tab value="batch" leftSection={<IconPackage size={14} />}>
            Upload hàng loạt
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="single">
          <Card withBorder shadow="sm" radius="md" p="xl">
            <Title order={2} mb="md" ta="center">Tải file lên</Title>
            <Text size="sm" c="dimmed" mb="xl" ta="center">
              Chọn file .pptx hoặc .docx để tải lên hệ thống
            </Text>
            
            <FileDropzone
              onDrop={handleDrop}
              onRemove={handleRemove}
              uploadedFiles={files}
              accept={['.pptx', '.docx']}
              multiple={true}
              mb="xl"
            />
            
            {uploadError && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                title="Lỗi tải lên" 
                color="red" 
                mb="xl"
              >
                {uploadError}
              </Alert>
            )}
            
            {files.length > 0 && (
              <Alert 
                icon={<IconCheck size={16} />} 
                title={`${files.length} file sẵn sàng`} 
                color="green" 
                mb="xl"
              >
                <Text size="sm">
                  {files.map((file, index) => (
                    <Text key={index} component="div">
                      <Text component="span" fw={500}>{file.name}</Text> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  ))}
                </Text>
              </Alert>
            )}
            
            {/* Display grade results if available */}
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
                    fileType={files[0]?.name.endsWith('.pptx') ? 'PPTX' : files[0]?.name.endsWith('.docx') ? 'DOCX' : undefined}
                  />
                </Box>
              )}
            </Card>
            
            <Group justify="center">
              <Button
                onClick={handleSubmit}
                disabled={files.length === 0 || uploading || isUploadingSingle}
                loading={uploading || isUploadingSingle}
                size="md"
                leftSection={<IconUpload size={rem(16)} />}
              >
                {uploading || isUploadingSingle ? 'Đang tải lên...' : 'Tải lên'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRemoveAll}
                disabled={files.length === 0}
                size="md"
              >
                Hủy bỏ
              </Button>
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="batch">
          <Card withBorder shadow="sm" radius="md" p="xl">
            <Group justify="center" mb="md">
              <IconPackage size={32} color="var(--mantine-color-blue-6)" />
            </Group>
            <Title order={2} mb="md" ta="center">Tải file hàng loạt</Title>
            <Text size="sm" c="dimmed" mb="xl" ta="center">
              Chọn file .zip hoặc .rar để tải lên hệ thống. Hệ thống sẽ tự động xử lý và chấm điểm.
            </Text>
            
            <FileDropzone
              onDrop={handleDrop}
              onRemove={handleRemove}
              uploadedFiles={files}
              accept={['.zip', '.rar']}
              multiple={true}
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
            
            {files.length > 0 && !uploadError && (
              <Alert 
                icon={<IconCheck size={16} />} 
                title={`${files.length} file sẵn sàng`} 
                color="green" 
                mb="xl"
              >
                <Text size="sm">
                  {files.map((file, index) => (
                    <Text key={index} component="div">
                      <Text component="span" fw={500}>{file.name}</Text> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  ))}
                </Text>
              </Alert>
            )}
            
            {/* For batch uploads, show button to view history after successful upload */}
            {activeTab === 'batch' && gradeResults.length > 0 && !uploading && (
              <Card withBorder p="lg" radius="md" mb="xl">
                <Flex justify="center">
                  <Button
                    onClick={() => navigate({ to: '/history' })}
                    leftSection={<IconHistory size={16} />}
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
                disabled={files.length === 0 || uploading || isUploadingSingle}
                loading={uploading || isUploadingSingle}
                size="md"
                leftSection={<IconUpload size={rem(16)} />}
              >
                {uploading || isUploadingSingle ? 'Đang xử lý...' : 'Tải lên và xử lý'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRemoveAll}
                disabled={files.length === 0}
                size="md"
              >
                Hủy bỏ
              </Button>
            </Group>
          </Card>
        </Tabs.Panel>
      </Tabs>
      
      <Card withBorder shadow="sm" radius="md" p="xl" mt="md">
        <Title order={3} mb="sm">Hướng dẫn</Title>
        <Text size="sm" c="dimmed">
          <Text component="span" fw={500}>Định dạng hỗ trợ:</Text> .pptx, .docx, .zip, .rar
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Dung lượng tối đa:</Text> 50 MB
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          <Text component="span" fw={500}>Thời gian xử lý:</Text> Tùy thuộc vào độ phức tạp của tài liệu
        </Text>
      </Card>
    </Container>
  );
}