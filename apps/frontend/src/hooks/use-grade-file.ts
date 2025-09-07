/**
 * @file use-grade-file.ts
 * @description Custom hook for grading files with default hard-coded rubric
 * @author Your Name
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import type { AxiosError } from 'axios';
import type { GradeResult } from '../schemas/grade.schema';

interface UseGradeFileProps {
  onSuccess?: (result: GradeResult) => void;
  onError?: (error: unknown) => void;
  redirectToGradePage?: boolean;
}

interface GradeFileRequest {
  fileId: string;
  useHardRubric?: boolean;
  onlyCriteria?: string[];
}

interface GradeFileResponse {
  success: boolean;
  message: string;
  data: {
    gradeResult: GradeResult;
    database: {
      saved: boolean;
      dbId: string;
    };
  };
}

export const useGradeFile = ({ onSuccess, onError, redirectToGradePage = false }: UseGradeFileProps = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: GradeFileRequest) => {
      const response = await apiClient.post<GradeFileResponse>('/api/grade', request);
      return response.data;
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch ungraded files to update the list
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] });
      // Invalidate and refetch grade history to update the list
      queryClient.invalidateQueries({ queryKey: ['grade-history'] });
      
      notifications.show({
        title: 'Thành công',
        message: data.message || 'Chấm điểm thành công',
        color: 'green',
      });
      
      // Redirect to grade result page if requested
      if (redirectToGradePage) {
        const dbId = data.data.database.dbId;
        if (dbId) {
          window.location.href = `/grade/${dbId}`;
        }
      }
      
      if (onSuccess) {
        onSuccess(data.data.gradeResult);
      }
    },
    
    onError: (error: unknown) => {
      let errorMessage = 'Có lỗi xảy ra khi chấm điểm';
      
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