"use client"

import { useEffect, useCallback, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { signIn } from "next-auth/react"
import {
  fetchQuiz,
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  markQuizCompleted,
  setError,
  clearErrors,
  submitQuiz,
  setTempResults,
  clearTempResults,
  selectCurrentQuestionData,
  selectQuizProgress,
  selectIsLastQuestion,
} from "@/store/slices/quizSlice"
import type { QuizData, QuizType, QuizResult, QuizQuestion } from "@/app/types/quiz-types"
import { BlanksQuiz } from "@/lib/quiz/BlanksQuiz"
import { CodeQuiz } from "@/lib/quiz/CodeQuiz"
import { MCQQuiz } from "@/lib/quiz/MCQQuiz"

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
export function useQuiz<T extends QuizQuestion = QuizQuestion>() {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.quiz)
  
  // Use memoized selectors for derived state
  const currentQuestionData = useAppSelector(state => 
    selectCurrentQuestionData(state) as T | null
  )
  const progress = useAppSelector(selectQuizProgress)
  const isLastQuestion = useAppSelector(selectIsLastQuestion)

  /**
   * Loads a quiz by slug and type
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
    async (slug: string, type: QuizType = "mcq", initialData?: QuizData<T>) => {
      const cleanSlug = slug.replace(/Question$/, "")
      dispatch(clearErrors())

      if (initialData?.questions?.length) {
        dispatch(fetchQuiz.fulfilled(initialData, "", { slug: cleanSlug, type }))
        return initialData
      }

      try {
        return await dispatch(fetchQuiz({ slug: cleanSlug, type })).unwrap()
      } catch (error: any) {
        console.error(`Error loading quiz:`, error)
        // Side effect: Redirects to sign-in if unauthorized
        if (error === "Unauthorized" || error?.status === 401) {
          signIn(undefined, { callbackUrl: `/dashboard/${type}/${cleanSlug}` })
        }
        throw error
      }
    },
    [dispatch],
  )

  /**
   * Submits the quiz answers
   * 
   * @param payload The submission payload
   * @returns Promise resolving to the quiz result
   * 
   * @throws Error if submission fails
   */
  const submitQuizAnswers = useCallback(
    async (payload: any) => {
      const result = await dispatch(submitQuiz(payload)).unwrap()
      dispatch(markQuizCompleted(result))
      return result
    },
    [dispatch],
  )

  /**
   * Saves an answer for a question
   * 
   * @param questionId The question ID
   * @param answer The answer
   */
  const saveAnswer = useCallback(
    (questionId: string, answer: any) => {
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
    (results: QuizResult) => {
      dispatch(setTempResults(results))
    },
    [dispatch],
  )

  /**
   * Clears temporary results
   */
  const clearTemporaryResults = useCallback(
    () => {
      dispatch(clearTempResults())
    },
    [dispatch],
  )

  /**
   * Resets the quiz state
   */
  const reset = useCallback(
    () => {
      dispatch(resetQuizState())
    },
    [dispatch],
  )

  /**
   * Navigates to the next question
   * 
   * @returns true if navigation was successful, false otherwise
   */
  const next = useCallback(
    () => {
      if (quizState.currentQuestion < (quizState.quizData?.questions.length || 0) - 1) {
        dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
        return true
      }
      return false
    },
    [dispatch, quizState.currentQuestion, quizState.quizData?.questions.length],
  )

  /**
   * Navigates to the previous question
   * 
   * @returns true if navigation was successful, false otherwise
   */
  const previous = useCallback(
    () => {
      if (quizState.currentQuestion > 0) {
        dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
        return true
      }
      return false
    },
    [dispatch, quizState.currentQuestion],
  )

  /**
   * Navigates to a specific question
   * 
   * @param index The question index
   * @returns true if navigation was successful, false otherwise
   */
  const toQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < (quizState.quizData?.questions.length || 0)) {
        dispatch(setCurrentQuestion(index))
        return true
      }
      return false
    },
    [dispatch, quizState.quizData?.questions.length],
  )

  // Create quiz instance based on quiz type
  const quizInstance = useMemo(() => {
    switch(quizState.currentQuizType) {
      case 'code':
        return new CodeQuiz();
      case 'mcq':
        return new MCQQuiz();
      case 'blanks':
        return new BlanksQuiz();
      default:
        return new CodeQuiz();
    }
  }, [quizState.currentQuizType]);

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
    // Dispatch is no longer exposed
  }
}
