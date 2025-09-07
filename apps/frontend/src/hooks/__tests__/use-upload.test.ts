/**
 * @file use-upload.test.ts
 * @description Unit tests for useUpload hook
 * @author Your Name
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useUpload } from '../use-upload'
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

describe('useUpload', () => {
  beforeEach(() => {
    mockShowNotification.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should upload a file successfully', async () => {
    const mockFile = new File(['test content'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    const { result } = renderHook(() => useUpload())
    
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
    
    const mockFile = new File(['test content'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    const { result } = renderHook(() => useUpload())
    
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
    const mockFile = new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const { result } = renderHook(() => useUpload({ customRubricId: 'custom-rubric-123' }))
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockFile)
    })
    
    expect(result.current.isSuccess).toBe(true)
  })
})