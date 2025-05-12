import type {
  QuizAnswer,
  BlanksQuizAnswer,
  CodeQuizAnswer,
  QuizType,
  QuizResult,
  QuizSubmission,
  StoredQuizState,
} from "@/app/types/quiz-types"
import type { Answer } from "@/store/slices/quizSlice"

// Function to calculate quiz score
export function calculateQuizScore(answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[]): number {
  if (!Array.isArray(answers) || answers.length === 0) {
    return 0
  }

  const validAnswers = answers.filter(
    (answer): answer is QuizAnswer | CodeQuizAnswer => answer !== null && "isCorrect" in answer,
  )

  if (validAnswers.length === 0) {
    return 0
  }

  const correctAnswers = validAnswers.filter((answer) => answer.isCorrect).length
  return Math.round((correctAnswers / answers.length) * 100)
}

// Function to format time spent
export function formatTimeSpent(timeSpent: number): string {
  if (typeof timeSpent !== "number" || isNaN(timeSpent)) {
    return "0:00"
  }

  const minutes = Math.floor(timeSpent / 60000)
  const seconds = Math.floor((timeSpent % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Function to convert redux answers to quiz submission format
export function convertReduxAnswersToSubmission(
  answers: Answer[],
  quizId: string,
  slug: string,
  quizType: QuizType | string,
  totalTime: number,
): QuizSubmission {
  if (!Array.isArray(answers)) {
    throw new Error("Answers must be an array")
  }

  if (!quizId || !slug || !quizType) {
    throw new Error("Missing required quiz information")
  }

  const convertedAnswers = answers.map((answer) => ({
    answer: answer.answer,
    userAnswer: answer.userAnswer || answer.answer,
    isCorrect: !!answer.isCorrect,
    timeSpent: answer.timeSpent || 0,
    questionId: answer.questionId,
    ...(answer.codeSnippet ? { codeSnippet: answer.codeSnippet } : {}),
    ...(answer.language ? { language: answer.language } : {}),
  }))

  return {
    quizId,
    slug,
    type: quizType,
    score: calculateQuizScore(convertedAnswers as QuizAnswer[]),
    answers: convertedAnswers as QuizAnswer[],
    totalTime,
    totalQuestions: answers.length,
    completedAt: new Date().toISOString(),
  }
}

// Function to save quiz state to localStorage
export function saveQuizState(state: StoredQuizState): void {
  if (!state || !state.quizId || !state.slug) {
    console.error("Cannot save invalid quiz state")
    return
  }

  try {
    localStorage.setItem(`quiz_state_${state.quizId}`, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to save quiz state to localStorage:", error)
  }
}

// Function to load quiz state from localStorage
export function loadQuizState(quizId: string): StoredQuizState | null {
  if (!quizId) {
    return null
  }

  try {
    const savedState = localStorage.getItem(`quiz_state_${quizId}`)
    if (!savedState) {
      return null
    }
    return JSON.parse(savedState) as StoredQuizState
  } catch (error) {
    console.error("Failed to load quiz state from localStorage:", error)
    return null
  }
}

// Function to clear quiz state from localStorage
export function clearQuizState(quizId: string): void {
  if (!quizId) {
    return
  }

  try {
    localStorage.removeItem(`quiz_state_${quizId}`)
  } catch (error) {
    console.error("Failed to clear quiz state from localStorage:", error)
  }
}

// Function to format quiz result for display
export function formatQuizResult(answers: Answer[], questions: any[], totalTime: number): QuizResult {
  if (!Array.isArray(answers) || !Array.isArray(questions)) {
    throw new Error("Invalid answers or questions format")
  }

  const correctAnswers = answers.filter((a) => a?.isCorrect).length
  const score = Math.round((correctAnswers / questions.length) * 100)

  const formattedAnswers = answers.map((answer, index) => {
    const question = questions[index]
    return {
      questionId: question?.id || `q-${index}`,
      question: question?.question || "Unknown question",
      selectedOption: answer?.userAnswer || "No answer",
      correctOption: question?.answer || "Unknown",
      isCorrect: !!answer?.isCorrect,
      timeSpent: answer?.timeSpent || 0,
    }
  })

  return {
    quizId: "", // This should be filled by the caller
    slug: "", // This should be filled by the caller
    score,
    totalQuestions: questions.length,
    correctAnswers,
    totalTimeSpent: totalTime,
    completedAt: new Date().toISOString(),
    answers: formattedAnswers,
  }
}

// Function to validate quiz answers
export function validateQuizAnswers(answers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[]): boolean {
  if (!Array.isArray(answers)) {
    return false
  }

  // Check if all answers are provided (no nulls)
  return answers.every((answer) => answer !== null)
}
