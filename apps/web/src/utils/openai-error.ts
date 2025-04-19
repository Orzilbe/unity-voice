export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export async function handleOpenAIError(error: any): Promise<never> {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 429: // Rate limit
        const retryAfter = error.response.headers['retry-after'];
        throw new OpenAIError(
          'OpenAI API rate limit exceeded',
          429,
          parseInt(retryAfter || '60')
        );

      case 401: // Authentication
        throw new OpenAIError('Invalid OpenAI API key', 401);

      case 503: // Service unavailable
        throw new OpenAIError('OpenAI service is currently unavailable', 503);

      default:
        throw new OpenAIError(
          data.error?.message || 'OpenAI API error',
          status
        );
    }
  } else if (error.request) {
    // Network error
    throw new OpenAIError('Network error while calling OpenAI API', 500);
  } else {
    // Other errors
    throw new OpenAIError(error.message || 'Unknown error occurred', 500);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof OpenAIError && error.retryAfter) {
        // Wait for the specified retry time
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
      } else {
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
} 