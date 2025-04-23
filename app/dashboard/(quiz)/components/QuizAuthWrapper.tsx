"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useQuiz } from "../context/QuizContext"
// Add this to the imports
import { clearAllQuizData } from "@/app/dashboard/(quiz)/hooks/quiz-session-storage"

interface QuizAuthWrapperProps {
  children: React.ReactNode
  quizState?: any
  answers?: any[]
  redirectPath?: string
  requireAuth?: boolean
  showAuthModal?: boolean
  onAuthModalClose?: () => void
}

// Fix the callback URL function to properly handle the path transformation and preserve query parameters
export function fixCallbackUrl(url: string): string {
  if (!url) return "/dashboard"

  // Parse the URL to handle parameters properly
  let baseUrl = url
  let queryParams = ""

  if (url.includes("?")) {
    const parts = url.split("?")
    baseUrl = parts[0]
    queryParams = parts[1]
  }

  // Replace /quiz/ with /dashboard/ in the URL path
  if (baseUrl.includes("/quiz/")) {
    baseUrl = baseUrl.replace("/quiz/", "/dashboard/")
  }

  // Return the fixed URL with query parameters if any
  return queryParams ? `${baseUrl}?${queryParams}` : baseUrl
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
  const previousAuthState = useRef(false)

  // Debug the current path and redirectPath
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Current path:", window.location.pathname)
      console.log("Redirect path:", redirectPath)
      console.log("Fixed redirect path:", redirectPath ? fixCallbackUrl(redirectPath) : null)
    }
  }, [redirectPath])

  // Update the useEffect that handles saved quiz state to properly add the completed parameter
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading" && !hasCheckedStorage && !isRedirecting) {
      setHasCheckedStorage(true)

      // If user is authenticated and there's a saved quiz state, redirect to the saved path
      if (status === "authenticated") {
        const savedState = getQuizState()
        if (savedState && savedState.redirectPath) {
          // Check if we're already on the target page to prevent redirect loops
          const currentPath = window.location.pathname
          const currentSearch = window.location.search
          const currentUrl = currentPath + currentSearch

          // Always fix the path to ensure it uses /dashboard/ instead of /quiz/
          const targetPath = fixCallbackUrl(savedState.redirectPath)

          console.log("Current URL:", currentUrl)
          console.log("Target path:", targetPath)
          console.log("Saved state:", savedState)

          // Only redirect if we're not already on the target page with the completed parameter
          if (!currentUrl.includes("completed=true") && savedState.isCompleted) {
            setIsRedirecting(true)
            // Add a small delay to ensure state is properly set before redirect
            setTimeout(() => {
              // Ensure we add the completed parameter if the quiz is completed
              let redirectUrl = targetPath

              // Add completed=true parameter to the URL if the quiz was completed
              if (savedState.isCompleted && !redirectUrl.includes("completed=true")) {
                redirectUrl += `${redirectUrl.includes("?") ? "&" : "?"}completed=true`
              }

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

  // Fix the useEffect that handles authentication state changes
  useEffect(() => {
    // If user was authenticated and is now not, they signed out
    const wasAuthenticated = localStorage.getItem("wasAuthenticated") === "true"

    if (wasAuthenticated && status === "unauthenticated") {
      console.log("User signed out, clearing all quiz data")
      clearAllQuizData()
    }

    // Update authentication state
    if (status !== "loading") {
      localStorage.setItem("wasAuthenticated", status === "authenticated" ? "true" : "false")
      previousAuthState.current = status === "authenticated"
    }
  }, [status])

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
    setShowModal(requireAuth && status === "unauthenticated")
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

  // Fix the early return issue that's causing the "Rendered fewer hooks than expected" error
  // by ensuring all hooks are called unconditionally before any conditional returns

  // In the QuizAuthWrapper component, modify the loading state check:
  // Replace this:
  // With this:
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">
        {isRedirecting ? "Redirecting to your saved quiz..." : "Checking authentication..."}
      </p>
    </div>
  )

  // Similarly, modify the requireAuth check:
  // Replace this:
  // With this:
  const renderAuthRequiredModal = () => (
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

                // Always ensure we're using /dashboard/ not /quiz/
                callbackUrl = fixCallbackUrl(callbackUrl)

                // Add completed=true parameter if the quiz is completed
                if (quizState?.isCompleted && !callbackUrl.includes("completed=true")) {
                  callbackUrl += `${callbackUrl.includes("?") ? "&" : "?"}completed=true`
                }

                signIn("credentials", { callbackUrl })
              }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  )

  // Similarly for the showModal check:
  // Replace this:
  // With this:
  const renderSaveProgressModal = () => (
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

                // Always ensure we're using /dashboard/ not /quiz/
                callbackUrl = fixCallbackUrl(callbackUrl)

                // Save the current state before redirecting
                if (quizState && answers) {
                  saveQuizState({
                    quizId: quizState.quizId,
                    quizType: quizState.quizType,
                    slug: quizState.quizSlug,
                    currentQuestion: quizState.currentQuestion,
                    totalQuestions: quizState.totalQuestions,
                    startTime: quizState.startTime,
                    isCompleted: quizState.isCompleted, // This flag is enough
                    answers: answers,
                    redirectPath: callbackUrl, // Use the fixed URL
                  })
                }

                signIn("credentials", { callbackUrl })
              }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  )

  // Enhance the QuizAuthWrapper to properly clear guest data after authentication
  // This helps prevent the issue where guest results are still shown after sign-in

  // Add this to the component after successful authentication
  useEffect(() => {
    // If the user is now authenticated and we had guest data, clear it
    if (session?.user && quizState && previousAuthState.current === false) {
      // Clear guest data from storage
      if (typeof window !== "undefined") {
        // Clear quiz-specific data
        localStorage.removeItem(`guestQuizResults_${quizState.quizId}`)
        sessionStorage.removeItem(`guestQuizResults_${quizState.quizId}`)

        // Clear quiz state
        localStorage.removeItem(`quiz_state_${quizState.quizType}_${quizState.quizId}`)
        sessionStorage.removeItem(`quiz_state_${quizState.quizType}_${quizState.quizId}`)

        // Clear answers
        localStorage.removeItem(`quiz_answers_${quizState.quizId}`)

        console.log("Cleared guest data after authentication")
      }

      // Update the previous auth state
      previousAuthState.current = true
    }
  }, [session, quizState])

  if (requireAuth && status === "unauthenticated") {
    return renderAuthRequiredModal()
  }

  if (quizState && quizState.quizType && showModal) {
    return renderSaveProgressModal()
  }

  // And at the end of the component, replace the return statement with:
  if (status === "loading" || isRedirecting) {
    return renderLoadingState()
  }

  // Otherwise, just render children
  return <>{children}</>
}
