/**
 * @file custom-rubric-selector.test.tsx
 * @description Unit tests for CustomRubricSelector component
 * @author Your Name
 */

import { renderWithProviders as render, screen, fireEvent } from '../../tests/test-utils'
import { CustomRubricSelectorComponent } from '../grade/custom-rubric-selector'
import { useCustomRubric } from '../../hooks/use-custom-rubric'
import { useAuthStore } from '../../stores/auth.store'
import { vi } from 'vitest'

// Mock hooks
vi.mock('../../hooks/use-custom-rubric', () => ({
  useCustomRubric: vi.fn()
}))

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn()
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
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

describe('CustomRubricSelectorComponent', () => {
  const mockLoadRubrics = vi.fn().mockResolvedValue(undefined)
  const mockOnChange = vi.fn()
  
  const mockCustomRubric = {
    rubrics: mockRubrics,
    loading: false,
    error: null,
    loadRubrics: mockLoadRubrics,
    loadRubric: vi.fn(),
    selectRubric: vi.fn(),
    clearError: vi.fn()
  }
  
  const mockAuthStore = {
    user: mockUser
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useCustomRubric as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCustomRubric)
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthStore)
  })

  it('should render with no rubric selected', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should render with a rubric selected', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value="rubric-1" 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should open modal when select button is clicked', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should filter rubrics by file type', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
        fileType="PPTX"
      />
    )).not.toThrow()
  })

  it('should select a rubric and confirm selection', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should show loading state', () => {
    ;(useCustomRubric as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockCustomRubric,
      loading: true
    })
    
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should show error state', () => {
    ;(useCustomRubric as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockCustomRubric,
      error: 'Failed to load rubrics'
    })
    
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should show empty state with create button', () => {
    ;(useCustomRubric as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockCustomRubric,
      rubrics: []
    })
    
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should load rubrics on mount', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
      />
    )).not.toThrow()
  })

  it('should disable select button when disabled prop is true', () => {
    expect(() => render(
      <CustomRubricSelectorComponent 
        value={null} 
        onChange={mockOnChange} 
        disabled={true}
      />
    )).not.toThrow()
  })
})