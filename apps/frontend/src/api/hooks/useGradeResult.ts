/**
 * @file useGradeResult.ts
 * @description TanStack Query hook for fetching grade result details
 * @author Your Name
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api-client'
import { GradeResultSchema, type GradeResult } from '../../schemas/grade.schema'

/**
 * Fetch grade result by ID
 * @param resultId - The ID of the grade result to fetch
 * @returns The grade result data
 */
const fetchGradeResult = async (resultId: string): Promise<GradeResult> => {
  const response = await apiClient.get(`/api/grade/${resultId}`)
  
  // Validate and parse the response data
  const parsedData = GradeResultSchema.parse(response.data.data)
  
  return parsedData
}

/**
 * TanStack Query hook for fetching grade result details
 * @param resultId - The ID of the grade result to fetch
 * @returns Query result with grade result data
 */
export const useGradeResult = (resultId: string) => {
  return useQuery({
    queryKey: ['gradeResult', resultId],
    queryFn: () => fetchGradeResult(resultId),
    enabled: !!resultId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    select: (data) => data // Extract the data field from the response
  })
}