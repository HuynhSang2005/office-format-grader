/**
 * @file use-ungraded-files.ts
 * @description TanStack Query hook for fetching ungraded files
 * @author Nguyễn Huỳnh Sang
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { apiClient } from '../lib/api-client'
import { 
  UngradedFilesResponseSchema,
  type UngradedFile
} from '../schemas/ungraded.schema'

/**
 * Fetch ungraded files
 * @param query - Query parameters for pagination
 * @returns Ungraded files data with pagination info
 */
const fetchUngradedFiles = async (query?: { limit?: number; offset?: number }): Promise<{
  files: UngradedFile[];
  total: number;
  limit: number;
  offset: number;
}> => {
  // Make API request with query parameters
  const response = await apiClient.get('/api/ungraded', {
    params: query
  })
  
  // Validate response with Zod
  const validatedResponse = UngradedFilesResponseSchema.parse(response.data)
  
  return validatedResponse.data
}

/**
 * Delete an ungraded file
 * @param fileId - The ID of the file to delete
 * @returns Promise that resolves when the file is deleted
 */
const deleteUngradedFile = async (fileId: string): Promise<void> => {
  await apiClient.delete(`/api/ungraded/${fileId}`)
}

/**
 * TanStack Query hook for fetching ungraded files
 * @param query - Query parameters for pagination
 * @returns Query result with ungraded files data
 */
export const useUngradedFiles = (query?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['ungraded-files', query],
    queryFn: () => fetchUngradedFiles(query)
  })
}

/**
 * TanStack Query hook for deleting an ungraded file
 * @returns Mutation result for deleting an ungraded file
 */
export const useDeleteUngradedFile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteUngradedFile,
    onSuccess: () => {
      // Invalidate and refetch ungraded files
      queryClient.invalidateQueries({ queryKey: ['ungraded-files'] })
      
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa file chưa chấm điểm',
        color: 'green',
      })
    },
    onError: (_error: unknown) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể xóa file chưa chấm điểm',
        color: 'red',
      })
    }
  })
}