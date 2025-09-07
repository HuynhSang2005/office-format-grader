/**
 * @file dashboard-filter.test.ts
 * @description Unit tests for dashboard filter functionality
 * @author Your Name
 */

import { describe, it, expect } from 'vitest'
import { DashboardQuerySchema } from '@/schemas/dashboard.schema'

describe('Dashboard Filter Tests', () => {
  it('should validate correct filter parameters', () => {
    const validData = {
      gradedDays: 7,
      ungradedHours: 12,
      minScore: 6,
      maxScore: 9,
      uploadDays: 7,
      topDays: 7,
      page: 1,
      limit: 10,
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-12-31T23:59:59Z'
    }

    const result = DashboardQuerySchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid date range', () => {
    const invalidData = {
      gradedDays: 7,
      ungradedHours: 12,
      minScore: 6,
      maxScore: 9,
      uploadDays: 7,
      topDays: 7,
      page: 1,
      limit: 10,
      startDate: '2023-12-31T23:59:59Z',
      endDate: '2023-01-01T00:00:00Z'
    }

    const result = DashboardQuerySchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      const startDateError = result.error.errors.find(e => e.path.includes('startDate'))
      expect(startDateError).toBeDefined()
      expect(startDateError?.message).toBe('startDate phải nhỏ hơn hoặc bằng endDate')
    }
  })

  it('should reject invalid score range', () => {
    const invalidData = {
      gradedDays: 7,
      ungradedHours: 12,
      minScore: 8,
      maxScore: 5,
      uploadDays: 7,
      topDays: 7,
      page: 1,
      limit: 10
    }

    const result = DashboardQuerySchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      const minScoreError = result.error.errors.find(e => e.path.includes('minScore'))
      expect(minScoreError).toBeDefined()
      expect(minScoreError?.message).toBe('minScore phải nhỏ hơn hoặc bằng maxScore')
    }
  })

  it('should allow partial filter parameters', () => {
    const validData = {
      page: 2,
      limit: 20
    }

    const result = DashboardQuerySchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})