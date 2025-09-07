/**
 * @file use-custom-rubric.test.ts
 * @description Unit tests for useCustomRubric hook
 * @author Your Name
 */

import { renderHookWithProviders as renderHook } from '../../tests/test-utils'
import { useCustomRubric } from '../use-custom-rubric'
import { useRubricStore } from '../../stores/rubric.store'
import { useAuthStore } from '../../stores/auth.store'
import { vi } from 'vitest'

// Mock the stores
vi.mock('../../stores/rubric.store', () => ({
  useRubricStore: vi.fn()
}))

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn()
}))

describe('useCustomRubric', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockRubrics = [
    { id: 'rubric-1', name: 'Test Rubric 1', ownerId: 'user-123' },
    { id: 'rubric-2', name: 'Test Rubric 2', ownerId: 'user-123' }
  ]
  const mockCurrentRubric = mockRubrics[0]
  
  const mockRubricStore = {
    rubrics: mockRubrics,
    currentRubric: mockCurrentRubric,
    loading: false,
    error: null,
    listRubrics: vi.fn().mockResolvedValue({ data: mockRubrics, total: mockRubrics.length }),
    getRubric: vi.fn().mockResolvedValue(mockCurrentRubric),
    setCurrentRubric: vi.fn(),
    clearError: vi.fn()
  }
  
  const mockAuthStore = {
    user: mockUser
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRubricStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockRubricStore)
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthStore)
  })

  it('should return rubric store values', () => {
    const { result } = renderHook(() => useCustomRubric())
    
    expect(result.current.rubrics).toEqual(mockRubrics)
    expect(result.current.currentRubric).toEqual(mockCurrentRubric)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should call listRubrics when loadRubrics is called', () => {
    const { result } = renderHook(() => useCustomRubric())
    
    result.current.loadRubrics()
    
    expect(mockRubricStore.listRubrics).toHaveBeenCalledWith({ ownerId: 'user-123' })
  })

  it('should call getRubric when loadRubric is called', () => {
    const { result } = renderHook(() => useCustomRubric())
    
    result.current.loadRubric('rubric-1')
    
    expect(mockRubricStore.getRubric).toHaveBeenCalledWith('rubric-1')
  })

  it('should call setCurrentRubric when selectRubric is called', () => {
    const { result } = renderHook(() => useCustomRubric())
    const newRubric = mockRubrics[1]
    
    result.current.selectRubric(newRubric)
    
    expect(mockRubricStore.setCurrentRubric).toHaveBeenCalledWith(newRubric)
  })

  it('should call clearError when clearError is called', () => {
    const { result } = renderHook(() => useCustomRubric())
    
    result.current.clearError()
    
    expect(mockRubricStore.clearError).toHaveBeenCalled()
  })
})