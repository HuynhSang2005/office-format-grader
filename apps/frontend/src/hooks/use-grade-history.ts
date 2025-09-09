/**
 * @file use-grade-history.ts
 * @description TanStack Query hook for fetching grade history
 * @author Nguyễn Huỳnh Sang
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { 
  GradeHistoryResponseSchema, 
  GradeHistoryQuerySchema,
  type GradeHistoryResponse,
  type GradeHistoryQuery
} from '../schemas/grade.schema'

/**
 * Fetch grade history with optional filters
 * @param query - Query parameters for filtering history
 * @returns Grade history data
 */
const fetchGradeHistory = async (query: GradeHistoryQuery): Promise<GradeHistoryResponse['data']> => {
  // Validate query parameters with Zod
  const validatedQuery = GradeHistoryQuerySchema.parse(query)
  
  // Make API request
  const response = await apiClient.get('/api/grade/history', {
    params: validatedQuery
  })

  // Validate response with Zod
  const validatedResponse = GradeHistoryResponseSchema.parse(response.data)
  
  return validatedResponse.data
}

/**
 * TanStack Query hook for fetching grade history
 * @param query - Query parameters for filtering history
 * @returns Query result with grade history data
 */
export const useGradeHistory = (query: GradeHistoryQuery) => {
  return useQuery({
    queryKey: ['grade-history', query],
    queryFn: () => fetchGradeHistory(query),
    placeholderData: (previousData) => previousData
  })
}