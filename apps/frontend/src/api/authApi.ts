import apiClient from './axios';
import type { AuthResponse } from '@/types';

// Temporary: Define credentials type here, will move to a dedicated types file later
type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Logs in a user.
 * The backend will set an HttpOnly cookie upon successful login.
 * @param credentials The user's email and password.
 * @returns The user information upon successful login.
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
};
