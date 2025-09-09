/**
 * @file use-batch-grade.ts
 * @description Custom hook for batch grading files with default hard-coded rubric
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../lib/api-client';
import type { AxiosError } from 'axios';
import type { GradeResult } from '../schemas/grade.schema';

interface UseBatchGradeProps {
  onSuccess?: (results: GradeResult[]) => void;
  onError?: (error: unknown) => void;
}

interface BatchGradeRequest {
  files: string[];
  useHardRubric?: boolean;
  onlyCriteria?: string[];
}

interface BatchGradeResponse {
  success: boolean;
  message: string;
  data: {
    batchResult: {
      results: GradeResult[];
      errors: { fileId: string; error: string }[];
      summary: {
        total: number;
        success: number;
        failed: number;
      };
    };
    database: {
      saved: number;
      total: number;
    };
    fileCleanup: {
      originalFilesDeleted: boolean;
      reason: string;
    };
  };
}

export const useBatchGrade = ({ onSuccess, onError }: UseBatchGradeProps = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: BatchGradeRequest) => {
      const response = await apiClient.post<BatchGradeResponse>('/api/grade', request);
      return response.data;
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch ungraded files to update the list
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] });
      // Invalidate and refetch grade history to update the list
      queryClient.invalidateQueries({ queryKey: ['grade-history'] });
      
      const { results, errors, summary } = data.data.batchResult;
      
      // Show notification for overall result
      if (summary.failed === 0) {
        notifications.show({
          title: 'Thành công',
          message: `Chấm điểm thành công ${summary.success}/${summary.total} files`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Hoàn thành với lỗi',
          message: `Chấm điểm thành công ${summary.success}/${summary.total} files. ${summary.failed} files thất bại.`,
          color: 'yellow',
        });
      }
      
      // Show individual error notifications if any
      if (errors.length > 0) {
        errors.forEach(error => {
          notifications.show({
            title: 'Lỗi chấm điểm file',
            message: `File ID: ${error.fileId} - ${error.error}`,
            color: 'red',
          });
        });
      }
      
      if (onSuccess) {
        onSuccess(results);
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


