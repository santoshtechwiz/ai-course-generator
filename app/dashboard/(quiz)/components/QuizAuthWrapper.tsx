"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useQuiz } from "../../../context/QuizContext"
import { fixCallbackUrl } from "@/hooks/quiz-session-storage"

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

  const { saveQuizState, getQuizState, clearQuizState, isAuthenticated } = useQuiz()

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading" && !hasCheckedStorage && !isRedirecting) {
      setHasCheckedStorage(true)

      // If user is authenticated and there's a saved quiz state, redirect to the saved path
      if (status === "authenticated") {
        const savedState = getQuizState()
        if (savedState && savedState.redirectPath) {
          // Check if we're already on the target page to prevent redirect loops
          const currentPath = window.location.pathname
          const targetPath = savedState.redirectPath.split("?")[0] // Remove query params for comparison

          console.log("Current path:", currentPath)
          console.log("Target path:", targetPath)
          console.log("Saved state:", savedState)

          // Only redirect if we're not already on the target page
          if (!currentPath.includes(targetPath)) {
            setIsRedirecting(true)
            // Add a small delay to ensure state is properly set before redirect
            setTimeout(() => {
              // Add completed=true parameter to the URL if the quiz was completed
              const redirectUrl = savedState.isCompleted
                ? `${savedState.redirectPath}${savedState.redirectPath.includes("?") ? "&" : "?"}completed=true`
                : savedState.redirectPath

              console.log("Redirecting to:", redirectUrl)
              router.push(redirectUrl)

              // Clear the state after redirecting
              clearQuizState()
            }, 100)
          } else {
            // We're already on the target page, just clear the state
            clearQuizState()
          }
        }
      }
    }
  }, [status, router, hasCheckedStorage, isRedirecting, getQuizState, clearQuizState])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isRedirecting) {
      // Set a timeout to exit the redirecting state after 5 seconds
      const timeout = setTimeout(() => {
        setIsRedirecting(false)
        console.log("Redirection timeout reached - forcing exit from redirect state")
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [isRedirecting])

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
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">
          {isRedirecting ? "Redirecting to your saved quiz..." : "Checking authentication..."}
        </p>
      </div>
    )
  }

  // If auth is required and user is not authenticated, show a simple login button
  if (requireAuth && status === "unauthenticated") {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Sign in to continue</h2>
            <p className="mb-4">Please sign in to save your quiz results and track your progress.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseModal}>
                Continue as Guest
              </Button>
              <Button
                onClick={() => {
                  // Ensure we're using the correct path format for the callback URL
                  let callbackUrl = redirectPath || `/dashboard/${quizState?.quizType}/${quizState?.quizSlug}`

                  // Add completed=true parameter if the quiz is completed
                  if (quizState?.isCompleted) {
                    callbackUrl += `${callbackUrl.includes("?") ? "&" : "?"}completed=true`
                  }

                  router.push(`/auth/signin?callbackUrl=${encodeURIComponent(fixCallbackUrl(callbackUrl))}`)
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (quizState && quizState.quizType && showModal) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Save Your Progress</h2>
            <p className="mb-4">Sign in to save your quiz results and track your progress over time.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseModal}>
                Continue as Guest
              </Button>
              <Button
                onClick={() => {
                  // Ensure we're using the correct path format for the callback URL
                  let callbackUrl = redirectPath || `/dashboard/${quizState?.quizType}/${quizState?.quizSlug}`

                  // Add completed=true parameter if the quiz is completed
                  if (quizState?.isCompleted) {
                    callbackUrl += `${callbackUrl.includes("?") ? "&" : "?"}completed=true`
                  }

                  router.push(`/auth/signin?callbackUrl=${encodeURIComponent(fixCallbackUrl(callbackUrl))}`)
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Otherwise, just render children
  return <>{children}</>
}
