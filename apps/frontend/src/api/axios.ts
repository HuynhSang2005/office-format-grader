import axios from 'axios';

/**
 * Centralized Axios instance for API communication.
 * Configured with a base URL and to include credentials (cookies) with every request.
 */
const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default apiClient;
