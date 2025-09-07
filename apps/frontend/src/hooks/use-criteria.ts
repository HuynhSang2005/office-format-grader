/**
 * @file use-criteria.ts
 * @description TanStack Query hooks for criteria management
 * @author Your Name
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { 
  type Criterion,
  type PreviewCriteriaResponse
} from '../schemas/criteria.schema'

interface ListCriteriaParams {
  source?: 'preset' | 'custom'
  fileType?: 'PPTX' | 'DOCX'
  rubricName?: string
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
      return response.data.data.criteria as Criterion[]
    },
    enabled: !!fileType
  })
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
      const previewData = {
        fileId,
        rubric: {
          title: rubricName || 'default',
          version: '1.0',
          locale: 'vi-VN',
          totalPoints: rubric.reduce((sum: number, criterion: any) => sum + (criterion.maxPoints || 0), 0),
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
    mutationFn: async (rubric: any) => {
      const response = await apiClient.post('/api/criteria/validate', { rubric })
      return response.data
    }
  })
}