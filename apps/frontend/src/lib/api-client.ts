/**
 * @file api-client.ts
 * @description Axios instance configuration with interceptors
 * @author Nguyễn Huỳnh Sang
 */

import axios from 'axios'
import { env } from '../config/env'

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 30000, // Increase timeout to 30 seconds for better handling of slow requests
  withCredentials: true, // Required for cookie-based auth
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to request for debugging
    config.headers['X-Request-Time'] = new Date().toISOString()
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Add timing information for debugging
    response.headers['X-Response-Time'] = new Date().toISOString()
    return response
  },
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear auth state
      localStorage.removeItem('auth-storage')
      // Instead of redirecting here, we'll throw a specific error
      // that can be caught and handled by the calling component
      throw new Error('UNAUTHORIZED')
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
      throw new Error('NETWORK_ERROR')
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message === 'timeout') {
      console.error('Request timeout:', error.message)
      throw new Error('TIMEOUT_ERROR')
    }
    
    return Promise.reject(error)
  },
)