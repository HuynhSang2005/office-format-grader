/**
 * @file use-criteria.ts
 * @description TanStack Query hooks for criteria management
 * @author Nguyễn Huỳnh Sang
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import type { 
  Criterion,
  PreviewCriteriaResponse,
  CreateCriterion
} from '../schemas/criteria.schema'

interface ListCriteriaParams {
  source?: 'preset' | 'custom'
  fileType?: 'PPTX' | 'DOCX'
  rubricName?: string
}

interface SupportedCriterion {
  id: string
  name: string
  detectorKey: string
  description: string
  maxPoints: number
  levels: Array<{
    points: number
    code: string
    name: string
    description: string
  }>
}

/**
 * Fetch criteria based on filters
 * @param params - Filter parameters
 * @returns Array of criteria
 */
export const useListCriteria = (params?: ListCriteriaParams) => {
  return useQuery({
    queryKey: ['criteria', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/criteria', { params })
      return response.data.data.criteria as Criterion[]
    },
    enabled: !!params
  })
}

/**
 * Fetch a single criterion by ID
 * @param criterionId - The ID of the criterion to fetch
 * @returns The criterion data
 */
export const useCriterion = (criterionId: string) => {
  return useQuery({
    queryKey: ['criterion', criterionId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/criteria/${criterionId}`)
      return response.data.data as Criterion
    },
    enabled: !!criterionId
  })
}

/**
 * Fetch supported criteria for a file type
 * @param fileType - File type (PPTX or DOCX)
 * @param detectorKey - Optional detector key to filter criteria
 * @returns Array of supported criteria
 */
export const useSupportedCriteria = (fileType?: 'PPTX' | 'DOCX', detectorKey?: string) => {
  return useQuery({
    queryKey: ['supported-criteria', fileType, detectorKey],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (fileType) params.fileType = fileType
      if (detectorKey) params.detectorKey = detectorKey
      
      const response = await apiClient.get('/api/criteria/supported', { params })
      return response.data.data.criteria as SupportedCriterion[]
    },
    enabled: !!fileType
  })
}

/**
 * Create a new criterion
 * @returns Mutation hook for creating criteria
 */
export const useCreateCriterion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (criterion: CreateCriterion) => {
      const response = await apiClient.post('/api/criteria', criterion)
      return response.data.data as Criterion
    },
    onSuccess: () => {
      // Invalidate and refetch criteria lists
      queryClient.invalidateQueries({ queryKey: ['criteria'] })
    },
    onError: (error: any) => {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        throw new Error(validationErrors.map((err: any) => err.message).join(', '))
      }
      throw error
    }
  })
}

/**
 * Update an existing criterion
 * @returns Mutation hook for updating criteria
 */
export const useUpdateCriterion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Criterion> & { id: string }) => {
      const response = await apiClient.put(`/api/criteria/${id}`, data)
      return response.data.data as Criterion
    },
    onSuccess: (data) => {
      // Update the specific criterion in cache
      queryClient.setQueryData(['criterion', data.id], data)
      // Invalidate criteria lists to show updated data
      queryClient.invalidateQueries({ queryKey: ['criteria'] })
    },
    onError: (error: any) => {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        throw new Error(validationErrors.map((err: any) => err.message).join(', '))
      }
      throw error
    }
  })
}

/**
 * Delete a criterion
 * @returns Mutation hook for deleting criteria
 */
export const useDeleteCriterion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/criteria/${id}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate criteria lists to remove deleted item
      queryClient.invalidateQueries({ queryKey: ['criteria'] })
      // Remove specific criterion from cache
      queryClient.removeQueries({ queryKey: ['criterion'] })
    }
  })
}

interface PreviewRubric {
  title: string
  version: string
  locale: string
  totalPoints: number
  scoring: {
    method: 'sum'
    rounding: 'half_up_0.25' | 'none'
  }
  criteria: Criterion[]
}

interface PreviewData {
  fileId: string
  rubric: PreviewRubric
}

/**
 * Preview criteria that can be applied to a file
 * @returns Mutation hook for previewing criteria
 */
export const usePreviewCriteria = () => {
  return useMutation({
    mutationFn: async ({ 
      file, 
      fileType,
      rubricName 
    }: { 
      file: File, 
      fileType: 'PPTX' | 'DOCX',
      rubricName?: string 
    }) => {
      // First upload the file
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await apiClient.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const fileId = uploadResponse.data.data.fileId
      
      // Load the preset rubric if rubricName is provided, otherwise load default
      const rubricResponse = await apiClient.get('/api/criteria', {
        params: {
          source: 'preset',
          fileType,
          rubricName: rubricName || 'default'
        }
      })
      
      const rubric = rubricResponse.data.data.criteria
      
      // Then preview criteria
      const previewData: PreviewData = {
        fileId,
        rubric: {
          title: rubricName || 'default',
          version: '1.0',
          locale: 'vi-VN',
          totalPoints: rubric.reduce((sum: number, criterion: Criterion) => sum + (criterion.maxPoints || 0), 0),
          scoring: {
            method: 'sum',
            rounding: 'half_up_0.25'
          },
          criteria: rubric
        }
      }
      
      const response = await apiClient.post<PreviewCriteriaResponse>(
        '/api/criteria/preview', 
        previewData
      )
      
      return response.data.data
    }
  })
}

/**
 * Validate a rubric structure
 * @returns Mutation hook for validating rubrics
 */
export const useValidateRubric = () => {
  return useMutation({
    mutationFn: async (rubric: PreviewRubric) => {
      const response = await apiClient.post('/api/criteria/validate', { rubric })
      return response.data
    }
  })
}