/**
 * @file use-analytics.test.ts
 * @description Tests for useAnalytics hook
 * @author Your Name
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useAnalytics } from '../use-analytics'
import { apiClient } from '../../lib/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the apiClient
vi.mock('../../lib/api-client', () => ({
  apiClient: {
    get: vi.fn()
  }
}))

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch analytics data successfully', async () => {
    // Mock the API response
    const mockResponse = {
      data: {
        success: true,
        message: 'Analytics data fetched successfully',
        data: {
          totalDocuments: 150,
          processedDocuments: 142,
          failedDocuments: 8,
          averageProcessingTime: 2.5,
          successRate: 94.7,
          dailyStats: [
            { date: '2023-05-01', processed: 25, failed: 2 },
            { date: '2023-05-02', processed: 30, failed: 1 },
            { date: '2023-05-03', processed: 28, failed: 3 },
            { date: '2023-05-04', processed: 32, failed: 1 },
            { date: '2023-05-05', processed: 27, failed: 1 }
          ]
        }
      }
    }

    // Mock the API call
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

    // Render the hook
    const { result } = renderHook(() => useAnalytics())

    // Wait for the data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Check the returned data
    expect(result.current.data).toEqual(mockResponse.data.data)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API error', async () => {
    // Mock the API error
    const mockError = new Error('Failed to fetch analytics data')

    // Mock the API call to reject
    vi.mocked(apiClient.get).mockRejectedValue(mockError)

    // Render the hook
    const { result } = renderHook(() => useAnalytics())

    // Wait for the error
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Check the error state
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toEqual(mockError)
  })

  it('should fetch analytics data with date range parameters', async () => {
    // Mock the API response
    const mockResponse = {
      data: {
        success: true,
        message: 'Analytics data fetched successfully',
        data: {
          totalDocuments: 75,
          processedDocuments: 72,
          failedDocuments: 3,
          averageProcessingTime: 2.1,
          successRate: 96.0,
          dailyStats: [
            { date: '2023-05-01', processed: 15, failed: 1 },
            { date: '2023-05-02', processed: 20, failed: 0 },
            { date: '2023-05-03', processed: 18, failed: 1 },
            { date: '2023-05-04', processed: 19, failed: 1 }
          ]
        }
      }
    }

    // Mock the API call
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

    // Render the hook with date range parameters
    const { result } = renderHook(() => useAnalytics({
      startDate: '2023-05-01',
      endDate: '2023-05-04'
    }))

    // Wait for the data to be fetched
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Check the returned data
    expect(result.current.data).toEqual(mockResponse.data.data)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBeNull()
  })
})