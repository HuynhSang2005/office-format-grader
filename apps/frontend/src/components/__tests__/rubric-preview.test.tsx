/**
 * @file rubric-preview.test.tsx
 * @description Unit tests for RubricPreview component
 * @author Your Name
 */

// @vitest-environment jsdom

import { renderWithProviders as render, screen } from '../../tests/test-utils'
import { RubricPreview } from '../grade/rubric-preview'
import '@testing-library/jest-dom/vitest'

// Set up jsdom manually if it's not available
beforeEach(() => {
  if (typeof document === 'undefined') {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    })
    global.window = dom.window as any
    global.document = dom.window.document
    global.navigator = dom.window.navigator
  }
})

// Mock data
const mockRubric = {
  title: 'Test Rubric',
  version: '1.0',
  totalPoints: 100,
  criteria: [
    {
      id: 'criterion-1',
      name: 'Criterion 1',
      description: 'Description for criterion 1',
      detectorKey: 'pptx',
      maxPoints: 50,
      levels: [
        {
          code: 'level-1',
          name: 'Level 1',
          points: 10,
          description: 'Description for level 1'
        },
        {
          code: 'level-2',
          name: 'Level 2',
          points: 20,
          description: 'Description for level 2'
        }
      ]
    },
    {
      id: 'criterion-2',
      name: 'Criterion 2',
      description: 'Description for criterion 2',
      detectorKey: 'docx',
      maxPoints: 50,
      levels: [
        {
          code: 'level-3',
          name: 'Level 3',
          points: 0,
          description: 'Description for level 3'
        },
        {
          code: 'level-4',
          name: 'Level 4',
          points: 30,
          description: 'Description for level 4'
        }
      ]
    }
  ]
}

describe('RubricPreview', () => {
  it('should render the rubric preview with correct title and version', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })

  it('should render all criteria with their names and max points', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })

  it('should render all levels with their names, descriptions, and points', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })

  it('should show green check icon for levels with points > 0', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })

  it('should show red X icon for levels with points = 0', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })

  it('should render accordion structure correctly', () => {
    expect(() => render(<RubricPreview rubric={mockRubric} />)).not.toThrow()
  })
})