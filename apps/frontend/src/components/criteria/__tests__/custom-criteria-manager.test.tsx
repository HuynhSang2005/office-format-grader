/**
 * @file custom-criteria-manager.test.tsx
 * @description Tests for CustomCriteriaManager component
 * @author Your Name
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomCriteriaManager } from '../custom-criteria-manager'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'

// Mock the useSupportedCriteria hook
vi.mock('../../../hooks/use-criteria', () => ({
  useSupportedCriteria: () => ({
    data: [
      {
        id: 'test-criterion-1',
        name: 'Test Criterion 1',
        detectorKey: 'pptx.theme',
        description: 'Test criterion description',
        maxPoints: 10,
        levels: [
          { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
          { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' },
          { points: 10, code: '10', name: 'Tốt', description: 'Đạt yêu cầu tốt' }
        ]
      }
    ],
    isLoading: false
  })
}))

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {component}
      </MantineProvider>
    </QueryClientProvider>
  )
}

describe('CustomCriteriaManager', () => {
  const mockOnCriteriaChange = vi.fn()
  const initialCriteria = []

  it('renders correctly with no criteria', () => {
    renderWithProviders(
      <CustomCriteriaManager 
        criteria={initialCriteria} 
        onCriteriaChange={mockOnCriteriaChange} 
      />
    )

    expect(screen.getByText('Tiêu chí tùy chỉnh')).toBeInTheDocument()
    expect(screen.getByText('Chưa có tiêu chí tùy chỉnh nào.')).toBeInTheDocument()
  })

  it('allows adding a new criterion', async () => {
    renderWithProviders(
      <CustomCriteriaManager 
        criteria={initialCriteria} 
        onCriteriaChange={mockOnCriteriaChange} 
      />
    )

    // Click the "Thêm tiêu chí" button
    fireEvent.click(screen.getByText('Thêm tiêu chí'))

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'New Test Criterion' }
    })
    
    fireEvent.change(screen.getByLabelText('Detector Key'), {
      target: { value: 'pptx.test' }
    })
    
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })

    // Click the save button
    fireEvent.click(screen.getByText('Thêm'))

    // Verify the callback was called
    await waitFor(() => {
      expect(mockOnCriteriaChange).toHaveBeenCalled()
    })
  })

  it('displays fixed criteria when file type is provided', () => {
    renderWithProviders(
      <CustomCriteriaManager 
        criteria={initialCriteria} 
        onCriteriaChange={mockOnCriteriaChange} 
        fileType="PPTX"
      />
    )

    // Check that the button to show fixed criteria is present
    expect(screen.getByText('Hiển thị tiêu chí cố định')).toBeInTheDocument()
  })

  it('allows adding fixed criteria', async () => {
    renderWithProviders(
      <CustomCriteriaManager 
        criteria={initialCriteria} 
        onCriteriaChange={mockOnCriteriaChange} 
        fileType="PPTX"
      />
    )

    // Click to show fixed criteria
    fireEvent.click(screen.getByText('Hiển thị tiêu chí cố định'))

    // Wait for the fixed criteria to load and be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Criterion 1')).toBeInTheDocument()
    })

    // Click the "Thêm vào rubric" button for the first fixed criterion
    fireEvent.click(screen.getByText('Thêm vào rubric'))

    // Verify the callback was called
    await waitFor(() => {
      expect(mockOnCriteriaChange).toHaveBeenCalled()
    })
  })
})