/**
 * Test utility for debugging SWR abort signal issues
 * This helps identify when and why requests are being aborted
 */

export function debugAbortSignal(url: string, reason?: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] Request to ${url} - ${reason || 'Starting'}`)
  }
  
  return {
    onAbort: (signal: AbortSignal) => {
      signal.addEventListener('abort', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[DEBUG] Request to ${url} was aborted - Reason: ${signal.reason || 'Unknown'}`)
        }
      })
    },
    onComplete: () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG] Request to ${url} completed successfully`)
      }
    },
    onError: (error: Error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[DEBUG] Request to ${url} failed:`, error.message)
      }
    }
  }
}

/**
 * Enhanced error logger for SWR hooks
 */
export function logSWRError(hookName: string, error: any, context?: Record<string, any>) {
  // Don't log abort errors in production
  if (error?.isAborted && process.env.NODE_ENV === 'production') {
    return
  }

  const errorInfo = {
    hook: hookName,
    message: error?.message || 'Unknown error',
    status: error?.status,
    isAborted: error?.isAborted,
    isNetworkError: error?.isNetworkError,
    timestamp: new Date().toISOString(),
    ...context
  }

  if (error?.isAborted) {
    console.warn(`[SWR] ${hookName} - Request aborted:`, errorInfo)
  } else {
    console.error(`[SWR] ${hookName} - Error:`, errorInfo)
  }
}
