/**
 * @file use-rubric.test.ts
 * @description Unit tests for useRubric hook and related hooks
 * @author Your Name
 */

import React from 'react'
import { useCreateRubric, useUpdateRubric, useDeleteRubric, useRubric, useRubrics } from '../use-rubric'
import { useAuthStore } from '../../stores/auth.store'
import { server } from '../../tests/mocks/server'
import { rest } from 'msw'
import { renderHookWithProviders, waitFor, act } from '../../tests/test-utils'

// Mock auth store
vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn()
}))

describe('useRubric hooks', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Mock auth store to return a user
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@example.com' }
    })
  })

  describe('useRubrics', () => {
    it('should fetch rubrics successfully', async () => {
      // Mock API response
      server.use(
        rest.get('/api/rubrics', (_, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              message: 'Success',
              data: [
                {
                  id: '1',
                  ownerId: 1,
                  name: 'Test Rubric',
                  content: {
                    title: 'Test Rubric',
                    version: '1.0',
                    locale: 'vi-VN',
                    totalPoints: 10,
                    scoring: {
                      method: 'sum',
                      rounding: 'half_up_0.25'
                    },
                    criteria: []
                  },
                  total: 10,
                  isPublic: false,
                  createdAt: '2023-01-01T00:00:00Z',
                  updatedAt: '2023-01-01T00:00:00Z'
                }
              ]
            })
          )
        })
      )

      const { result } = renderHookWithProviders(() => useRubrics())

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toBeDefined()
        expect(result.current.data?.data).toHaveLength(1)
      })
    })

    it('should handle fetch error', async () => {
      // Mock API error
      server.use(
        rest.get('/api/rubrics', (_, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }))
        })
      )

      const { result } = renderHookWithProviders(() => useRubrics())

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useRubric', () => {
    it('should fetch a single rubric successfully', async () => {
      const rubricId = '1'
      
      // Mock API response
      server.use(
        rest.get(`/api/rubrics/${rubricId}`, (_, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              message: 'Success',
              data: {
                id: '1',
                ownerId: 1,
                name: 'Test Rubric',
                content: {
                  title: 'Test Rubric',
                  version: '1.0',
                  locale: 'vi-VN',
                  totalPoints: 10,
                  scoring: {
                    method: 'sum',
                    rounding: 'half_up_0.25'
                  },
                  criteria: []
                },
                total: 10,
                isPublic: false,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
              }
            })
          )
        })
      )

      const { result } = renderHookWithProviders(() => useRubric(rubricId))

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toBeDefined()
        expect(result.current.data?.data.id).toBe(rubricId)
      })
    })
  })

  describe('useCreateRubric', () => {
    it('should create a rubric successfully', async () => {
      const newRubric = {
        ownerId: 1,
        name: 'New Rubric',
        content: {
          title: 'New Rubric',
          version: '1.0',
          locale: 'vi-VN',
          totalPoints: 10,
          scoring: {
            method: 'sum',
            rounding: 'half_up_0.25'
          },
          criteria: []
        },
        isPublic: false
      }

      // Mock API response
      server.use(
        rest.post('/api/rubrics', (_, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              message: 'Rubric created successfully',
              data: {
                id: '2',
                ...newRubric,
                total: 10,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
              }
            })
          )
        })
      )

      const { result } = renderHookWithProviders(() => useCreateRubric())

      await act(async () => {
        await result.current.mutateAsync(newRubric)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.data.name).toBe(newRubric.name)
    })
  })

  describe('useUpdateRubric', () => {
    it('should update a rubric successfully', async () => {
      const rubricId = '1'
      const updatedRubric = {
        name: 'Updated Rubric',
        content: {
          title: 'Updated Rubric',
          version: '1.0',
          locale: 'vi-VN',
          totalPoints: 10,
          scoring: {
            method: 'sum',
            rounding: 'half_up_0.25'
          },
          criteria: []
        },
        isPublic: true
      }

      // Mock API response
      server.use(
        rest.put(`/api/rubrics/${rubricId}`, (_, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              message: 'Rubric updated successfully',
              data: {
                id: rubricId,
                ownerId: 1,
                ...updatedRubric,
                total: 10,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z'
              }
            })
          )
        })
      )

      const { result } = renderHookWithProviders(() => useUpdateRubric())

      await act(async () => {
        await result.current.mutateAsync({ id: rubricId, ...updatedRubric })
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.data.name).toBe(updatedRubric.name)
    })
  })

  describe('useDeleteRubric', () => {
    it('should delete a rubric successfully', async () => {
      const rubricId = '1'

      // Mock API response
      server.use(
        rest.delete(`/api/rubrics/${rubricId}`, (_, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              message: 'Rubric deleted successfully'
            })
          )
        })
      )

      const { result } = renderHookWithProviders(() => useDeleteRubric())

      await act(async () => {
        await result.current.mutateAsync(rubricId)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.success).toBe(true)
    })
  })
})