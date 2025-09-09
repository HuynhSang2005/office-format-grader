/**
 * @file use-upload.ts
 * @description Custom hook for file upload functionality with custom rubric support and automatic grading
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import { type UploadResponse, UploadResponseSchema, type UploadErrorResponse } from '../schemas/upload.schema';
import type { AxiosError } from 'axios';
import { useGradeFile } from './use-grade-file';

interface UseUploadProps {
  onSuccessRedirect?: (fileId: string, hasGradeResult: boolean, gradeResult?: any) => void;
  customRubricId?: string | null;
}

interface UploadFileOptions {
  customRubricId?: string | null;
}

export const useUpload = ({ onSuccessRedirect, customRubricId: defaultCustomRubricId }: UseUploadProps = {}) => {
  const queryClient = useQueryClient();
  const gradeFileMutation = useGradeFile({ redirectToGradePage: false }); // Don't redirect automatically
  
  return useMutation({
    mutationFn: async (variables: { file: File, options?: UploadFileOptions }) => {
      const { file, options } = variables;
      const formData = new FormData();
      formData.append('file', file);

      // Use the customRubricId from options if provided, otherwise use the default
      const rubricId = options?.customRubricId || defaultCustomRubricId;
      
      // Add custom rubric ID to the request if provided
      if (rubricId) {
        formData.append('customRubricId', rubricId);
      }

      const response = await apiClient.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Parse and validate response with Zod
      const parsedResponse = UploadResponseSchema.parse(response.data);
      return parsedResponse;
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch ungraded files to update the list
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] });
      // Invalidate and refetch grade history to update the list
      queryClient.invalidateQueries({ queryKey: ['grade-history'] });
      
      // Check if automatic grading was performed by checking if gradeResult exists
      const hasGradeResult = data.data && 'gradeResult' in data.data && data.data.gradeResult !== undefined;
      
      // Check if the uploaded file is an archive
      const isArchiveFile = data.data?.fileType === 'ZIP' || data.data?.fileType === 'RAR';
      
      if (hasGradeResult) {
        notifications.show({
          title: 'Thành công',
          message: isArchiveFile 
            ? 'File nén đã được xử lý và chấm điểm tự động' 
            : 'File đã được tải lên và chấm điểm tự động',
          color: 'green',
        });
      } else {
        // Automatically grade the file if it wasn't graded automatically
        if (data.data?.fileId) {
          // Show notification that file is being graded
          notifications.show({
            title: 'Đang xử lý',
            message: isArchiveFile
              ? 'File nén đang được xử lý và chấm điểm...'
              : 'File đang được chấm điểm...',
            color: 'blue',
          });
          
          // Automatically grade the file using the hook instead of direct API call
          gradeFileMutation.mutate({
            fileId: data.data.fileId
          });
        } else {
          notifications.show({
            title: 'Thành công',
            message: data.message || 'File đã được tải lên thành công',
            color: 'green',
          });
        }
      }
      
      // Redirect based on whether grading was performed
      if (onSuccessRedirect && data.data?.fileId) {
        onSuccessRedirect(data.data.fileId, hasGradeResult, data.data.gradeResult);
      }
      // Don't automatically redirect here, let the calling component handle navigation
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
    },
  });
};