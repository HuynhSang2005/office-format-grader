/**
 * @file use-ungraded-files.ts
 * @description TanStack Query hook for fetching ungraded files
 * @author Your Name
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
 * @returns Ungraded files data
 */
const fetchUngradedFiles = async (): Promise<UngradedFile[]> => {
  // Make API request
  const response = await apiClient.get('/api/ungraded')
  
  // Validate response with Zod
  const validatedResponse = UngradedFilesResponseSchema.parse(response.data)
  
  return validatedResponse.data.files
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
 * @returns Query result with ungraded files data
 */
export const useUngradedFiles = () => {
  return useQuery({
    queryKey: ['ungraded-files'],
    queryFn: fetchUngradedFiles
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