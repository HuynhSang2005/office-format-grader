/**
 * @file index.lazy.tsx
 * @description Single file upload page with custom rubric support
 * @author Nguyễn Huỳnh Sang
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
  Switch,
  Box,
  Tabs,
  Flex,
  Badge,
  Progress
} from '@mantine/core';
// import { notifications } from '@mantine/notifications';
import { IconUpload, IconAlertCircle, IconCheck, IconPackage, IconHistory } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { FileDropzone } from '../../../components/file/dropzone'
import { useUpload } from '../../../hooks/use-upload'
import { useBatchUpload } from '../../../hooks/use-batch-upload'
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // Add progress state
  const [isIndeterminate, setIsIndeterminate] = useState(false); // Add indeterminate state
  
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
      // For batch uploads, redirect to history page after completion
      else if (activeTab === 'batch' && hasGradeResult) {
        // Navigate to history page after successful batch upload
        navigate({ to: '/history' });
      }
    }
  });
  
  const { mutate: batchUpload } = useBatchUpload({
    onSuccess: (results) => {
      // Handle batch upload success
      const gradedResults = results
        .filter(result => result.data?.gradeResult)
        .map(result => ({
          ...result.data!.gradeResult,
          filename: result.data!.originalName
        }));
      
      setGradeResults(gradedResults);
      setUploading(false);
      setUploadProgress(null);
      setIsIndeterminate(false); // Reset indeterminate state
      
      // Navigate to history page after successful batch upload
      if (gradedResults.length > 0) {
        setTimeout(() => {
          navigate({ to: '/history' });
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Batch upload failed:', error);
      setUploadError('Có lỗi xảy ra khi tải lên hàng loạt file');
      setUploading(false);
      setUploadProgress(null);
      setIsIndeterminate(false); // Reset indeterminate state
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
    // For single uploads, only allow one pptx or docx file
    if (activeTab === 'single') {
      // Filter valid files
      const validFiles = droppedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'pptx' || extension === 'docx';
      });
      
      // For single tab, limit to 1 file
      if (validFiles.length > 1) {
        setUploadError('Chỉ được upload 1 file cho upload đơn lẻ. Vui lòng sử dụng "Upload hàng loạt" cho nhiều file.');
        setFiles([]);
        return;
      }
      
      if (validFiles.length !== droppedFiles.length) {
        setUploadError('File không hợp lệ. Chỉ chấp nhận file .pptx hoặc .docx cho upload đơn lẻ');
        setFiles(validFiles);
      } else {
        setUploadError(null);
        setFiles(validFiles);
      }
    }
    
    // For batch uploads, allow multiple files but with restrictions
    if (activeTab === 'batch') {
      // Limit to maximum 60 files
      if (droppedFiles.length > 60) {
        setUploadError('Chỉ được upload tối đa 60 file trong một lần. Vui lòng chia nhỏ file nếu cần.');
        setFiles([]);
        return;
      }
      
      // Filter valid files (pptx, docx, zip, rar)
      const validFiles = droppedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'pptx' || extension === 'docx' || extension === 'zip' || extension === 'rar';
      });
      
      if (validFiles.length !== droppedFiles.length) {
        setUploadError('Một số file không hợp lệ. Chỉ chấp nhận file .pptx, .docx, .zip hoặc .rar cho upload hàng loạt');
      } else {
        setUploadError(null);
      }
      
      setFiles(validFiles);
    }
    
    setGradeResults([]); // Clear previous results
  };

  const handleRemove = (index?: number) => {
    if (index !== undefined) {
      // Remove specific file
      setFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      // Remove all files
      setFiles([])
    }
    setUploadError(null)
  }

  const handleRemoveAll = () => {
    setFiles([])
    setUploadError(null)
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setUploadError('Vui lòng chọn ít nhất một file để upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setIsIndeterminate(true); // Start with indeterminate state
    setGradeResults([]);
    
    // Prepare upload options
    const uploadOptions: { customRubricId?: string } = {};
    if (useCustomRubric && selectedRubricId) {
      uploadOptions.customRubricId = selectedRubricId;
    }
    
    // Use different upload methods based on active tab
    if (activeTab === 'batch' && files.length > 1) {
      // For batch uploads with multiple files, use batch upload hook
      batchUpload(files);
    } else {
      // For single uploads or batch with single file, use regular upload
      // Upload files one by one with proper error handling and progress tracking
      const results = [];
      let completedFiles = 0;
      let hasErrors = false;
      
      for (const file of files) {
        try {
          // For batch uploads, limit file size (example: 50MB)
          if (activeTab === 'batch' && file.size > 50 * 1024 * 1024) {
            setUploadError(`File ${file.name} vượt quá dung lượng tối đa 50MB`);
            hasErrors = true;
            continue; // Continue with other files
          }
          
          // Update progress
          const progress = Math.round((completedFiles / files.length) * 100);
          setUploadProgress(progress);
          setIsIndeterminate(false); // Switch to determinate state
          
          // Create a promise that wraps the upload mutation
          const result = await new Promise<any>((resolve, reject) => {
            uploadFile(
              { file, options: uploadOptions },
              {
                onSuccess: (data) => resolve(data),
                onError: (error) => reject(error)
              }
            );
          });
          
          completedFiles++;
          const newProgress = Math.round((completedFiles / files.length) * 100);
          setUploadProgress(newProgress);
          
          // Store successful results
          if (result?.data?.gradeResult) {
            results.push({
              ...result.data.gradeResult,
              filename: file.name
            });
          }
        } catch (error) {
          console.error('Upload failed for file:', file.name, error);
          // Continue with other files even if one fails
          setUploadError(`Upload thất bại cho file ${file.name}. Vui lòng thử lại.`);
          hasErrors = true;
        }
      }
      
      setGradeResults(results);
      setUploading(false);
      setUploadProgress(null); // Reset progress after completion
      setIsIndeterminate(false); // Reset indeterminate state
      
      // If we're in single tab with multiple files, show a button to go to history
      if (activeTab === 'single' && files.length > 1) {
        // Results will be in gradeResults state
      }
      
      // For batch uploads, navigate to history page after completion
      if (activeTab === 'batch' && (results.length > 0 || !hasErrors)) {
        // Navigate to history page after successful batch upload
        setTimeout(() => {
          if (results.length > 0) {
            navigate({ to: '/history' });
          }
        }, 1000); // Small delay to show completion
      }
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
              Chọn 1 file .pptx hoặc .docx để tải lên hệ thống
            </Text>
            
            <FileDropzone
              onDrop={handleDrop}
              onRemove={handleRemove}
              onRemoveAll={handleRemoveAll}
              uploadedFiles={files}
              accept={['.pptx', '.docx']}
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
                      : 'Đang tải lên file'}
                  {' '} - {isIndeterminate ? 'Đang kết nối...' : 'Đang tải lên...'}
                </Text>
              </Box>
            )}
            
            {files.length > 0 && (
              <Alert 
                icon={<IconCheck size={16} />} 
                title={`${files.length} file sẵn sàng`} 
                color="green" 
                mb="xl"
              >
                <Text size="sm">
                  {files.map((file) => (
                    <Text key={file.name} component="div">
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
                {uploading || isUploadingSingle ? 'Đang tải lên...' : 'Tải lên'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRemoveAll}
                disabled={files.length === 0}
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
        </Tabs.Panel>

        <Tabs.Panel value="batch">
          <Card withBorder shadow="sm" radius="md" p="xl">
            <Group justify="center" mb="md">
              <IconPackage size={32} color="var(--mantine-color-blue-6)" />
            </Group>
            <Title order={2} mb="md" ta="center">Tải file hàng loạt</Title>
            <Text size="sm" c="dimmed" mb="xl" ta="center">
              Chọn các file .pptx hoặc .docx để tải lên hệ thống. Hệ thống sẽ tự động xử lý và chấm điểm.
            </Text>
            
            <FileDropzone
              onDrop={handleDrop}
              onRemove={handleRemove}
              onRemoveAll={handleRemoveAll}
              uploadedFiles={files}
              accept={['.pptx', '.docx']}
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
                      : 'Đang tải lên file'}
                  {' '} - {isIndeterminate ? 'Đang kết nối...' : 'Đang tải lên...'}
                </Text>
              </Box>
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
                leftSection={<IconUpload size={16} />}
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
          <Text component="span" fw={500}>Định dạng hỗ trợ:</Text> .pptx và .docx
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