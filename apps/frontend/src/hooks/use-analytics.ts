/**
 * @file use-analytics.ts
 * @description TanStack Query hook for fetching analytics dashboard statistics
 * @author Your Name
 * @link https://tanstack.com/query/latest
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { AnalyticsStatsResponseSchema, type AnalyticsStatsResponse, type DashboardQuery } from '../schemas/analytics.schema'

/**
 * Fetch analytics dashboard statistics
 * @param params - Query parameters for filtering dashboard data
 * @returns The analytics dashboard statistics
 */
const fetchAnalyticsStats = async (params?: DashboardQuery): Promise<AnalyticsStatsResponse> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate)
    }
    
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate)
    }
    
    const response = await apiClient.get(`/api/dashboard?${queryParams.toString()}`)
    
    // Validate and parse the response data
    const parsedData = AnalyticsStatsResponseSchema.parse(response.data)
    
    return parsedData
  } catch (error) {
    console.error('Failed to fetch analytics stats:', error)
    throw new Error('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.')
  }
}

/**
 * TanStack Query hook for fetching analytics dashboard statistics
 * @param params - Query parameters for filtering dashboard data
 * @returns Query result with analytics dashboard statistics
 */
export const useAnalytics = (params?: DashboardQuery) => {
  return useQuery({
    queryKey: ['analyticsStats', params],
    queryFn: () => fetchAnalyticsStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}