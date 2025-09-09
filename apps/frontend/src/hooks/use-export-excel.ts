/**
 * @file use-export-excel.ts
 * @description Custom hook for exporting grade results to Excel
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { apiClient } from '../lib/api-client'
import { 
  ExportRequestSchema, 
  type ExportRequest,
  type ExportErrorResponse
} from '../schemas/export.schema'
import type { AxiosError } from 'axios'

interface UseExportExcelProps {
  onSuccess?: () => void
}

export const useExportExcel = ({ onSuccess }: UseExportExcelProps = {}) => {
  return useMutation({
    mutationFn: async (data: ExportRequest) => {
      // Validate the request data with Zod
      const validatedData = ExportRequestSchema.parse(data)
      
      // Make the API request
      const response = await apiClient.post<ArrayBuffer>(
        '/api/export',
        validatedData,
        {
          responseType: 'arraybuffer' // Important for downloading files
        }
      )
      
      // Get filename from response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `grade-results-${Date.now()}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a download link for the blob
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return response.data
    },
    
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Đã export kết quả thành công',
        color: 'green',
      })
      
      // Call the onSuccess callback if provided
      onSuccess?.()
    },
    
    onError: (error: unknown) => {
      // Extract error message from backend if available
      let errorMessage = 'Có lỗi xảy ra khi export file'
      
      // Type guard for AxiosError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError
        if (axiosError.response?.data) {
          try {
            // Try to parse the error response
            const errorData = axiosError.response.data as ExportErrorResponse
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (_e) {
            // If parsing fails, use default message
            // Also check if it's a plain text error response
            if (axiosError.response.data instanceof ArrayBuffer) {
              const decoder = new TextDecoder('utf-8')
              const text = decoder.decode(axiosError.response.data)
              try {
                const parsed = JSON.parse(text)
                if (parsed.error) {
                  errorMessage = parsed.error
                }
              } catch (_e2) {
                // If still can't parse, use the text as is
                errorMessage = text || errorMessage
              }
            }
          }
        }
      }
      
      notifications.show({
        title: 'Lỗi',
        message: errorMessage,
        color: 'red',
      })
    },
  })
}