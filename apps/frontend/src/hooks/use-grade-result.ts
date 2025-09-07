/**
 * @file use-grade-result.ts
 * @description TanStack Query hook for fetching a single grade result by ID
 * @author Your Name
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { 
  GradeResultSchema,
  type GradeResult
} from '../schemas/grade.schema'

/**
 * Fetch a single grade result by ID
 * @param resultId - The ID of the grade result to fetch
 * @returns Grade result data
 */
const fetchGradeResult = async (resultId: string): Promise<GradeResult> => {
  // Make API request
  const response = await apiClient.get(`/api/grade/${resultId}`)
  
  // The API returns the grade result in a data field
  // Validate response with Zod
  const validatedResponse = GradeResultSchema.parse(response.data.data)
  
  return validatedResponse
}

/**
 * TanStack Query hook for fetching a single grade result by ID
 * @param resultId - The ID of the grade result to fetch
 * @returns Query result with grade result data
 */
export const useGradeResult = (resultId: string) => {
  return useQuery({
    queryKey: ['grade-result', resultId],
    queryFn: () => fetchGradeResult(resultId),
    enabled: !!resultId
  })
}