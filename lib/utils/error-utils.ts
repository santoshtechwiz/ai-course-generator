/**
 * Utility functions for error handling throughout the application
 */

/**
 * Formats an error message with context
 * @param error The error object
 * @param context The context in which the error occurred
 * @returns A formatted error message
 */
export function formatErrorMessage(error: unknown, context: string): string {
  return `Failed to ${context}. ${
    error instanceof Error ? `Original error: ${error.message}` : "Unknown error occurred."
  }`
}

/**
 * Logs an error to the console with context
 * @param error The error object
 * @param context The context in which the error occurred
 */
export function logError(error: unknown, context: string): void {
  console.error(`Error ${context}:`, error)

  // Add additional logging for specific error types
  if (error instanceof Error) {
    if (error.stack) {
      console.debug(`Stack trace for error ${context}:`, error.stack)
    }

    // Log additional properties for specific error types
    if ("code" in error) {
      console.error(`Error code: ${(error as any).code}`)
    }
  }
}

/**
 * Executes a database operation with error handling
 * @param operation The database operation to execute
 * @param errorContext The context for error messages
 * @returns A result object with success status and data or error
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorContext: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    logError(error, errorContext)
    return {
      success: false,
      error: formatErrorMessage(error, errorContext),
    }
  }
}

/**
 * Maps error messages to HTTP status codes
 * @param errorMessage The error message
 * @returns The appropriate HTTP status code
 */
export function getErrorStatusCode(errorMessage: string): number {
  const statusMap: Record<string, number> = {
    Unauthorized: 401,
    "Authentication required": 401,
    "Not found": 404,
    "Course not found": 404,
    "Quiz not found": 404,
    "User not found": 404,
    Forbidden: 403,
    "Insufficient credits": 403,
    "Invalid request": 400,
    "Validation error": 400,
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(statusMap)) {
    if (errorMessage.includes(key)) {
      return value
    }
  }

  return 500 // Default to internal server error
}
