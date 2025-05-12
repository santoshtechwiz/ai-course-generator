export function calculateTotalTime(answers: any[]): number {
  if (!Array.isArray(answers)) return 0
  return answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0)
}

export function formatQuizTime(timeInMs: number): string {
  if (!timeInMs) return "0s"

  const seconds = Math.floor(timeInMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}

export const quizApi = {
  submitQuiz: async (
    quizId: string,
    slug: string,
    quizType: string,
    answers: any[],
    score: number,
    totalTime: number,
    totalQuestions: number,
  ) => {
    // Implementation would depend on your API
    try {
      // Mock implementation
      return {
        success: true,
        quizId,
        score,
        completedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      throw error
    }
  },
}

export enum QuizErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NOT_FOUND = "not_found",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export function createQuizError(type: QuizErrorType, message: string, originalError?: any, isUserFriendly = false) {
  return {
    type,
    message,
    originalError,
    isUserFriendly,
  }
}

export function getUserFriendlyErrorMessage(error: any): string {
  if (error?.isUserFriendly) {
    return error.message
  }

  switch (error?.type) {
    case QuizErrorType.NETWORK:
      return "Network error. Please check your internet connection and try again."
    case QuizErrorType.VALIDATION:
      return "Invalid input. Please check your answers and try again."
    case QuizErrorType.AUTHENTICATION:
      return "Authentication required. Please sign in to continue."
    case QuizErrorType.AUTHORIZATION:
      return "You don't have permission to access this quiz."
    case QuizErrorType.NOT_FOUND:
      return "Quiz not found. It may have been removed or is unavailable."
    case QuizErrorType.SERVER:
      return "Server error. Please try again later."
    default:
      return "An unexpected error occurred. Please try again later."
  }
}
