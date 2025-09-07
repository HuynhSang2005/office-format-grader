/**
 * @file format.test.ts
 * @description Tests for formatting utilities
 * @author Your Name
 */

import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency } from './format'

describe('format utilities', () => {
  it('should format date correctly', () => {
    const date = new Date('2023-12-25')
    const formatted = formatDate(date)
    expect(formatted).toBe('25/12/2023')
  })

  it('should format currency correctly', () => {
    const amount = 1000000
    const formatted = formatCurrency(amount)
    // Note: There's a non-breaking space between the number and currency symbol
    expect(formatted).toBe('1.000.000 ₫')
  })
})