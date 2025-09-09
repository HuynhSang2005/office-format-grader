/**
 * @file rubric-preview.test.tsx
 * @description Tests for the RubricPreview component
 * @author Your Name
 */

// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { RubricPreview } from '../grade/rubric-preview'
import { JSDOM } from 'jsdom'

describe('RubricPreview', () => {
  beforeEach(() => {
    // Setup DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as unknown as Window & typeof globalThis
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  })

  it('should render with valid rubric data', () => {
    const mockRubric = {
      title: 'Test Rubric',
      version: '1.0',
      locale: 'vi-VN',
      totalPoints: 10,
      scoring: {
        method: 'sum' as const,
        rounding: 'half_up_0.25' as const
      },
      criteria: [
        {
          id: '1',
          name: 'Test Criterion',
          detectorKey: 'test.key',
          maxPoints: 5,
          levels: [
            {
              points: 0,
              code: '0',
              name: 'Không đạt',
              description: 'Không đạt yêu cầu'
            },
            {
              points: 5,
              code: '5',
              name: 'Tốt',
              description: 'Đạt yêu cầu tốt'
            }
          ]
        }
      ]
    }

    const { container } = render(<RubricPreview rubric={mockRubric} />)
    expect(container).toBeInTheDocument()
  })

  it('should render with empty criteria', () => {
    const mockRubric = {
      title: 'Empty Rubric',
      version: '1.0',
      locale: 'vi-VN',
      totalPoints: 0,
      scoring: {
        method: 'sum' as const,
        rounding: 'half_up_0.25' as const
      },
      criteria: []
    }

    const { container } = render(<RubricPreview rubric={mockRubric} />)
    expect(container).toBeInTheDocument()
  })
})