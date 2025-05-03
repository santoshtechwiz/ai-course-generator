"use client"

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  resetQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasGuestResult,
  clearGuestResults,
  setError,
  initQuiz,
  fetchQuizResults,
  submitQuizResults,
} from "@/store/slices/quizSlice"
import { quizService } from "@/lib/utils/quiz-service"
import { useSession } from "next-auth/react"

/**
 * Custom hook that provides access to quiz state and actions
 * This hook maintains backward compatibility with the original QuizContext
 */
export function useQuizState() {
  const dispatch = useAppDispatch()
  const { data: session } = useSession()

  // Select all quiz state from Redux
  const quizState = useAppSelector((state) => state.quiz)

  // Check if user is authenticated
  const isAuthenticated = !!session?.user

  // Initialize quiz with data
  const initializeQuiz = useCallback(
    (quizData: any) => {
      dispatch(initQuiz(quizData))
    },
    [dispatch],
  )

  // Handle submitting an answer
  const handleSubmitAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      dispatch(submitAnswer({ answer, timeSpent, isCorrect }))
      return quizState.answers // Return answers for backward compatibility
    },
    [dispatch, quizState.answers],
  )

  // Handle moving to the next question
  const handleNextQuestion = useCallback(() => {
    dispatch(nextQuestion())
  }, [dispatch])

  // Handle completing the quiz
  const handleCompleteQuiz = useCallback(
    (answers: any[]) => {
      dispatch(completeQuiz(answers))

      // If user is authenticated, submit results to the server
      if (isAuthenticated && quizState.quizId) {
        const totalTime = answers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0)

        dispatch(
          submitQuizResults({
            quizId: quizState.quizId,
            slug: quizState.slug,
            quizType: quizState.quizType,
            answers,
            score: quizState.score,
            totalTime,
          }),
        )
      } else {
        // For guest users, save as guest result
        quizService.saveGuestResult({
          quizId: quizState.quizId,
          slug: quizState.slug,
          type: quizState.quizType,
          score: quizState.score,
          answers: answers.filter((a) => a !== null),
          totalTime: answers.reduce((acc, curr) => acc + (curr?.timeSpent || 0), 0),
          totalQuestions: quizState.questionCount,
          completedAt: new Date().toISOString(),
        })

        dispatch(setHasGuestResult(true))
      }
    },
    [
      dispatch,
      isAuthenticated,
      quizState.quizId,
      quizState.slug,
      quizState.quizType,
      quizState.score,
      quizState.questionCount,
    ],
  )

  // Handle restarting the quiz
  const handleRestartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Handle authentication requirement
  const handleAuthenticationRequired = useCallback(
    (redirectUrl?: string) => {
      // Set flag that auth is required
      dispatch(setRequiresAuth(true))
      dispatch(setPendingAuthRequired(true))

      // Use the quiz service to handle auth redirect
      if (redirectUrl) {
        quizService.handleAuthRedirect(redirectUrl)
      }
    },
    [dispatch],
  )

  // Fetch quiz results
  const handleFetchQuizResults = useCallback(async () => {
    if (!quizState.quizId || !quizState.slug) {
      return false
    }

    try {
      const result = await dispatch(
        fetchQuizResults({
          quizId: quizState.quizId,
          slug: quizState.slug,
          quizType: quizState.quizType,
        }),
      ).unwrap()

      return !!result
    } catch (error) {
      console.error("Error fetching quiz results:", error)
      return false
    }
  }, [dispatch, quizState.quizId, quizState.slug, quizState.quizType])

  // Retry loading results
  const handleRetryLoadingResults = useCallback(async () => {
    dispatch(setError(null))
    return handleFetchQuizResults()
  }, [dispatch, handleFetchQuizResults])

  // Clear guest results
  const handleClearGuestResults = useCallback(() => {
    dispatch(clearGuestResults())
  }, [dispatch])

  // Return the state and actions in a format compatible with the original QuizContext
  return {
    state: {
      ...quizState,
      // Add any missing properties for backward compatibility
    },
    isAuthenticated,
    submitAnswer: handleSubmitAnswer,
    nextQuestion: handleNextQuestion,
    completeQuiz: handleCompleteQuiz,
    restartQuiz: handleRestartQuiz,
    handleAuthenticationRequired,
    fetchQuizResults: handleFetchQuizResults,
    retryLoadingResults: handleRetryLoadingResults,
    clearGuestResults: handleClearGuestResults,
    dispatch,
  }
}

export default useQuizState
