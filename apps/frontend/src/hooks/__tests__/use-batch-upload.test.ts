/**
 * @file use-batch-upload.test.ts
 * @description Unit tests for useBatchUpload hook
 * @author Your Name
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useBatchUpload } from '../use-batch-upload'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock notifications
const mockShowNotification = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShowNotification
  }
}))

describe('useBatchUpload', () => {
  beforeEach(() => {
    mockShowNotification.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should upload a batch file successfully with automatic grading', async () => {
    const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const { result } = renderHook(() => useBatchUpload())
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockFile)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Thành công',
      message: 'File đã được tải lên và chấm điểm tự động',
      color: 'green',
    })
  })

  it('should handle upload errors', async () => {
    // Override the upload handler to return an error
    server.use(
      http.post('/api/upload', () => {
        return HttpResponse.json({
          success: false,
          message: 'File không hợp lệ'
        }, { status: 400 })
      })
    )
    
    const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const { result } = renderHook(() => useBatchUpload())
    
    await expect(
      waitFor(async () => {
        await result.current.mutateAsync(mockFile)
      })
    ).rejects.toThrow()
    
    expect(result.current.isError).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Lỗi',
      message: 'File không hợp lệ',
      color: 'red',
    })
  })

  it('should upload with custom rubric ID', async () => {
    const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const { result } = renderHook(() => useBatchUpload({ customRubricId: 'custom-rubric-123' }))
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockFile)
    })
    
    expect(result.current.isSuccess).toBe(true)
  })

  it('should show notification for files without automatic grading', async () => {
    // Override the upload handler to return a response without grade result
    server.use(
      http.post('/api/upload', () => {
        return HttpResponse.json({
          success: true,
          message: 'File đã được tải lên thành công',
          data: {
            fileId: 'test-file-id',
            fileName: 'test.zip',
            fileSize: 12345
          }
        })
      })
    )
    
    const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const { result } = renderHook(() => useBatchUpload())
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockFile)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Thành công',
      message: 'File đã được tải lên thành công',
      color: 'green',
    })
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Thông báo',
      message: 'File đã được tải lên. Vui lòng đi đến trang "File chưa chấm" để xử lý file.',
      color: 'blue',
    })
  })

  it('should redirect on success when onSuccessRedirect is provided', async () => {
    const mockRedirect = vi.fn()
    const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const { result } = renderHook(() => useBatchUpload({ onSuccessRedirect: mockRedirect }))
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockFile)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(mockRedirect).toHaveBeenCalledWith('test-file-id')
  })
})