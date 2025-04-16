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

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading" && !hasCheckedStorage) {
      setHasCheckedStorage(true)

      // If user is authenticated and there's a saved quiz state, redirect to the saved path
      if (status === "authenticated" && hasSavedQuizState()) {
        const { redirectPath } = getSavedQuizState()
        if (redirectPath) {
          clearSavedQuizState()
          router.push(redirectPath)
        }
      }
    }
  }, [status, router, hasCheckedStorage])

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

  // If still loading auth state, show nothing
  if (status === "loading") {
    return null
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
