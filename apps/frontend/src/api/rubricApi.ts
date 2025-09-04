import apiClient from './axios';
import type {
  ApiResponse,
  CustomRubric,
  CreateRubricPayload,
  UpdateRubricPayload,
} from '@/types';

/** Fetches all custom rubrics for the current user. */
export const getCustomRubrics = async (): Promise<CustomRubric[]> => {
  const { data } = await apiClient.get<ApiResponse<CustomRubric[]>>('/custom-rubrics');
  return data.data;
};

/** Fetches a single custom rubric by its ID. */
export const getCustomRubricById = async (rubricId: string): Promise<CustomRubric> => {
  const { data } = await apiClient.get<ApiResponse<CustomRubric>>(`/custom-rubrics/${rubricId}`);
  return data.data;
};

/** Creates a new custom rubric. */
export const createCustomRubric = async (rubricData: CreateRubricPayload): Promise<CustomRubric> => {
  const { data } = await apiClient.post<ApiResponse<CustomRubric>>('/custom-rubrics', rubricData);
  return data.data;
};

/** Updates an existing custom rubric. */
export const updateCustomRubric = async (
  rubricId: string,
  rubricData: UpdateRubricPayload
): Promise<CustomRubric> => {
  const { data } = await apiClient.put<ApiResponse<CustomRubric>>(
    `/custom-rubrics/${rubricId}`,
    rubricData
  );
  return data.data;
};

/** Deletes a custom rubric. */
export const deleteCustomRubric = async (rubricId: string): Promise<void> => {
  await apiClient.delete(`/custom-rubrics/${rubricId}`);
};
