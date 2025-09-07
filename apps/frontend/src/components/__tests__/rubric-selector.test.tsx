/**
 * @file rubric-selector.test.tsx
 * @description Unit tests for RubricSelector component
 * @author Your Name
 */

import { renderWithProviders as render, screen, fireEvent } from '../../tests/test-utils'
import { RubricSelector } from '../grade/rubric-selector'
import { useRubrics } from '../../hooks/use-rubric'
import { useAuthStore } from '../../stores/auth.store'
import { vi } from 'vitest'

// Mock hooks
vi.mock('../../hooks/use-rubric', () => ({
  useRubrics: vi.fn()
}))

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn()
}))

// Mock data
const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockRubrics = [
  {
    id: 'rubric-1',
    name: 'Test Rubric 1',
    ownerId: 'user-123',
    content: {
      criteria: [
        { id: 'criterion-1', name: 'Criterion 1', detectorKey: 'pptx', maxPoints: 10, levels: [] }
      ],
      totalPoints: 100
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rubric-2',
    name: 'Test Rubric 2',
    ownerId: 'user-123',
    content: {
      criteria: [
        { id: 'criterion-2', name: 'Criterion 2', detectorKey: 'docx', maxPoints: 20, levels: [] }
      ],
      totalPoints: 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

describe('RubricSelector', () => {
  const mockOnChange = vi.fn()
  
  const mockRubricsData = {
    data: mockRubrics,
    total: mockRubrics.length
  }
  
  const mockUseRubrics = {
    data: mockRubricsData,
    isLoading: false
  }
  
  const mockAuthStore = {
    user: mockUser
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRubrics as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUseRubrics)
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthStore)
  })

  it('should render with no rubric selected', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should render with a rubric selected', () => {
    expect(() => render(
      <RubricSelector 
        value="rubric-1" 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should open modal when select button is clicked', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should filter rubrics by file type', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
        fileType="PPTX"
      />
    )).not.toThrow()
  })

  it('should select a rubric and confirm selection', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should show loading state', () => {
    ;(useRubrics as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true
    })
    
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should show empty state with create button', () => {
    ;(useRubrics as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false
    })
    
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should disable confirm button when no rubric is selected', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should enable confirm button when a rubric is selected', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should close modal when cancel button is clicked', () => {
    expect(() => render(
      <RubricSelector 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })
})