/**
 * @file rubric.store.ts
 * @description Custom rubric Zustand store
 * @author Nguyễn Huỳnh Sang
 */

import { create } from 'zustand'
import { apiClient } from '../lib/api-client'
import { 
  CreateCustomRubricSchema,
  UpdateCustomRubricSchema,
  ListCustomRubricsQuerySchema,
  type CreateCustomRubricRequest,
  type UpdateCustomRubricRequest,
  type ListCustomRubricsQuery,
  type CustomRubricResponse,
  type CreateCustomRubricResponse,
  type UpdateCustomRubricResponse,
  type DeleteCustomRubricResponse,
  type GetCustomRubricResponse,
  type ListCustomRubricsResponse,
  type ValidateCustomRubricResponse
} from '../schemas/custom-rubric.schema'

interface RubricState {
  rubrics: CustomRubricResponse[]
  currentRubric: CustomRubricResponse | null
  loading: boolean
  error: string | null
  createRubric: (data: CreateCustomRubricRequest) => Promise<CreateCustomRubricResponse>
  updateRubric: (id: string, data: UpdateCustomRubricRequest) => Promise<UpdateCustomRubricResponse>
  deleteRubric: (id: string) => Promise<DeleteCustomRubricResponse>
  getRubric: (id: string) => Promise<GetCustomRubricResponse>
  listRubrics: (query: ListCustomRubricsQuery) => Promise<ListCustomRubricsResponse>
  validateRubric: (rubric: unknown) => Promise<ValidateCustomRubricResponse>
  setCurrentRubric: (rubric: CustomRubricResponse | null) => void
  clearError: () => void
}

export const useRubricStore = create<RubricState>((set, get) => ({
  rubrics: [],
  currentRubric: null,
  loading: false,
  error: null,
  
  createRubric: async (data) => {
    set({ loading: true, error: null })
    try {
      // Validate data with Zod before sending
      const validatedData = CreateCustomRubricSchema.parse(data)
      
      const response = await apiClient.post<CreateCustomRubricResponse>(
        '/api/custom-rubrics',
        validatedData
      )
      
      const parsedResponse = response.data
      set({ 
        loading: false,
        rubrics: [...get().rubrics, parsedResponse.data]
      })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  updateRubric: async (id, data) => {
    set({ loading: true, error: null })
    try {
      // Validate data with Zod before sending
      const validatedData = UpdateCustomRubricSchema.parse(data)
      
      const response = await apiClient.put<UpdateCustomRubricResponse>(
        `/api/custom-rubrics/${id}`,
        validatedData
      )
      
      const parsedResponse = response.data
      set({ 
        loading: false,
        rubrics: get().rubrics.map(rubric => 
          rubric.id === id ? parsedResponse.data : rubric
        ),
        currentRubric: get().currentRubric?.id === id ? parsedResponse.data : get().currentRubric
      })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  deleteRubric: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.delete<DeleteCustomRubricResponse>(
        `/api/custom-rubrics/${id}`
      )
      
      const parsedResponse = response.data
      set({ 
        loading: false,
        rubrics: get().rubrics.filter(rubric => rubric.id !== id),
        currentRubric: get().currentRubric?.id === id ? null : get().currentRubric
      })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  getRubric: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<GetCustomRubricResponse>(
        `/api/custom-rubrics/${id}`
      )
      
      const parsedResponse = response.data
      set({ 
        loading: false,
        currentRubric: parsedResponse.data
      })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  listRubrics: async (query) => {
    set({ loading: true, error: null })
    try {
      // Validate query with Zod
      const validatedQuery = ListCustomRubricsQuerySchema.parse(query)
      
      const response = await apiClient.get<ListCustomRubricsResponse>(
        '/api/custom-rubrics',
        { params: validatedQuery }
      )
      
      const parsedResponse = response.data
      set({ 
        loading: false,
        rubrics: parsedResponse.data
      })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  validateRubric: async (rubric) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ValidateCustomRubricResponse>(
        '/api/custom-rubrics/validate',
        rubric
      )
      
      const parsedResponse = response.data
      set({ loading: false })
      return parsedResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi validate rubric'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
  
  setCurrentRubric: (rubric) => {
    set({ currentRubric: rubric })
  },
  
  clearError: () => {
    set({ error: null })
  }
}))