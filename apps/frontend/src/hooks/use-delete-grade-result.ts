/**
 * @file use-delete-grade-result.ts
 * @description Custom hook for deleting grade results
 * @author Your Name
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import type { AxiosError } from 'axios';

interface UseDeleteGradeResultProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useDeleteGradeResult = ({ onSuccess, onError }: UseDeleteGradeResultProps = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resultId: string) => {
      const response = await apiClient.delete(`/api/grade/${resultId}`);
      return response.data;
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch grade history to update the list
      queryClient.invalidateQueries({ queryKey: ['grade-history'] });
      
      notifications.show({
        title: 'Thành công',
        message: data.message || 'Xóa kết quả chấm điểm thành công',
        color: 'green',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    
    onError: (error: unknown) => {
      let errorMessage = 'Có lỗi xảy ra khi xóa kết quả chấm điểm';
      
      // Type guard for AxiosError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
          try {
            const errorData = axiosError.response.data as { message: string };
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
      
      if (onError) {
        onError(error);
      }
    },
  });
};