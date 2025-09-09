/**
 * @file use-criteria.test.ts
 * @description Tests for use-criteria hook
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi, test } from 'vitest'
import { 
  useListCriteria, 
  useCriterion, 
  useSupportedCriteria, 
  useCreateCriterion, 
  useUpdateCriterion, 
  useDeleteCriterion 
} from '../use-criteria'
import { apiClient } from '../../lib/api-client'

// Mock the apiClient
vi.mock('../../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  // Using createElement instead of JSX to avoid syntax issues
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

describe('use-criteria', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useListCriteria', () => {
    it('should fetch criteria list with params', async () => {
      const mockCriteria = [
        {
          id: '1',
          name: 'Test Criterion',
          detectorKey: 'pptx.test',
          description: 'Test description',
          maxPoints: 10,
          levels: []
        }
      ]

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            criteria: mockCriteria
          }
        }
      })

      const { result } = renderHook(
        () => useListCriteria({ source: 'preset', fileType: 'PPTX' }),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toEqual(mockCriteria)
      expect(apiClient.get).toHaveBeenCalledWith('/api/criteria', {
        params: { source: 'preset', fileType: 'PPTX' }
      })
    })

    it('should not fetch when params are not provided', async () => {
      const { result } = renderHook(
        () => useListCriteria(),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('useCriterion', () => {
    it('should fetch a single criterion by ID', async () => {
      const mockCriterion = {
        id: '1',
        name: 'Test Criterion',
        detectorKey: 'pptx.test',
        description: 'Test description',
        maxPoints: 10,
        levels: []
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: mockCriterion
        }
      })

      const { result } = renderHook(
        () => useCriterion('1'),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toEqual(mockCriterion)
      expect(apiClient.get).toHaveBeenCalledWith('/api/criteria/1')
    })
  })

  describe('useSupportedCriteria', () => {
    it('should fetch supported criteria for a file type', async () => {
      const mockSupportedCriteria = [
        {
          id: '1',
          name: 'Test Criterion',
          detectorKey: 'pptx.test',
          description: 'Test description',
          maxPoints: 10,
          levels: []
        }
      ]

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            criteria: mockSupportedCriteria
          }
        }
      })

      const { result } = renderHook(
        () => useSupportedCriteria('PPTX'),
        { wrapper }
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toEqual(mockSupportedCriteria)
      expect(apiClient.get).toHaveBeenCalledWith('/api/criteria/supported', {
        params: { fileType: 'PPTX' }
      })
    })
  })

  describe('useCreateCriterion', () => {
    it('should create a new criterion', async () => {
      const mockCriterion = {
        id: '1',
        name: 'Test Criterion',
        detectorKey: 'pptx.test',
        description: 'Test description',
        maxPoints: 10,
        levels: []
      }

      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          data: mockCriterion
        }
      })

      const { result } = renderHook(
        () => useCreateCriterion(),
        { wrapper }
      )

      const newCriterion = {
        name: 'Test Criterion',
        detectorKey: 'pptx.test',
        description: 'Test description',
        maxPoints: 10,
        levels: []
      }

      result.current.mutate(newCriterion)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockCriterion)
      expect(apiClient.post).toHaveBeenCalledWith('/api/criteria', newCriterion)
    })

    it('should handle validation errors when creating a criterion', async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          data: {
            errors: [
              { message: 'Name không được rỗng' }
            ]
          }
        }
      })

      const { result } = renderHook(
        () => useCreateCriterion(),
        { wrapper }
      )

      const invalidCriterion = {
        name: '',
        detectorKey: 'pptx.test',
        description: 'Test description',
        maxPoints: 10,
        levels: []
      }

      result.current.mutate(invalidCriterion)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Name không được rỗng')
    })
  })

  describe('useUpdateCriterion', () => {
    it('should update an existing criterion', async () => {
      const mockCriterion = {
        id: '1',
        name: 'Updated Criterion',
        detectorKey: 'pptx.test',
        description: 'Updated description',
        maxPoints: 10,
        levels: []
      }

      vi.mocked(apiClient.put).mockResolvedValue({
        data: {
          data: mockCriterion
        }
      })

      const { result } = renderHook(
        () => useUpdateCriterion(),
        { wrapper }
      )

      const updateData = {
        id: '1',
        name: 'Updated Criterion',
        detectorKey: 'pptx.test',
        description: 'Updated description'
      }

      result.current.mutate(updateData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockCriterion)
      expect(apiClient.put).toHaveBeenCalledWith('/api/criteria/1', {
        name: 'Updated Criterion',
        detectorKey: 'pptx.test',
        description: 'Updated description'
      })
    })
  })

  describe('useDeleteCriterion', () => {
    it('should delete a criterion', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: {
          success: true
        }
      })

      const { result } = renderHook(
        () => useDeleteCriterion(),
        { wrapper }
      )

      result.current.mutate('1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient.delete).toHaveBeenCalledWith('/api/criteria/1')
    })
  })
})