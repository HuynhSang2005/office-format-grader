/**
 * @file grade-history-filter.test.ts
 * @description Unit tests for grade history filter functionality
 * @author Your Name
 */

import { describe, it, expect } from 'vitest'
import { GradeHistoryApiSchema } from '@/schemas/grade-api.schema'

describe('Grade History Filter Tests', () => {
  it('should validate correct filter parameters', () => {
    const validData = {
      limit: 10,
      offset: 0,
      fileType: 'PPTX',
      search: 'test',
      dateFrom: '2023-01-01T00:00:00Z',
      dateTo: '2023-12-31T23:59:59Z',
      scoreMin: 5,
      scoreMax: 10
    }

    const result = GradeHistoryApiSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid date range', () => {
    const invalidData = {
      limit: 10,
      offset: 0,
      dateFrom: '2023-12-31T23:59:59Z',
      dateTo: '2023-01-01T00:00:00Z'
    }

    const result = GradeHistoryApiSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      const dateFromError = result.error.errors.find(e => e.path.includes('dateFrom'))
      expect(dateFromError).toBeDefined()
      expect(dateFromError?.message).toBe('dateFrom phải <= dateTo')
    }
  })

  it('should reject invalid score range', () => {
    const invalidData = {
      limit: 10,
      offset: 0,
      scoreMin: 8,
      scoreMax: 5
    }

    const result = GradeHistoryApiSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      const scoreMinError = result.error.errors.find(e => e.path.includes('scoreMin'))
      expect(scoreMinError).toBeDefined()
      expect(scoreMinError?.message).toBe('scoreMin phải <= scoreMax')
    }
  })

  it('should allow partial filter parameters', () => {
    const validData = {
      limit: 20,
      offset: 40,
      fileType: 'DOCX'
    }

    const result = GradeHistoryApiSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})