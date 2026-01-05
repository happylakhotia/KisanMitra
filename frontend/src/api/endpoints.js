// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE: `${API_BASE_URL}/api/user/update`,
  },
  DISEASE: {
    PREDICT: `${API_BASE_URL}/api/disease/predict`,
  },
  PEST: {
    PREDICT: `${API_BASE_URL}/api/pest/predict`,
  },
  NDVI: {
    ANALYZE: `${API_BASE_URL}/api/analyze-ndvi`,
  },
  AI: {
    GENERATE: `${API_BASE_URL}/api/ai/generate`,
    ALERT_DESCRIPTIONS: `${API_BASE_URL}/api/ai/alert-descriptions`,
  },
  REPORT: {
    GENERATE: `${API_BASE_URL}/api/report/generate`,
  },
};

// Export the base URL for direct API calls
export { API_BASE_URL };

export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

