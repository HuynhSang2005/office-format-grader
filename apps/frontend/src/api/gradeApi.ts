import apiClient from './axios';
import type { UploadResponse, GradeFileResponse } from '@/types';

/**
 * Uploads a single file to the server.
 * The file is sent as multipart/form-data.
 * @param file The file object to upload.
 * @returns A promise that resolves with the upload response data.
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

interface GradePayload {
  fileId: string;
  rubricId?: string;
}

/**
 * Requests the backend to grade a previously uploaded file using a specific or default rubric.
 * @param payload Object containing fileId and optional rubricId.
 * @returns A promise that resolves with the detailed grade result.
 */
export const gradeFile = async ({ fileId, rubricId }: GradePayload): Promise<GradeFileResponse> => {
  // We use the /grade/custom endpoint as it's the most flexible.
  const payload = {
    files: [fileId],
    rubricId: rubricId,
  };
  const { data } = await apiClient.post<GradeFileResponse>('/grade/custom', payload);
  return data;
};
