/**
 * @file use-ungraded-files.test.ts
 * @description Tests for the useUngradedFiles hook
 * @author Your Name
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useUngradedFiles, useDeleteUngradedFile, useRetryGrade } from '../use-ungraded-files'
import { server } from '../../tests/mocks/server'
import { rest } from 'msw'
import { QueryClient, type QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { vi } from 'vitest'

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Wrapper component for testing
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useUngradedFiles', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
  })

  it('should fetch ungraded files successfully', async () => {
    // Mock API response
    server.use(
      rest.get('/api/ungraded', (_, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            message: 'Success',
            data: {
              files: [
                {
                  id: '1',
                  filename: 'test.pptx',
                  fileType: 'PPTX',
                  fileSize: 1024,
                  uploadedAt: '2023-01-01T00:00:00Z'
                }
              ],
              total: 1
            }
          })
        )
      })
    )

    const { result } = renderHook(() => useUngradedFiles(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.data.files).toHaveLength(1)
    })
  })

  it('should handle fetch error', async () => {
    // Mock API error
    server.use(
      rest.get('/api/ungraded', (_, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }))
      })
    )

    const { result } = renderHook(() => useUngradedFiles(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useDeleteUngradedFile', () => {
  it('should delete ungraded file successfully', async () => {
    const fileId = '1'
    
    // Mock API response
    server.use(
      rest.delete(`/api/ungraded/${fileId}`, (_, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            message: 'File deleted successfully'
          })
        )
      })
    )

    const { result } = renderHook(() => useDeleteUngradedFile(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync(fileId)
      expect(result.current.isSuccess).toBe(true)
    })
  })
})

describe('useRetryGrade', () => {
  it('should retry grading successfully', async () => {
    const fileId = '1'
    
    // Mock API response
    server.use(
      rest.post('/api/grade/retry', (_, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            message: 'Grading started successfully',
            data: {
              fileId
            }
          })
        )
      })
    )

    const { result } = renderHook(() => useRetryGrade(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync(fileId)
      expect(result.current.isSuccess).toBe(true)
    })
  })
})