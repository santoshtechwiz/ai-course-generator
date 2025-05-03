/**
 * Standardized error types for quiz-related errors
 */
export enum QuizErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  SERVER = "server",
  UNKNOWN = "unknown",
}

/**
 * Interface for standardized quiz errors
 */
export interface QuizError {
  type: QuizErrorType
  message: string
  details?: any
  retry?: boolean
}

/**
 * Create a standardized quiz error
 */
export function createQuizError(type: QuizErrorType, message: string, details?: any, retry = false): QuizError {
  return {
    type,
    message,
    details,
    retry,
  }
}

/**
 * Handle API errors from fetch responses
 */
export async function handleApiError(response: Response): Promise<QuizError> {
  try {
    const data = await response.json()
    const errorMessage = data.error || data.message || `Error: ${response.status} ${response.statusText}`

    // Map HTTP status codes to error types
    let errorType = QuizErrorType.UNKNOWN
    let canRetry = false

    switch (response.status) {
      case 400:
        errorType = QuizErrorType.VALIDATION
        break
      case 401:
        errorType = QuizErrorType.AUTHENTICATION
        break
      case 403:
        errorType = QuizErrorType.AUTHORIZATION
        break
      case 404:
        errorType = QuizErrorType.NOT_FOUND
        break
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = QuizErrorType.SERVER
        canRetry = true
        break
      default:
        if (response.status >= 500) {
          errorType = QuizErrorType.SERVER
          canRetry = true
        }
    }

    return createQuizError(errorType, errorMessage, data, canRetry)
  } catch (error) {
    // If we can't parse the JSON, return a generic error
    return createQuizError(
      QuizErrorType.UNKNOWN,
      `Error ${response.status}: ${response.statusText || "Unknown error"}`,
      null,
      response.status >= 500,
    )
  }
}

/**
 * Handle fetch errors (network errors, etc.)
 */
export function handleFetchError(error: any): QuizError {
  // Network errors can be retried
  if (error.name === "AbortError") {
    return createQuizError(
      QuizErrorType.NETWORK,
      "Request timed out. Please check your connection and try again.",
      error,
      true,
    )
  }

  if (error.name === "TypeError" && error.message.includes("NetworkError")) {
    return createQuizError(
      QuizErrorType.NETWORK,
      "Network error. Please check your connection and try again.",
      error,
      true,
    )
  }

  return createQuizError(QuizErrorType.UNKNOWN, error.message || "An unexpected error occurred", error, false)
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: QuizError): string {
  switch (error.type) {
    case QuizErrorType.NETWORK:
      return "Network error. Please check your connection and try again."
    case QuizErrorType.VALIDATION:
      return error.message || "Invalid input. Please check your data and try again."
    case QuizErrorType.AUTHENTICATION:
      return "You need to be signed in to perform this action."
    case QuizErrorType.AUTHORIZATION:
      return "You don't have permission to perform this action."
    case QuizErrorType.NOT_FOUND:
      return "The requested resource was not found."
    case QuizErrorType.SERVER:
      return "Server error. Please try again later."
    default:
      return error.message || "An unexpected error occurred."
  }
}
