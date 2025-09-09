/**
 * @file use-rubric.ts
 * @description Custom hook for managing custom rubrics
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth.store'
import { apiClient } from '../lib/api-client'
import { 
  CreateCustomRubricSchema,
  UpdateCustomRubricSchema,
  type CreateCustomRubricRequest,
  type UpdateCustomRubricRequest,
  type ListCustomRubricsResponse,
  type CreateCustomRubricResponse,
  type UpdateCustomRubricResponse,
  type DeleteCustomRubricResponse,
  type GetCustomRubricResponse
} from '../schemas/custom-rubric.schema'
import { notifications } from '@mantine/notifications'

/**
 * Create a new custom rubric
 * @param data - The rubric data to create
 * @param onSuccess - Callback function to execute on success
 * @returns Mutation result for creating a rubric
 */
export const useCreateRubric = (onSuccess?: () => void) => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: CreateCustomRubricRequest) => {
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Validate data with Zod before sending
      const validatedData = CreateCustomRubricSchema.parse(data)
      
      const response = await apiClient.post<CreateCustomRubricResponse>(
        '/api/custom-rubrics',
        validatedData
      )
      
      return response.data
    },
    onSuccess: (_data) => {
      // Invalidate and refetch rubrics list
      queryClient.invalidateQueries({ queryKey: ['rubrics'] })
      if (onSuccess) onSuccess()
      notifications.show({
        title: 'Thành công',
        message: 'Rubric đã được tạo thành công',
        color: 'green'
      })
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi tạo rubric',
        color: 'red'
      })
    }
  })
}

/**
 * Update an existing custom rubric
 * @param id - The ID of the rubric to update
 * @param data - The rubric data to update
 * @param onSuccess - Callback function to execute on success
 * @returns Mutation result for updating a rubric
 */
export const useUpdateRubric = (id: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (data: UpdateCustomRubricRequest) => {
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Validate data with Zod before sending
      const validatedData = UpdateCustomRubricSchema.parse(data)
      
      const response = await apiClient.put<UpdateCustomRubricResponse>(
        `/api/custom-rubrics/${id}`,
        validatedData
      )
      
      return response.data
    },
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch rubrics list and current rubric
      queryClient.invalidateQueries({ queryKey: ['rubrics'] })
      queryClient.invalidateQueries({ queryKey: ['rubric', id] })
      if (onSuccess) onSuccess()
      notifications.show({
        title: 'Thành công',
        message: 'Rubric đã được cập nhật thành công',
        color: 'green'
      })
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi cập nhật rubric',
        color: 'red'
      })
    }
  })
}

/**
 * Delete a custom rubric
 * @param id - The ID of the rubric to delete
 * @param onSuccess - Callback function to execute on success
 * @returns Mutation result for deleting a rubric
 */
export const useDeleteRubric = (onSuccess?: () => void) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<DeleteCustomRubricResponse>(
        `/api/custom-rubrics/${id}`
      )
      
      return response.data
    },
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch rubrics list
      queryClient.invalidateQueries({ queryKey: ['rubrics'] })
      if (onSuccess) onSuccess()
      notifications.show({
        title: 'Thành công',
        message: 'Rubric đã được xóa thành công',
        color: 'green'
      })
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi xóa rubric',
        color: 'red'
      })
    }
  })
}

/**
 * Get a specific custom rubric by ID
 * @param id - The ID of the rubric to fetch
 * @returns Query result for fetching a rubric
 */
export const useRubric = (id: string) => {
  return useQuery({
    queryKey: ['rubric', id],
    queryFn: async () => {
      const response = await apiClient.get<GetCustomRubricResponse>(
        `/api/custom-rubrics/${id}`
      )
      
      return response.data
    },
    enabled: !!id
  })
}

/**
 * List custom rubrics with optional filtering
 * @param ownerId - Filter rubrics by owner ID
 * @returns Query result for fetching rubrics list
 */
export const useRubrics = (ownerId?: string) => {
  return useQuery({
    queryKey: ['rubrics', ownerId],
    queryFn: async () => {
      const params = ownerId ? { ownerId } : {}
      const response = await apiClient.get<ListCustomRubricsResponse>(
        '/api/custom-rubrics',
        { params }
      )
      
      return response.data
    }
  })
}