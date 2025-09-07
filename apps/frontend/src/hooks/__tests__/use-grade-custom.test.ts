/**
 * @file use-grade-custom.test.ts
 * @description Unit tests for useGradeCustom hook
 * @author Your Name
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useGradeCustom } from '../use-grade-custom'
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

describe('useGradeCustom', () => {
  const mockGradeResult = {
    id: 'grade-result-123',
    fileId: 'file-123',
    fileName: 'test.pptx',
    fileType: 'PPTX' as const,
    score: 85,
    totalPoints: 100,
    feedback: 'Good work!',
    gradedAt: new Date().toISOString(),
    rubric: {
      id: 'rubric-123',
      name: 'Default Rubric',
      content: {
        criteria: [],
        totalPoints: 100
      }
    }
  }

  beforeEach(() => {
    mockShowNotification.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should grade a file with custom rubric successfully', async () => {
    const mockRequest = {
      fileId: 'file-123',
      rubric: {
        id: 'rubric-123',
        name: 'Test Rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }
    }

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useGradeCustom({ onSuccess }))
    
    await waitFor(async () => {
      await result.current.mutateAsync(mockRequest)
    })
    
    expect(result.current.isSuccess).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Thành công',
      message: 'Chấm điểm thành công',
      color: 'green',
    })
    expect(onSuccess).toHaveBeenCalledWith(mockGradeResult)
  })

  it('should handle grading errors', async () => {
    // Override the grade handler to return an error
    server.use(
      http.post('/api/grade/custom', () => {
        return HttpResponse.json({
          success: false,
          message: 'Không thể chấm điểm file'
        }, { status: 400 })
      })
    )
    
    const mockRequest = {
      fileId: 'file-123',
      rubric: {
        id: 'rubric-123',
        name: 'Test Rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }
    }

    const onError = vi.fn()
    const { result } = renderHook(() => useGradeCustom({ onError }))
    
    await expect(
      waitFor(async () => {
        await result.current.mutateAsync(mockRequest)
      })
    ).rejects.toThrow()
    
    expect(result.current.isError).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Lỗi',
      message: 'Không thể chấm điểm file',
      color: 'red',
    })
    expect(onError).toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    // Override the grade handler to return a network error
    server.use(
      http.post('/api/grade/custom', () => {
        return HttpResponse.error()
      })
    )
    
    const mockRequest = {
      fileId: 'file-123',
      rubric: {
        id: 'rubric-123',
        name: 'Test Rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }
    }

    const { result } = renderHook(() => useGradeCustom())
    
    await expect(
      waitFor(async () => {
        await result.current.mutateAsync(mockRequest)
      })
    ).rejects.toThrow()
    
    expect(result.current.isError).toBe(true)
    expect(mockShowNotification).toHaveBeenCalledWith({
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi chấm điểm',
      color: 'red',
    })
  })
})