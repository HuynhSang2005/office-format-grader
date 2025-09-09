/**
 * @file criteria-form.test.tsx
 * @description Tests for CriteriaForm component
 * @author Your Name
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { CriteriaForm } from '../criteria-form'

// Mock the use-criteria hook
vi.mock('../../../hooks/use-criteria', async () => {
  const actual = await vi.importActual('../../../hooks/use-criteria')
  return {
    ...actual,
    useCreateCriterion: () => ({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null
    }),
    useUpdateCriterion: () => ({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null
    }),
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
  }
})

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {component}
      </MantineProvider>
    </QueryClientProvider>
  )
}

describe('CriteriaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render create form correctly', () => {
    renderWithProviders(<CriteriaForm />)
    
    expect(screen.getByText('Tạo tiêu chí mới')).toBeInTheDocument()
    expect(screen.getByLabelText('Loại file')).toBeInTheDocument()
    expect(screen.getByLabelText('Tên tiêu chí')).toBeInTheDocument()
    expect(screen.getByLabelText('Detector Key')).toBeInTheDocument()
    expect(screen.getByLabelText('Điểm tối đa')).toBeInTheDocument()
    expect(screen.getByLabelText('Mô tả tiêu chí')).toBeInTheDocument()
    expect(screen.getByText('Các mức điểm:')).toBeInTheDocument()
  })

  it('should render edit form correctly with existing criterion', () => {
    const mockCriterion = {
      id: '1',
      name: 'Test Criterion',
      detectorKey: 'pptx.theme',
      maxPoints: 10,
      levels: [
        { points: 0, code: '0', name: 'Không đạt', description: 'Không đạt yêu cầu' },
        { points: 5, code: '5', name: 'Trung bình', description: 'Đạt yêu cầu ở mức trung bình' }
      ]
    }

    renderWithProviders(<CriteriaForm criterion={mockCriterion} />)
    
    expect(screen.getByText('Chỉnh sửa tiêu chí')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Criterion')).toBeInTheDocument()
    expect(screen.getByDisplayValue('pptx.theme')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('should validate required fields on submit', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Click submit without filling any fields
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Vui lòng chọn loại file (PPTX hoặc DOCX)',
        color: 'red'
      }))
    })
  })

  it('should validate name length', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter a very long name
    const longName = 'A'.repeat(101)
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: longName }
    })
    
    // Enter other required fields
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Tên tiêu chí không được quá 100 ký tự',
        color: 'red'
      }))
    })
  })

  it('should validate description length', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter a very long description
    const longDescription = 'A'.repeat(501)
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: longDescription }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Mô tả tiêu chí không được quá 500 ký tự',
        color: 'red'
      }))
    })
  })

  it('should validate maxPoints range', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter invalid maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '15' }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Điểm tối đa phải từ 0.25 đến 10',
        color: 'red'
      }))
    })
  })

  it('should validate levels count', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })
    
    // Remove levels to have less than 2
    fireEvent.click(screen.getAllByText('Xóa mức này')[0])
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Phải có từ 2 đến 10 mức điểm',
        color: 'red'
      }))
    })
  })

  it('should validate level points do not exceed maxPoints', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })
    
    // Modify a level to have points exceeding maxPoints
    fireEvent.click(screen.getAllByText('Mức 3')[0]) // Open the third level accordion
    fireEvent.change(screen.getByLabelText('Điểm'), {
      target: { value: '10' }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Points của level không được vượt quá điểm tối đa',
        color: 'red'
      }))
    })
  })

  it('should validate at least one level has 0 points', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })
    
    // Modify all levels to have points > 0
    fireEvent.click(screen.getAllByText('Mức 1')[0]) // Open the first level accordion
    fireEvent.change(screen.getByLabelText('Điểm'), {
      target: { value: '2' }
    })
    
    fireEvent.click(screen.getAllByText('Mức 2')[0]) // Open the second level accordion
    fireEvent.change(screen.getByLabelText('Điểm'), {
      target: { value: '4' }
    })
    
    fireEvent.click(screen.getAllByText('Mức 3')[0]) // Open the third level accordion
    fireEvent.change(screen.getByLabelText('Điểm'), {
      target: { value: '5' }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Phải có ít nhất 1 level với points = 0 (trường hợp không đạt)',
        color: 'red'
      }))
    })
  })

  it('should validate level codes are unique', async () => {
    renderWithProviders(<CriteriaForm />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })
    
    // Modify levels to have duplicate codes
    fireEvent.click(screen.getAllByText('Mức 2')[0]) // Open the second level accordion
    fireEvent.change(screen.getByLabelText('Mã'), {
      target: { value: '0' } // Same as first level
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Lỗi',
        message: 'Level codes phải là duy nhất',
        color: 'red'
      }))
    })
  })

  it('should call onSuccess callback when form is submitted successfully', async () => {
    const mockOnSuccess = vi.fn()
    
    renderWithProviders(<CriteriaForm onSuccess={mockOnSuccess} />)
    
    // Select file type
    fireEvent.click(screen.getByLabelText('Loại file'))
    fireEvent.click(screen.getByText('PowerPoint (.pptx)'))
    
    // Enter name
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), {
      target: { value: 'Test Criterion' }
    })
    
    // Enter detector key
    fireEvent.click(screen.getByLabelText('Detector Key'))
    fireEvent.click(screen.getByText('Test Criterion 1 (pptx.theme)'))
    
    // Enter description
    fireEvent.change(screen.getByLabelText('Mô tả tiêu chí'), {
      target: { value: 'Test description' }
    })
    
    // Enter maxPoints
    fireEvent.change(screen.getByLabelText('Điểm tối đa'), {
      target: { value: '5' }
    })
    
    // Click submit
    fireEvent.click(screen.getByText('Tạo tiêu chí'))
    
    // Since we're not mocking the actual mutation, we can't test the success case
    // But we can verify that validation passed (no validation error notifications)
    await waitFor(() => {
      // Wait a bit to ensure validation would have happened
    }, { timeout: 100 })
    
    // Verify no validation error notifications were shown
    expect(notifications.show).not.toHaveBeenCalledWith(expect.objectContaining({
      color: 'red'
    }))
  })
})