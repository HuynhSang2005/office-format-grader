/**
 * @file use-grade-history.test.ts
 * @description Unit tests for useGradeHistory hook
 * @author Your Name
 */

// @vitest-environment jsdom

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useGradeHistory } from '../use-grade-history'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, it, expect, afterEach } from 'vitest'
import { renderHookWithProviders } from '../../tests/test-utils'

// Mock data
const mockGradeHistory = [
  {
    id: 'grade-1',
    filename: 'test1.pptx',
    fileType: 'PPTX' as const,
    totalPoints: 85,
    gradedAt: new Date().toISOString(),
  },
  {
    id: 'grade-2',
    filename: 'test2.docx',
    fileType: 'DOCX' as const,
    totalPoints: 92,
    gradedAt: new Date().toISOString(),
  }
]

describe('useGradeHistory', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  it('should fetch grade history successfully', async () => {
    // Override the handler to ensure it's working correctly
    server.use(
      http.get('/api/grade/history', () => {
        console.log('Mock endpoint hit')
        return HttpResponse.json({
          success: true,
          message: 'Lấy lịch sử chấm điểm thành công',
          data: {
            results: mockGradeHistory,
            total: mockGradeHistory.length,
            limit: 10,
            offset: 0
          }
        })
      })
    )

    const { result } = renderHookWithProviders(() => useGradeHistory({ limit: 10, offset: 0 }))
    
    console.log('Initial result state:', result.current)
    
    await waitFor(() => {
      console.log('Current result state:', result.current)
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 2000 })

    expect(result.current.data?.results).toEqual(mockGradeHistory)
    expect(result.current.data?.total).toBe(mockGradeHistory.length)
  })

  it('should handle fetch errors', async () => {
    server.use(
      http.get('/api/grade/history', () => {
        return HttpResponse.json({
          success: false,
          message: 'Không thể lấy lịch sử chấm điểm'
        }, { status: 500 })
      })
    )

    const { result } = renderHookWithProviders(() => useGradeHistory({ limit: 10, offset: 0 }))
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 2000 })
  })

  it('should use query parameters correctly', async () => {
    let capturedParams: URLSearchParams | null = null
    
    server.use(
      http.get('/api/grade/history', ({ request }) => {
        const url = new URL(request.url)
        capturedParams = url.searchParams
        console.log('Captured params:', capturedParams?.toString())
        
        return HttpResponse.json({
          success: true,
          message: 'Lấy lịch sử chấm điểm thành công',
          data: {
            results: [],
            total: 0,
            limit: 10,
            offset: 0
          }
        })
      })
    )

    const query = { limit: 20, offset: 20, fileType: 'PPTX' as const }
    renderHookWithProviders(() => useGradeHistory(query))
    
    await waitFor(() => {
      expect(capturedParams).not.toBeNull()
    }, { timeout: 2000 })

    expect(capturedParams?.get('limit')).toBe('20')
    expect(capturedParams?.get('offset')).toBe('20')
    expect(capturedParams?.get('fileType')).toBe('PPTX')
  })
})