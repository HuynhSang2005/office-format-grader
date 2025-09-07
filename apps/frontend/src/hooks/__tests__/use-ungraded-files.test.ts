/**
 * @file use-ungraded-files.test.ts
 * @description Unit tests for useUngradedFiles hook
 * @author Your Name
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useUngradedFiles, useDeleteUngradedFile } from '../use-ungraded-files'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { vi } from 'vitest'

// Mock notifications
const mockShowNotification = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShowNotification
  }
}))

// Setup React Query client for testing
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

// Mock data
const mockUngradedFiles = [
  {
    id: 'file-1',
    name: 'test1.pptx',
    size: 1024,
    uploadedAt: new Date().toISOString(),
    fileType: 'PPTX' as const
  },
  {
    id: 'file-2',
    name: 'test2.docx',
    size: 2048,
    uploadedAt: new Date().toISOString(),
    fileType: 'DOCX' as const
  }
]

describe('useUngradedFiles hooks', () => {
  beforeEach(() => {
    mockShowNotification.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('useUngradedFiles', () => {
    it('should fetch ungraded files successfully', async () => {
      server.use(
        http.get('/api/ungraded', () => {
          return HttpResponse.json({
            success: true,
            message: 'Lấy danh sách file chưa chấm điểm thành công',
            data: {
              files: mockUngradedFiles,
              total: mockUngradedFiles.length
            }
          })
        })
      )

      const { result } = renderHook(() => useUngradedFiles(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUngradedFiles)
    })

    it('should handle fetch error', async () => {
      server.use(
        http.get('/api/ungraded', () => {
          return HttpResponse.json({
            success: false,
            message: 'Không thể lấy danh sách file chưa chấm điểm'
          }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useUngradedFiles(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useDeleteUngradedFile', () => {
    it('should delete an ungraded file successfully', async () => {
      server.use(
        http.delete('/api/ungraded/file-1', () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const { result } = renderHook(() => useDeleteUngradedFile(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('file-1')
      })

      expect(result.current.isSuccess).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Thành công',
        message: 'Đã xóa file chưa chấm điểm',
        color: 'green',
      })
    })

    it('should handle delete error', async () => {
      server.use(
        http.delete('/api/ungraded/file-1', () => {
          return HttpResponse.json({
            success: false,
            message: 'Không thể xóa file chưa chấm điểm'
          }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useDeleteUngradedFile(), { wrapper })

      await expect(
        act(async () => {
          await result.current.mutateAsync('file-1')
        })
      ).rejects.toThrow()

      expect(result.current.isError).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Lỗi',
        message: 'Không thể xóa file chưa chấm điểm',
        color: 'red',
      })
    })
  })
})