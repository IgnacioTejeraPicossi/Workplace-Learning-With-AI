// frontend/src/api/apiInterceptor.js
import { authApi } from './authApi';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

// Keep access token in memory (not localStorage for security)
let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

// Enhanced fetch with automatic token refresh
export const apiFetch = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    credentials: 'include', // Important for refresh token cookies
    ...options,
    headers,
  };

  try {
    const response = await fetch(fullUrl, config);
    
    // If 401 and we have a token, try to refresh
    if (response.status === 401 && accessToken) {
      try {
        // Prevent multiple simultaneous refresh attempts
        if (!refreshPromise) {
          refreshPromise = authApi.refresh();
        }
        
        const refreshResult = await refreshPromise;
        refreshPromise = null;
        
        // Update token and retry request
        setAccessToken(refreshResult.access_token);
        config.headers.Authorization = `Bearer ${refreshResult.access_token}`;
        
        return fetch(fullUrl, config);
      } catch (refreshError) {
        refreshPromise = null;
        clearAccessToken();
        // Redirect to login or handle auth failure
        window.location.href = '/login';
        throw refreshError;
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (url, options = {}) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (url, options = {}) => apiFetch(url, { ...options, method: 'DELETE' }),
  patch: (url, data, options = {}) => apiFetch(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// Helper to handle API responses
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

// Wrapper for common API calls with error handling
export const apiCall = async (apiMethod, ...args) => {
  try {
    const response = await apiMethod(...args);
    return await handleApiResponse(response);
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
