"use client"

import { useEffect, useCallback, useMemo, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { signIn } from "next-auth/react"
import {
  fetchQuiz,
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  markQuizCompleted,
  clearErrors,
  submitQuiz,
  setTempResults,
  clearTempResults,
  selectCurrentQuestionData,
  selectQuizProgress,
  selectIsLastQuestion,
  type SubmitQuizParams,
} from "@/store/slices/quizSlice"
import type { QuizData, QuizType, QuizResult, QuizQuestion, UserAnswer } from "@/app/types/quiz-types"
import { BlanksQuiz } from "@/lib/quiz/BlanksQuiz"
import { CodeQuiz } from "@/lib/quiz/CodeQuiz"
import { MCQQuiz } from "@/lib/quiz/MCQQuiz"

/**
 * Quiz state returned by the useQuiz hook
 */
export interface QuizState<T extends QuizQuestion = QuizQuestion> {
  data: QuizData<T> | null
  currentQuestion: number
  currentQuestionData: T | null
  userAnswers: UserAnswer[]
  isLastQuestion: boolean
  progress: number
  instance: CodeQuiz | MCQQuiz | BlanksQuiz
}

/**
 * Quiz status returned by the useQuiz hook
 */
export interface QuizStatus {
  isLoading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  hasError: boolean
  errorMessage: string | null
}

/**
 * Quiz actions returned by the useQuiz hook
 */
export interface QuizActions {
  loadQuiz: <T extends QuizQuestion>(slug: string, type?: QuizType, initialData?: QuizData<T>) => Promise<QuizData<T>>
  submitQuiz: (payload: Omit<SubmitQuizParams, "slug"> & { slug?: string }) => Promise<QuizResult>
  saveAnswer: (questionId: string, answer: any) => void
  setTempResults: (results: QuizResult) => void
  clearTempResults: () => void
  reset: () => void
}

/**
 * Quiz navigation functions returned by the useQuiz hook
 */
export interface QuizNavigation {
  next: () => boolean
  previous: () => boolean
  toQuestion: (index: number) => boolean
}

/**
 * Return type of the useQuiz hook
 */
export interface UseQuizReturn<T extends QuizQuestion = QuizQuestion> {
  quiz: QuizState<T>
  status: QuizStatus
  results: QuizResult | null
  tempResults: QuizResult | null
  actions: QuizActions
  navigation: QuizNavigation
}

// Race condition prevention
const activeRequests = new Map<string, Promise<any>>()

/**
 * Custom hook for managing quiz state and actions
 *
 * @template T Type of quiz question, defaults to QuizQuestion
 * @returns Object containing quiz state, status, results, and actions
 *
 * @example
 * const { quiz, status, results, actions, navigation } = useQuiz<CodeQuizQuestion>();
 *
 * // Load a quiz
 * useEffect(() => {
 *   actions.loadQuiz('my-quiz-slug', 'code');
 * }, [actions]);
 *
 * // Navigate to next question
 * const handleNext = () => navigation.next();
 *
 * // Save an answer
 * const handleAnswer = (answer) => actions.saveAnswer(quiz.currentQuestionData.id, answer);
 */
export function useQuiz<T extends QuizQuestion = QuizQuestion>(): UseQuizReturn<T> {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.quiz)

  // Race condition prevention refs
  const loadingRef = useRef<string | null>(null)
  const submittingRef = useRef<boolean>(false)

  // Use memoized selectors for derived state
  const currentQuestionData = useAppSelector((state) => selectCurrentQuestionData(state) as T | null)
  const progress = useAppSelector(selectQuizProgress)
  const isLastQuestion = useAppSelector(selectIsLastQuestion)

  /**
   * Loads a quiz by slug and type with race condition prevention
   *
   * @param slug The quiz slug
   * @param type The quiz type (default: "mcq")
   * @param initialData Optional initial data to use instead of fetching
   * @returns Promise resolving to the quiz data
   *
   * @throws Error if quiz loading fails
   *
   * @sideEffect May redirect to sign-in page if authentication is required
   */
  const loadQuiz = useCallback(
    async <U extends QuizQuestion>(
      slug: string,
      type: QuizType = "mcq",
      initialData?: QuizData<U>,
    ): Promise<QuizData<U>> => {
      const cleanSlug = slug.replace(/Question$/, "")
      const requestKey = `${cleanSlug}-${type}`

      // Prevent race conditions - if same request is in progress, return existing promise
      if (loadingRef.current === requestKey && activeRequests.has(requestKey)) {
        return activeRequests.get(requestKey) as Promise<QuizData<U>>
      }

      loadingRef.current = requestKey
      dispatch(clearErrors())

      if (initialData?.questions?.length) {
        const result = Promise.resolve(initialData)
        dispatch(fetchQuiz.fulfilled(initialData as unknown as QuizData, "", { slug: cleanSlug, type }))
        loadingRef.current = null
        return result
      }

      const loadPromise = (async () => {
        try {
          const result = await dispatch(fetchQuiz({ slug: cleanSlug, type })).unwrap()
          return result as unknown as QuizData<U>
        } catch (error: unknown) {
          console.error(`Error loading quiz:`, error)
          // Side effect: Redirects to sign-in if unauthorized
          if (
            error === "Unauthorized" ||
            (typeof error === "object" && error !== null && "status" in error && error.status === 401)
          ) {
            signIn(undefined, { callbackUrl: `/dashboard/${type}/${cleanSlug}` })
          }
          throw error
        } finally {
          loadingRef.current = null
          activeRequests.delete(requestKey)
        }
      })()

      activeRequests.set(requestKey, loadPromise)
      return loadPromise
    },
    [dispatch],
  )

  /**
   * Submits the quiz answers with race condition prevention
   *
   * @param payload The submission payload
   * @returns Promise resolving to the quiz result
   *
   * @throws Error if submission fails
   */
  const submitQuizAnswers = useCallback(
    async (payload: Omit<SubmitQuizParams, "slug"> & { slug?: string }): Promise<QuizResult> => {
      // Prevent multiple simultaneous submissions
      if (submittingRef.current) {
        throw new Error("Quiz submission already in progress")
      }

      submittingRef.current = true

      try {
        const submissionPayload: SubmitQuizParams = {
          ...payload,
          slug: payload.slug || quizState.currentQuizSlug || "",
        }

        const result = await dispatch(submitQuiz(submissionPayload)).unwrap()
        dispatch(markQuizCompleted(result))
        return result
      } finally {
        submittingRef.current = false
      }
    },
    [dispatch, quizState.currentQuizSlug],
  )

  /**
   * Saves an answer for a question
   *
   * @param questionId The question ID
   * @param answer The answer
   */
  const saveAnswer = useCallback(
    (questionId: string, answer: any): void => {
      dispatch(setUserAnswer({ questionId, answer }))
    },
    [dispatch],
  )

  /**
   * Sets temporary results
   *
   * @param results The quiz results
   */
  const setTemporaryResults = useCallback(
    (results: QuizResult): void => {
      dispatch(setTempResults(results))
    },
    [dispatch],
  )

  /**
   * Clears temporary results
   */
  const clearTemporaryResults = useCallback((): void => {
    dispatch(clearTempResults())
  }, [dispatch])

  /**
   * Resets the quiz state
   */
  const reset = useCallback((): void => {
    // Clear any active requests
    loadingRef.current = null
    submittingRef.current = false
    activeRequests.clear()
    dispatch(resetQuizState())
  }, [dispatch])

  /**
   * Navigates to the next question
   *
   * @returns true if navigation was successful, false otherwise
   */
  const next = useCallback((): boolean => {
    if (quizState.currentQuestion < (quizState.quizData?.questions.length || 0) - 1) {
      dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
      return true
    }
    return false
  }, [dispatch, quizState.currentQuestion, quizState.quizData?.questions.length])

  /**
   * Navigates to the previous question
   *
   * @returns true if navigation was successful, false otherwise
   */
  const previous = useCallback((): boolean => {
    if (quizState.currentQuestion > 0) {
      dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
      return true
    }
    return false
  }, [dispatch, quizState.currentQuestion])

  /**
   * Navigates to a specific question
   *
   * @param index The question index
   * @returns true if navigation was successful, false otherwise
   */
  const toQuestion = useCallback(
    (index: number): boolean => {
      if (index >= 0 && index < (quizState.quizData?.questions.length || 0)) {
        dispatch(setCurrentQuestion(index))
        return true
      }
      return false
    },
    [dispatch, quizState.quizData?.questions.length],
  )

  // Create quiz instance based on quiz type - memoized to prevent unnecessary re-creation
  const quizInstance = useMemo(() => {
    switch (quizState.currentQuizType) {
      case "code":
        return new CodeQuiz()
      case "mcq":
        return new MCQQuiz()
      case "blanks":
        return new BlanksQuiz()
      default:
        return new CodeQuiz()
    }
  }, [quizState.currentQuizType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loadingRef.current = null
      submittingRef.current = false
      activeRequests.clear()
    }
  }, [])

  return {
    quiz: {
      data: quizState.quizData as QuizData<T> | null,
      currentQuestion: quizState.currentQuestion,
      currentQuestionData,
      userAnswers: quizState.userAnswers,
      isLastQuestion,
      progress,
      instance: quizInstance,
    },
    status: {
      isLoading: quizState.isLoading,
      isSubmitting: quizState.isSubmitting,
      isCompleted: quizState.isCompleted,
      hasError: Boolean(quizState.errors.quiz || quizState.errors.submission),
      errorMessage: quizState.errors.quiz || quizState.errors.submission,
    },
    results: quizState.results,
    tempResults: quizState.tempResults,
    actions: {
      loadQuiz,
      submitQuiz: submitQuizAnswers,
      saveAnswer,
      setTempResults: setTemporaryResults,
      clearTempResults: clearTemporaryResults,
      reset,
    },
    navigation: {
      next,
      previous,
      toQuestion,
    },
  }
}
