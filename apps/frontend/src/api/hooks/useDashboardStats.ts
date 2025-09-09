/**
 * @file useDashboardStats.ts
 * @description TanStack Query hook for fetching dashboard statistics
 * @author Nguyễn Huỳnh Sang
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api-client'
import { DashboardStatsSchema, type DashboardStats } from '../../schemas/dashboard.schema'

interface DashboardFilters {
  gradedDays?: number
  ungradedHours?: number
  minScore?: number
  maxScore?: number
  uploadDays?: number
  topDays?: number
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

const fetchDashboardStats = async (filters: DashboardFilters = {}): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/api/dashboard', {
    params: filters
  })
  return DashboardStatsSchema.parse(response.data)
}

export const useDashboardStats = (filters: DashboardFilters = {}) => {
  return useQuery({
    queryKey: ['dashboardStats', filters],
    queryFn: () => fetchDashboardStats(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}