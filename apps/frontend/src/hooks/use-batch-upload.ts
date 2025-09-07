/**
 * @file use-batch-upload.ts
 * @description Custom hook for batch file upload functionality with custom rubric support and automatic grading
 * @author Your Name
 */

import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import { type UploadResponse, UploadResponseSchema, type UploadErrorResponse } from '../schemas/upload.schema';
import type { AxiosError } from 'axios';

interface UseBatchUploadProps {
  onSuccessRedirect?: (fileId: string) => void;
  customRubricId?: string | null;
}

export const useBatchUpload = ({ onSuccessRedirect, customRubricId }: UseBatchUploadProps = {}) => {
  return useMutation({
    mutationFn: async (file: File) => {
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
      return parsedResponse;
    },
    
    onSuccess: (data) => {
      // Check if automatic grading was performed
      if (data.message.includes('chấm điểm hoàn thành') && data.data.gradeResult) {
        notifications.show({
          title: 'Thành công',
          message: 'File đã được tải lên và chấm điểm tự động',
          color: 'green',
        });
        
        // Redirect to grade result page if grade result is available
        if (onSuccessRedirect && data.data.fileId) {
          onSuccessRedirect(data.data.fileId);
        }
      } else {
        notifications.show({
          title: 'Thành công',
          message: data.message || 'File đã được tải lên thành công',
          color: 'green',
        });
        
        // For files without automatic grading, don't redirect immediately
        // The user needs to manually go to the grade page to process the file
        // Show a notification instead of redirecting
        notifications.show({
          title: 'Thông báo',
          message: 'File đã được tải lên. Vui lòng đi đến trang "File chưa chấm" để xử lý file.',
          color: 'blue',
        });
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
            const errorData = axiosError.response.data as UploadErrorResponse;
            if (errorData.message) {
              errorMessage = errorData.message;
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