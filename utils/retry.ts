const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface RetryConfig {
  maxRetries?: number
  initialDelay?: number
  shouldRetry?: (error: any) => boolean
  onRetry?: (error: any, attempt: number) => void
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  shouldRetry: (error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    return true
  },
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt + 1} after error:`, error)
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config }
  let lastError: any = null

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = finalConfig.initialDelay * Math.pow(2, attempt - 1)
        await sleep(delay)
        finalConfig.onRetry(lastError, attempt)
      }

      return await operation()
    } catch (error) {
      lastError = error
      
      // On last attempt, or if we shouldn't retry, throw the error
      if (
        attempt === finalConfig.maxRetries - 1 || 
        !finalConfig.shouldRetry(error)
      ) {
        throw error
      }
    }
  }

  throw lastError
}