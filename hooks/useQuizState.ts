"use client"

import { useEffect, useCallback } from "react"
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
} from "@/store/slices/quizSlice"
import type { QuizData, QuizType, QuizResult } from "@/app/types/quiz-types"
import type { CodeQuizQuestion } from "@/app/types/code-quiz-types"

export function useQuiz() {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.quiz)

  // Core quiz loading
  const loadQuiz = useCallback(
    async (slug: string, type: QuizType = "mcq", initialData?: QuizData) => {
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
        if (error === "Unauthorized" || error?.status === 401) {
          signIn(undefined, { callbackUrl: `/dashboard/${type}/${cleanSlug}` })
        }
        throw error
      }
    },
    [dispatch],
  )

  return {
    quiz: {
      data: quizState.quizData,
      currentQuestion: quizState.currentQuestion,
      userAnswers: quizState.userAnswers,
      isLastQuestion: quizState.currentQuestion === (quizState.quizData?.questions.length || 0) - 1,
      progress: ((quizState.currentQuestion + 1) / (quizState.quizData?.questions.length || 1)) * 100,
      currentQuestionData: quizState.quizData?.questions?.[quizState.currentQuestion] || null,
    },
    status: {
      isLoading: quizState.isLoading,
      isSubmitting: quizState.isSubmitting,
      isCompleted: quizState.isCompleted,
      hasError: Boolean(quizState.error),
      errorMessage: quizState.error,
    },
    results: quizState.results,
    tempResults: quizState.tempResults,
    actions: {
      loadQuiz,
      submitQuiz: async (payload: any) => {
        const result = await dispatch(submitQuiz(payload)).unwrap()
        dispatch(markQuizCompleted(result))
        return result
      },
      saveAnswer: (questionId: string, answer: any) => dispatch(setUserAnswer({ questionId, answer })),
      setTempResults: (results: QuizResult) => dispatch(setTempResults(results)),
      clearTempResults: () => dispatch(clearTempResults()),
      reset: () => dispatch(resetQuizState()),
    },
    navigation: {
      next: () => {
        if (quizState.currentQuestion < (quizState.quizData?.questions.length || 0) - 1) {
          dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
          return true
        }
        return false
      },
      previous: () => {
        if (quizState.currentQuestion > 0) {
          dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
          return true
        }
        return false
      },
      toQuestion: (index: number) => {
        if (index >= 0 && index < (quizState.quizData?.questions.length || 0)) {
          dispatch(setCurrentQuestion(index))
          return true
        }
        return false
      },
    },
    dispatch,
  }
}
