/**
 * @file use-grade-result.test.ts
 * @description Unit tests for useGradeResult hook
 * @author Your Name
 */

// @vitest-environment jsdom

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useGradeResult } from '../use-grade-result'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, it, expect, afterEach } from 'vitest'
import { renderHookWithProviders } from '../../tests/test-utils'
import '@testing-library/jest-dom/vitest'

// Mock data
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

describe('useGradeResult', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('should fetch grade result successfully', async () => {
    server.use(
      http.get('/api/grade/grade-result-123', () => {
        return HttpResponse.json({
          success: true,
          message: 'Lấy kết quả chấm điểm thành công',
          data: mockGradeResult
        })
      })
    )

    const { result } = renderHookWithProviders(() => useGradeResult('grade-result-123'))
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockGradeResult)
  })

  it('should handle fetch errors', async () => {
    server.use(
      http.get('/api/grade/grade-result-123', () => {
        return HttpResponse.json({
          success: false,
          message: 'Không tìm thấy kết quả chấm điểm'
        }, { status: 404 })
      })
    )

    const { result } = renderHookWithProviders(() => useGradeResult('grade-result-123'))
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should not fetch when resultId is empty', async () => {
    const { result } = renderHookWithProviders(() => useGradeResult(''))
    
    // Wait a bit to ensure no request is made
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(result.current.isFetching).toBe(false)
    expect(result.current.isEnabled).toBe(false)
  })
})