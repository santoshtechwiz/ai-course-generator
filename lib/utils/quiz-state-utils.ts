import type { QuizType, QuizAnswer, BlanksQuizAnswer, CodeQuizAnswer, StoredQuizState } from "@/app/types/quiz-types"
import type { Answer, QuizState } from "@/store/slices/quizSlice"

// Function to initialize quiz state
export function initializeQuizState(
  quizId: string,
  slug: string,
  quizType: QuizType | string,
  questionCount: number,
): StoredQuizState {
  return {
    quizId,
    slug,
    type: quizType,
    currentQuestion: 0,
    totalQuestions: questionCount,
    startTime: Date.now(),
    isCompleted: false,
    answers: Array(questionCount).fill(null),
    timeSpentPerQuestion: Array(questionCount).fill(0),
  }
}

// Function to update quiz state with a new answer
export function updateQuizStateWithAnswer(
  state: StoredQuizState,
  questionIndex: number,
  answer: QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer,
): StoredQuizState {
  if (!state || questionIndex < 0 || questionIndex >= state.totalQuestions) {
    throw new Error("Invalid state or question index")
  }

  const newAnswers = [...state.answers]
  newAnswers[questionIndex] = answer

  const newTimeSpent = [...state.timeSpentPerQuestion]
  newTimeSpent[questionIndex] = answer.timeSpent

  return {
    ...state,
    answers: newAnswers,
    timeSpentPerQuestion: newTimeSpent,
  }
}

// Function to mark quiz as completed
export function completeQuizState(state: StoredQuizState): StoredQuizState {
  if (!state) {
    throw new Error("Invalid quiz state")
  }

  return {
    ...state,
    isCompleted: true,
  }
}

// Function to convert Redux state to StoredQuizState
export function convertReduxStateToStoredState(reduxState: QuizState, quizType: QuizType | string): StoredQuizState {
  return {
    quizId: reduxState.quizId,
    slug: reduxState.slug,
    type: quizType,
    currentQuestion: reduxState.currentQuestionIndex,
    totalQuestions: reduxState.questions.length,
    startTime: reduxState.startTime,
    isCompleted: reduxState.isCompleted,
    answers: reduxState.answers as (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[],
    timeSpentPerQuestion: reduxState.timeSpent,
  }
}

// Function to convert StoredQuizState to Redux Answer format
export function convertStoredAnswersToReduxAnswers(
  storedAnswers: (QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer | null)[],
): Answer[] {
  if (!Array.isArray(storedAnswers)) {
    return []
  }

  return storedAnswers.map((answer, index) => {
    if (!answer) {
      return {
        answer: "",
        timeSpent: 0,
        isCorrect: false,
        index,
      }
    }

    // Handle different answer types
    if ("codeSnippet" in answer) {
      // CodeQuizAnswer
      return {
        answer: answer.answer,
        userAnswer: answer.userAnswer,
        timeSpent: answer.timeSpent,
        isCorrect: answer.isCorrect,
        codeSnippet: answer.codeSnippet,
        language: answer.language,
        index,
      }
    } else if ("hintsUsed" in answer) {
      // BlanksQuizAnswer
      return {
        answer: "",
        userAnswer: answer.userAnswer,
        timeSpent: answer.timeSpent,
        isCorrect: false, // We don't have this info in BlanksQuizAnswer
        hintsUsed: answer.hintsUsed,
        index,
      }
    } else {
      // Standard QuizAnswer
      return {
        answer: answer.answer,
        userAnswer: answer.userAnswer,
        timeSpent: answer.timeSpent,
        isCorrect: answer.isCorrect,
        questionId: "questionId" in answer ? answer.questionId : undefined,
        index,
      }
    }
  })
}
