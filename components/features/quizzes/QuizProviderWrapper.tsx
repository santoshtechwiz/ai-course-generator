"use client"

import { useEffect, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  setAuthCheckComplete,
  setPendingAuthRequired,
  setRequiresAuth,
  type QuizState,
  saveStateBeforeAuth,
} from "@/store/slices/quizSlice"
import { setIsProcessingAuth } from "@/store/slices/authSlice"

interface QuizProviderWrapperProps {
  children: ReactNode
  requiresAuth?: boolean
}

/**
 * This component handles the authentication flow for quizzes
 * It checks if the user is authenticated when required and saves quiz state
 * for restoration after authentication
 */
export function QuizProviderWrapper({ children, requiresAuth = false }: QuizProviderWrapperProps) {
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  const quiz = useAppSelector((state) => state.quiz)
  const isAuthenticated = !!session?.user
  const isAuthLoading = status === "loading"

  // Set whether quiz requires authentication
  useEffect(() => {
    if (requiresAuth) {
      dispatch(setRequiresAuth(true))
    }
  }, [dispatch, requiresAuth])

  // Handle authentication state changes
  useEffect(() => {
    // Skip processing if auth is still loading
    if (isAuthLoading) return

    // Handle cases where authentication is required
    if (requiresAuth) {
      // User is not authenticated and quiz requires auth
      if (!isAuthenticated && quiz.isCompleted) {
        // Save quiz state for later restoration
        const stateToSave: Partial<QuizState> = {
          quizId: quiz.quizId,
          slug: quiz.slug,
          quizType: quiz.quizType,
          currentQuestionIndex: quiz.currentQuestionIndex,
          answers: quiz.answers,
          isCompleted: quiz.isCompleted,
          score: quiz.score,
          completedAt: quiz.completedAt,
        }
        dispatch(saveStateBeforeAuth(stateToSave))
        dispatch(setPendingAuthRequired(true))
        dispatch(setIsProcessingAuth(true))
      } else if (isAuthenticated && quiz.pendingAuthRequired) {
        // User is now authenticated, proceed with saved quiz state
        dispatch(setPendingAuthRequired(false))
        dispatch(setIsProcessingAuth(false))
      }
    }

    dispatch(setAuthCheckComplete(true))
  }, [dispatch, isAuthenticated, isAuthLoading, quiz, requiresAuth])

  return <>{children}</>
}
