"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthRequiredModal from "@/app/auth/AuthRequiredModal"
import { hasSavedQuizState, getSavedQuizState, clearSavedQuizState } from "@/hooks/quiz-session-storage"

interface QuizAuthWrapperProps {
  children: React.ReactNode
  quizState?: any
  answers?: any[]
  redirectPath?: string
  requireAuth?: boolean
  showAuthModal?: boolean
  onAuthModalClose?: () => void
}

export default function QuizAuthWrapper({
  children,
  quizState,
  answers,
  redirectPath,
  requireAuth = false,
  showAuthModal = false,
  onAuthModalClose,
}: QuizAuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading" && !hasCheckedStorage && !isRedirecting) {
      setHasCheckedStorage(true)

      // If user is authenticated and there's a saved quiz state, redirect to the saved path
      if (status === "authenticated" && hasSavedQuizState()) {
        try {
          const savedState = getSavedQuizState()
          if (savedState && savedState.redirectPath) {
            setIsRedirecting(true)
            // Add a small delay to ensure state is properly set before redirect
            setTimeout(() => {
              clearSavedQuizState()
              router.push(savedState.redirectPath)
            }, 100)
          }
        } catch (error) {
          console.error("Error processing saved quiz state:", error)
          // Clear invalid state
          clearSavedQuizState()
        }
      }
    }
  }, [status, router, hasCheckedStorage, isRedirecting])

  // Show auth modal if required
  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      setShowModal(true)
    }
  }, [requireAuth, status])

  // Show auth modal based on prop
  useEffect(() => {
    setShowModal(showAuthModal)
  }, [showAuthModal])

  const handleCloseModal = () => {
    setShowModal(false)
    if (onAuthModalClose) {
      onAuthModalClose()
    }
  }

  // If still loading auth state or redirecting, show loading state
  if (status === "loading" || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If auth is required and user is not authenticated, show auth modal
  if (requireAuth && status === "unauthenticated") {
    return (
      <>
        {children}
        <AuthRequiredModal
          isOpen={showModal}
          onClose={handleCloseModal}
          quizState={quizState}
          answers={answers}
          redirectPath={redirectPath}
        />
      </>
    )
  }

  // Otherwise, just render children
  return <>{children}</>
}
