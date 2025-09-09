/**
 * @file use-grade-custom.ts
 * @description Custom hook for grading files with custom rubrics
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import type { AxiosError } from 'axios';
import type { GradeResult } from '../schemas/grade.schema';
import type { CustomGradeApiRequest } from '../schemas/custom-rubric.schema';

interface UseGradeCustomProps {
  onSuccess?: (result: GradeResult) => void;
  onError?: (error: unknown) => void;
}

interface GradeCustomResponse {
  success: boolean;
  message: string;
  data: {
    gradeResult: GradeResult;
  };
}

export const useGradeCustom = ({ onSuccess, onError }: UseGradeCustomProps = {}) => {
  return useMutation({
    mutationFn: async (request: CustomGradeApiRequest) => {
      const response = await apiClient.post<GradeCustomResponse>('/api/grade/custom', request);
      return response.data;
    },
    
    onSuccess: (data) => {
      notifications.show({
        title: 'Thành công',
        message: data.message || 'Chấm điểm thành công',
        color: 'green',
      });
      
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