// Get API base URL from environment variable and normalize it
// Remove trailing slash to prevent double slashes
const normalizeUrl = (url) => {
  if (!url) return 'http://localhost:5000';
  return url.replace(/\/+$/, ''); // Remove all trailing slashes
};

const API_BASE_URL = normalizeUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

console.log('🌐 API Base URL:', API_BASE_URL);

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

// Enhanced API call with automatic retry for cold starts
export const apiCall = async (url, options = {}, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 API call attempt ${attempt}/${maxRetries}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      // If response is ok, return the data
      if (response.ok) {
        console.log(`✅ API call successful`);
        return await response.json();
      }
      
      // If it's a server error and we have retries left, try again
      if (response.status >= 500 && attempt < maxRetries) {
        console.log(`⚠️ Server error (${response.status}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
        continue;
      }
      
      // Otherwise, return the response (might be 400, 401, etc)
      return await response.json();
      
    } catch (error) {
      console.error(`❌ API call attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // If we have more retries, wait and try again
      if (attempt < maxRetries) {
        const delay = 1500 * attempt; // 1.5s, 3s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error('💥 All API call attempts failed');
  throw lastError || new Error('API call failed after retries');
};

