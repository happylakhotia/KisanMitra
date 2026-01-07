/**
 * Helper function to fetch from HuggingFace with retry logic
 * Handles cold starts and timeouts gracefully
 */
export async function fetchHuggingFaceWithRetry(url, options = {}, maxRetries = 3, timeout = 50000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for HuggingFace model`);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ HuggingFace request successful');
      return response;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Check if it's an abort error (timeout)
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      }
      
      if (attempt === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${error.message}. ` +
          'The model may be starting up. Please try again in a few seconds.'
        );
      }
      
      // Exponential backoff before retry
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Show user-friendly loading messages based on elapsed time
 */
export function getLoadingMessage(elapsedSeconds) {
  if (elapsedSeconds < 5) {
    return 'Analyzing...';
  } else if (elapsedSeconds < 15) {
    return 'Model is starting up, please wait...';
  } else if (elapsedSeconds < 30) {
    return 'Still processing, almost done...';
  } else {
    return 'This is taking longer than expected, but still trying...';
  }
}

/**
 * Format HuggingFace error for user display
 */
export function formatHuggingFaceError(error) {
  if (error.message.includes('Failed after')) {
    return {
      title: 'Model Starting Up',
      message: 'The AI model is waking up from sleep. Please try again in 10-15 seconds.',
      action: 'Try Again'
    };
  }
  
  if (error.message.includes('timeout') || error.message.includes('aborted')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. The model might be cold starting.',
      action: 'Try Again'
    };
  }
  
  if (error.message.includes('HTTP 503')) {
    return {
      title: 'Model Unavailable',
      message: 'The AI model is temporarily unavailable. Please try again shortly.',
      action: 'Retry'
    };
  }
  
  return {
    title: 'Request Failed',
    message: error.message || 'An unexpected error occurred.',
    action: 'Try Again'
  };
}


