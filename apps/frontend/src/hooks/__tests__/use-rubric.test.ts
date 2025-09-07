/**
 * @file use-rubric.test.ts
 * @description Unit tests for useRubric hook and related hooks
 * @author Your Name
 */

import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCreateRubric, useUpdateRubric, useDeleteRubric, useRubric, useRubrics } from '../use-rubric'
import { useAuthStore } from '../../stores/auth.store'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHookWithProviders } from '../../tests/test-utils'

// Mock notifications
const mockShowNotification = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShowNotification
  }
}))

// Mock auth store
vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn()
}))

// Mock data
const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockRubric = {
  id: 'rubric-123',
  name: 'Test Rubric',
  description: 'A test rubric',
  ownerId: 'user-123',
  content: {
    criteria: [],
    totalPoints: 100
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const mockRubrics = [mockRubric]

describe('useRubric hooks', () => {
  beforeEach(() => {
    mockShowNotification.mockClear()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('useCreateRubric', () => {
    it('should create a rubric successfully', async () => {
      server.use(
        http.post('/api/custom-rubrics', () => {
          return HttpResponse.json({
            success: true,
            message: 'Rubric created successfully',
            data: mockRubric
          })
        })
      )

      const onSuccess = vi.fn()
      const { result } = renderHookWithProviders(() => useCreateRubric(onSuccess))
      
      const newRubricData = {
        name: 'New Rubric',
        description: 'A new rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await act(async () => {
        await result.current.mutateAsync(newRubricData)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Thành công',
        message: 'Rubric đã được tạo thành công',
        color: 'green'
      })
      expect(onSuccess).toHaveBeenCalled()
    })

    it('should handle create rubric error', async () => {
      server.use(
        http.post('/api/custom-rubrics', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to create rubric'
          }, { status: 400 })
        })
      )

      const { result } = renderHookWithProviders(() => useCreateRubric())
      
      const newRubricData = {
        name: 'New Rubric',
        description: 'A new rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await expect(
        act(async () => {
          await result.current.mutateAsync(newRubricData)
        })
      ).rejects.toThrow()

      expect(result.current.isError).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Lỗi',
        message: 'Failed to create rubric',
        color: 'red'
      })
    })

    it('should throw error when user is not authenticated', async () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null })

      const { result } = renderHookWithProviders(() => useCreateRubric())
      
      const newRubricData = {
        name: 'New Rubric',
        description: 'A new rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await expect(
        act(async () => {
          await result.current.mutateAsync(newRubricData)
        })
      ).rejects.toThrow('User not authenticated')

      expect(result.current.isError).toBe(true)
    })
  })

  describe('useUpdateRubric', () => {
    it('should update a rubric successfully', async () => {
      server.use(
        http.put('/api/custom-rubrics/rubric-123', () => {
          return HttpResponse.json({
            success: true,
            message: 'Rubric updated successfully',
            data: {
              ...mockRubric,
              name: 'Updated Rubric'
            }
          })
        })
      )

      const onSuccess = vi.fn()
      const { result } = renderHookWithProviders(() => useUpdateRubric('rubric-123', onSuccess))
      
      const updateData = {
        name: 'Updated Rubric',
        description: 'An updated rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await act(async () => {
        await result.current.mutateAsync(updateData)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Thành công',
        message: 'Rubric đã được cập nhật thành công',
        color: 'green'
      })
      expect(onSuccess).toHaveBeenCalled()
    })

    it('should handle update rubric error', async () => {
      server.use(
        http.put('/api/custom-rubrics/rubric-123', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to update rubric'
          }, { status: 400 })
        })
      )

      const { result } = renderHookWithProviders(() => useUpdateRubric('rubric-123'))
      
      const updateData = {
        name: 'Updated Rubric',
        description: 'An updated rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await expect(
        act(async () => {
          await result.current.mutateAsync(updateData)
        })
      ).rejects.toThrow()

      expect(result.current.isError).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Lỗi',
        message: 'Failed to update rubric',
        color: 'red'
      })
    })

    it('should throw error when user is not authenticated', async () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null })

      const { result } = renderHookWithProviders(() => useUpdateRubric('rubric-123'))
      
      const updateData = {
        name: 'Updated Rubric',
        description: 'An updated rubric',
        content: {
          criteria: [],
          totalPoints: 100
        }
      }

      await expect(
        act(async () => {
          await result.current.mutateAsync(updateData)
        })
      ).rejects.toThrow('User not authenticated')

      expect(result.current.isError).toBe(true)
    })
  })

  describe('useDeleteRubric', () => {
    it('should delete a rubric successfully', async () => {
      server.use(
        http.delete('/api/custom-rubrics/rubric-123', () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const onSuccess = vi.fn()
      const { result } = renderHookWithProviders(() => useDeleteRubric(onSuccess))

      await act(async () => {
        await result.current.mutateAsync('rubric-123')
      })

      expect(result.current.isSuccess).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Thành công',
        message: 'Rubric đã được xóa thành công',
        color: 'green'
      })
      expect(onSuccess).toHaveBeenCalled()
    })

    it('should handle delete rubric error', async () => {
      server.use(
        http.delete('/api/custom-rubrics/rubric-123', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to delete rubric'
          }, { status: 400 })
        })
      )

      const { result } = renderHookWithProviders(() => useDeleteRubric())

      await expect(
        act(async () => {
          await result.current.mutateAsync('rubric-123')
        })
      ).rejects.toThrow()

      expect(result.current.isError).toBe(true)
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Lỗi',
        message: 'Failed to delete rubric',
        color: 'red'
      })
    })

    it('should throw error when user is not authenticated', async () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null })

      const { result } = renderHookWithProviders(() => useDeleteRubric())

      await expect(
        act(async () => {
          await result.current.mutateAsync('rubric-123')
        })
      ).rejects.toThrow('User not authenticated')

      expect(result.current.isError).toBe(true)
    })
  })

  describe('useRubric', () => {
    it('should fetch a rubric successfully', async () => {
      server.use(
        http.get('/api/custom-rubrics/rubric-123', () => {
          return HttpResponse.json({
            success: true,
            message: 'Rubric fetched successfully',
            data: mockRubric
          })
        })
      )

      const { result } = renderHookWithProviders(() => useRubric('rubric-123'))
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockRubric)
    })

    it('should handle fetch rubric error', async () => {
      server.use(
        http.get('/api/custom-rubrics/rubric-123', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to fetch rubric'
          }, { status: 400 })
        })
      )

      const { result } = renderHookWithProviders(() => useRubric('rubric-123'))
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useRubrics', () => {
    it('should fetch rubrics successfully', async () => {
      server.use(
        http.get('/api/custom-rubrics', () => {
          return HttpResponse.json({
            success: true,
            message: 'Rubrics fetched successfully',
            data: {
              rubrics: mockRubrics,
              total: mockRubrics.length
            }
          })
        })
      )

      const { result } = renderHookWithProviders(() => useRubrics({ page: 1, limit: 10 }))
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.rubrics).toEqual(mockRubrics)
      expect(result.current.data?.total).toBe(mockRubrics.length)
    })

    it('should handle fetch rubrics error', async () => {
      server.use(
        http.get('/api/custom-rubrics', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to fetch rubrics'
          }, { status: 400 })
        })
      )

      const { result } = renderHookWithProviders(() => useRubrics({ page: 1, limit: 10 }))
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})