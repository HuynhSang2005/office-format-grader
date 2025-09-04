import apiClient from './axios';

interface ExportResponse {
  success: boolean;
  filename: string;
  resultCount: number;
}

/**
 * Requests the backend to generate an Excel export file from a list of result IDs.
 * @param resultIds An array of grade result IDs to include in the export.
 * @returns A promise that resolves with the filename of the generated Excel file.
 */
export const exportGradesToExcel = async (resultIds: string[]): Promise<string> => {
  const payload = {
    resultIds,
    includeDetails: true,
    format: 'xlsx',
  };
  const { data } = await apiClient.post<ExportResponse>('/export', payload);
  if (data.success) {
    return data.filename;
  }
  throw new Error('Export failed on the server.');
};
