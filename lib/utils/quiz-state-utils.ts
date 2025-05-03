import type { QuizState } from "@/store/slices/quizSlice"

/**
 * Utility functions for managing quiz state transitions
 */

/**
 * Determine the display state based on quiz state
 */
export function determineDisplayState(
  state: QuizState,
  isAuthenticated: boolean,
  isReturningFromAuth: boolean,
): "quiz" | "results" | "auth" | "loading" | "saving" | "preparing" {
  // Processing auth return
  if (state.isProcessingAuth || isReturningFromAuth) {
    return "preparing"
  }

  // Loading state
  if (state.isLoading || state.isLoadingResults) {
    return "loading"
  }

  // Saving results
  if (state.savingResults) {
    return "saving"
  }

  // Completed quiz states
  if (state.isCompleted) {
    // If user is authenticated, always show results
    if (isAuthenticated) {
      return "results"
    }

    // For guest users, require authentication to view results
    return "auth"
  }

  // Default to quiz
  return "quiz"
}

/**
 * Calculate quiz score from answers
 */
export function calculateQuizScore(answers: any[], totalQuestions: number): number {
  const correctAnswers = answers.filter((a) => a?.isCorrect).length
  return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
}

/**
 * Calculate total time spent on quiz
 */
export function calculateTotalTime(answers: any[]): number {
  return answers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)
}

/**
 * Validate quiz data is complete and ready for initialization
 */
export function validateInitialQuizData(quizData: any): { isValid: boolean; error?: string } {
  if (!quizData) {
    return { isValid: false, error: "Quiz data is missing" }
  }

  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return { isValid: false, error: "Quiz questions are missing or invalid" }
  }

  return { isValid: true }
}

/**
 * Create a safe quiz data object with defaults for missing values
 */
export function createSafeQuizData(quizData: any, slug: string, quizType: string): any {
  return {
    id: quizData?.id || quizData?.quizId || "unknown",
    quizId: quizData?.id || quizData?.quizId || "unknown",
    title: quizData?.title || "Quiz",
    slug: slug || "unknown",
    quizType: quizType || "mcq",
    description: quizData?.description || "",
    questions: quizData?.questions || [],
    isPublic: quizData?.isPublic || false,
    isFavorite: quizData?.isFavorite || false,
    userId: quizData?.userId || "",
    difficulty: quizData?.difficulty || "medium",
  }
}
