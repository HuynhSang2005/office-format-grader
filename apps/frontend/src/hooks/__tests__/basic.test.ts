import { expect, test } from 'vitest'

// @vitest-environment jsdom

test('should pass', () => {
  expect(1).toBe(1)
})

test('should have access to window', () => {
  expect(typeof window).toBe('object')
})