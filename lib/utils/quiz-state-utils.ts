import { QuizDataInput } from "@/app/types/quiz-types"


/**
 * Determine the display state of the quiz
 */
export function determineDisplayState(state: any, isAuthenticated: boolean, isReturningFromAuth: boolean): string {
  // Handle authentication flow
  if (state.isProcessingAuth) {
    return "preparing"
  }

  if (isReturningFromAuth) {
    return "preparing"
  }

  // Handle loading states
  if (state.isLoading) {
    return "loading"
  }

  if (state.isLoadingResults) {
    return "loading"
  }

  // Handle saving state
  if (state.isSavingResults) {
    return "saving"
  }

  // Handle results state
  if (state.isCompleted) {
    if (state.requiresAuth && !isAuthenticated) {
      return "auth"
    }
    return "results"
  }

  // Default to quiz state
  return "quiz"
}

/**
 * Calculate the quiz score based on answers
 */
export function calculateQuizScore(answers: any[], totalQuestions: number): number {
  if (!answers || answers.length === 0 || totalQuestions === 0) {
    return 0
  }

  const correctCount = answers.filter((a) => a && a.isCorrect).length
  return Math.round((correctCount / totalQuestions) * 100)
}

/**
 * Calculate the total time spent on the quiz
 */
export function calculateTotalTime(answers: any[]): number {
  if (!answers || answers.length === 0) {
    return 0
  }

  return answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
}

/**
 * Validate initial quiz data
 */
export function validateInitialQuizData(quizData: QuizDataInput | null): { isValid: boolean; error?: string } {
  if (!quizData) {
    return {
      isValid: false,
      error: "Quiz data is missing",
    }
  }

  if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return {
      isValid: false,
      error: "Quiz questions are missing or invalid",
    }
  }

  return { isValid: true }
}

/**
 * Create safe quiz data with defaults
 */
export function createSafeQuizData(quizData: QuizDataInput | null, slug: string, quizType: string): QuizDataInput {
  const safeData: QuizDataInput = {
    id: "unknown",
    quizId: "unknown",
    title: "Quiz",
    description: "",
    quizType: quizType || "mcq",
    slug: slug || "unknown",
    difficulty: "medium",
    isPublic: false,
    isFavorite: false,
    userId: "",
    questions: [],
  }

  if (!quizData) {
    return safeData
  }

  // Handle id and quizId - ensure both are set
  if (quizData.id) {
    safeData.id = quizData.id
    safeData.quizId = quizData.id
  } else if (quizData.quizId) {
    safeData.id = quizData.quizId
    safeData.quizId = quizData.quizId
  }

  // Copy other properties
  return {
    ...safeData,
    ...quizData,
    // Ensure these are always set
    slug: slug || quizData.slug || safeData.slug,
    quizType: quizType || quizData.quizType || safeData.quizType,
  }
}
