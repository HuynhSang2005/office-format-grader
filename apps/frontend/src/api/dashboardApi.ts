import apiClient from './axios';
import type { DashboardParams, DashboardStatsResponse, GradeHistoryResponse, HistoryParams } from '@/types';

/**
 * Fetches the main statistics for the dashboard.
 * @param params Optional query parameters for pagination and filtering.
 * @returns A promise that resolves with the dashboard statistics.
 */
export const getDashboardStats = async (params?: DashboardParams): Promise<DashboardStatsResponse> => {
  const { data } = await apiClient.get<DashboardStatsResponse>('/dashboard', { params });
  return data;
};

/**
 * Fetches the grading history for the current user.
 * @param params Query parameters for pagination (limit, offset).
 * @returns A promise that resolves with the paginated list of grade results.
 */
export const getGradeHistory = async (params: HistoryParams): Promise<GradeHistoryResponse> => {
  const { data } = await apiClient.get<GradeHistoryResponse>('/grade/history', { params });
  return data;
};
