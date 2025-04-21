"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QuizLoader } from "@/components/ui/quiz-loader"

import type { QuizType } from "@/app/types/types"
import AuthRequiredModal from "@/app/auth/AuthRequiredModal"

interface QuizResultWrapperProps {
  children: React.ReactNode
  quizId: string
  slug: string
  quizType: QuizType
  onClearGuestData?: () => void
  isSubmitting?: boolean // Add isSubmitting prop
}

export function QuizResultWrapper({
  children,
  quizId,
  slug,
  quizType,
  onClearGuestData,
  isSubmitting = false, // Default to false
}: QuizResultWrapperProps) {
  const { status, data: session } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  // Store quiz state in session storage to preserve it during auth flow
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Store current quiz state in session storage
      try {
        sessionStorage.setItem(
          "lastQuizState",
          JSON.stringify({
            quizId,
            slug,
            quizType,
            timestamp: Date.now(),
          }),
        )
      } catch (e) {
        console.error("Failed to store quiz state:", e)
      }
    }
  }, [isAuthenticated, isLoading, quizId, slug, quizType])

  // Check if we're returning from auth flow
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedState = sessionStorage.getItem("lastQuizState")
        if (storedState) {
          const parsedState = JSON.parse(storedState)
          // If this is the same quiz and we're within a reasonable time window (30 min)
          if (
            parsedState.quizId === quizId &&
            parsedState.slug === slug &&
            parsedState.quizType === quizType &&
            Date.now() - parsedState.timestamp < 30 * 60 * 1000
          ) {
            // We've successfully authenticated and returned to the same quiz
            // Clear the stored state to prevent future issues
            sessionStorage.removeItem("lastQuizState")

            // Also check for specific quiz result data
            const quizResultKey = `quiz_result_${quizId}`
            const quizResult = sessionStorage.getItem(quizResultKey)
            if (quizResult) {
              // Keep the quiz result for the component to use
              console.log("Found stored quiz result after authentication")
            }
          }
        }
      } catch (e) {
        console.error("Failed to process stored quiz state:", e)
      }
    }
  }, [isAuthenticated, quizId, slug, quizType])

  // Show auth modal for unauthenticated users
  const handleAuthPrompt = () => {
    setShowAuthModal(true)
  }

  // Close auth modal
  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }

  // If still loading auth state, show loading spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If submitting, show loading state
  if (isSubmitting) {
    return <QuizLoader message="Saving your quiz results..." />
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // For unauthenticated users, we'll still show the results but with a prompt to sign in
  return (
    <>
      {children}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        redirectPath={`/quiz/${quizType}/${slug}`}
       
       
      />
    </>
  )
}
