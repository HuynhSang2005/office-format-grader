/**
 * @file use-batch-upload.ts
 * @description Custom hook for batch file upload functionality with custom rubric support and automatic grading
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import { type UploadResponse, UploadResponseSchema, type UploadErrorResponse } from '../schemas/upload.schema';
import type { AxiosError } from 'axios';
import { useGradeFile } from './use-grade-file';

interface UseBatchUploadProps {
  onSuccess?: (results: UploadResponse[]) => void;
  onError?: (error: unknown) => void;
  customRubricId?: string | null;
}

export const useBatchUpload = ({ onSuccess, onError, customRubricId }: UseBatchUploadProps = {}) => {
  const queryClient = useQueryClient();
  const gradeFileMutation = useGradeFile({ redirectToGradePage: false }); // Don't redirect automatically
  
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: UploadResponse[] = [];
      
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          // Add custom rubric ID to the request if provided
          if (customRubricId) {
            formData.append('customRubricId', customRubricId);
          }

          const response = await apiClient.post<UploadResponse>('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Parse and validate response with Zod
          const parsedResponse = UploadResponseSchema.parse(response.data);
          results.push(parsedResponse);
        } catch (error) {
          // If one file fails, continue with others but track the error
          console.error(`Upload failed for file: ${file.name}`, error);
          throw error;
        }
      }
      
      return results;
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch ungraded files to update the list
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] });
      // Invalidate and refetch grade history to update the list
      queryClient.invalidateQueries({ queryKey: ['grade-history'] });
      
      // Count files that need automatic grading
      const filesNeedingGrading = data.filter(result => 
        result.data?.fileId && 
        !(result.data && 'gradeResult' in result.data && result.data.gradeResult !== undefined)
      );
      
      // Show success notification
      const gradedCount = data.length - filesNeedingGrading.length;
      const totalFiles = data.length;
      
      if (gradedCount === totalFiles) {
        notifications.show({
          title: 'Thành công',
          message: `Đã tải lên và chấm điểm tự động ${totalFiles} file thành công`,
          color: 'green',
        });
      } else if (gradedCount > 0) {
        notifications.show({
          title: 'Đang xử lý',
          message: `Đã tải lên ${totalFiles} file. ${gradedCount} file đã được chấm điểm tự động, ${filesNeedingGrading.length} file đang được chấm điểm...`,
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Đang xử lý',
          message: `Đã tải lên ${totalFiles} file và đang chấm điểm tự động...`,
          color: 'blue',
        });
      }
      
      // Automatically grade files that weren't graded automatically
      if (filesNeedingGrading.length > 0) {
        filesNeedingGrading.forEach(result => {
          if (result.data?.fileId) {
            gradeFileMutation.mutate({
              fileId: result.data.fileId
            });
          }
        });
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    
    onError: (error: unknown) => {
      // Extract error message from backend if available
      let errorMessage = 'Có lỗi xảy ra khi tải file lên';
      
      // Type guard for AxiosError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
          try {
            // Check if it's an unauthorized error
            if (axiosError.response.status === 401) {
              errorMessage = 'Bạn cần đăng nhập để upload file';
            } else {
              const errorData = axiosError.response.data as UploadErrorResponse;
              if (errorData.message) {
                errorMessage = errorData.message;
              }
            }
          } catch (_e) {
            // If parsing fails, use default message
          }
        }
      }
      
      notifications.show({
        title: 'Lỗi',
        message: errorMessage,
        color: 'red',
      });
      
      if (onError) {
        onError(error);
      }
    },
  });
};