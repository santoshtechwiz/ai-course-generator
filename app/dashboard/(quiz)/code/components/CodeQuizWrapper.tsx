"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useState, useCallback, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import type { CodingQuizProps } from "@/app/types/types"

import { Loader } from "@/components/ui/loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

import QuizActions from "../../components/QuizActions"
import CodingQuiz from "./CodingQuiz"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { QuizFeedback } from "../../components/QuizFeedback"
import { quizService } from "@/lib/QuizService"
import { useQuiz } from "@/app/context/QuizContext"

// Improved error handling for API requests
async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await axios.get<CodingQuizProps>(`/api/code-quiz/${slug}`)
    if (response.status !== 200) {
      throw new Error(`Failed to fetch quiz data: ${response.statusText}`)
    }
    return response.data
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

interface CodingQuizWrapperProps {
  slug: string
  userId: string
}

export default function CodeQuizWrapper({ slug, userId }: CodingQuizWrapperProps) {
  // State
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [answers, setAnswers] = useState<any[]>([])
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [isRecoveringAnswers, setIsRecoveringAnswers] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [score, setScore] = useState(100) // Default score for code quizzes
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Refs
  const submissionInProgress = useRef(false)
  const hasSavedToDb = useRef(false)

  // Hooks
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const router = useRouter()
  const { saveQuizState, saveGuestResult } = useQuiz()

  const {
    data: quizData,
    isLoading: isLoadingQuizData,
    isError: isErrorQuizData,
    error: queryError,
  } = useQuery({
    queryKey: ["quizData", slug],
    queryFn: () => getQuizData(slug),
    enabled: !!slug, // Ensure the query only runs when slug is available
    retry: 1, // Limit retries to avoid excessive API calls
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  })

  // Calculate total time whenever needed
  useEffect(() => {
    if (startTime) {
      const calculatedTotalTime = (Date.now() - startTime) / 1000
      setTotalTime(calculatedTotalTime > 0 ? calculatedTotalTime : 300) // Default to 5 minutes if invalid
    }
  }, [startTime, isCompleted])

  // Initialize quiz state
  useEffect(() => {
    if (status === "loading" || !quizData || hasInitialized) return

    const initializeQuiz = async () => {
      setIsRecoveringAnswers(true)
      setHasInitialized(true)

      try {
        // Check URL for completed parameter
        const urlParams = new URLSearchParams(window.location.search)
        const hasCompletedParam = urlParams.get("completed") === "true"

        // Check if user just signed in
        const wasSignedOut = sessionStorage.getItem("wasSignedIn") === "false"
        const isNowSignedIn = status === "authenticated" && wasSignedOut

        // If user just signed in, check for guest results to display FIRST
        if (isNowSignedIn) {
          console.log("User just signed in, checking for guest results")
          const guestResult = quizService.getGuestResult(quizData.quizId.toString())

          if (guestResult) {
            console.log("Found guest result after sign in:", guestResult)
            if (guestResult.answers && guestResult.answers.length > 0) {
              setAnswers(guestResult.answers)
              setScore(guestResult.score || 100)
              setIsCompleted(true)
              setIsRecoveringAnswers(false)

              // Update sessionStorage to prevent this check on subsequent loads
              sessionStorage.setItem("wasSignedIn", "true")

              // Clear guest result after using it
              setTimeout(() => {
                quizService.clearGuestResult(quizData.quizId.toString())
              }, 1000)

              return
            }
          }
        }

        // Check for saved result in storage
        const savedResult = quizService.getQuizResult(quizData.quizId.toString())
        console.log("Checking for saved result:", savedResult)

        // If we have a completed param or saved results, show the results immediately
        if (hasCompletedParam || (savedResult && savedResult.isCompleted)) {
          console.log("Found completed quiz state or saved results", savedResult)
          if (savedResult && savedResult.answers) {
            console.log("Setting answers from saved result:", savedResult.answers)
            setAnswers(savedResult.answers || [])
            setScore(savedResult.score || 100)
          }
          setIsCompleted(true)
          setIsRecoveringAnswers(false)
          return
        }

        // Check for saved state in storage
        const savedState = quizService.getQuizState(quizData.quizId.toString(), "code")
        console.log("Checking saved state:", savedState)

        // Check if there's a saved state for this quiz, restore it
        if (savedState) {
          setStartTime(savedState.startTime || Date.now())
          setIsCompleted(savedState.isCompleted || false)

          if (savedState.answers) {
            console.log("Setting answers from saved state:", savedState.answers)
            setAnswers(savedState.answers)
          }

          // If quiz was completed, show results
          if (savedState.isCompleted) {
            setIsCompleted(true)
          }
        }

        // Update signed in state
        sessionStorage.setItem("wasSignedIn", status === "authenticated" ? "true" : "false")
      } catch (error) {
        console.error("Error checking URL parameters:", error)
        setError("Failed to load quiz state. Please try again.")
      } finally {
        setIsRecoveringAnswers(false)
      }
    }

    initializeQuiz()
  }, [quizData, status])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (quizData && !isCompleted) {
        quizService.saveQuizState({
          quizId: quizData.quizId.toString(),
          quizType: "code",
          slug,
          currentQuestion: 0,
          totalQuestions: quizData.quizData?.questions?.length || 1,
          startTime,
          isCompleted,
          answers,
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [answers, isCompleted, quizData, slug, startTime])

  // Fix the quiz completion logic to be more robust
  const completeQuiz = useCallback(
    async (finalAnswers: typeof answers) => {
      if (submissionInProgress.current) return

      submissionInProgress.current = true
      setIsSubmitting(true)
      setError(null)

      try {
        const validAnswers = finalAnswers.filter((a) => a !== null && a !== undefined)
        const score = Math.round(
          (validAnswers.reduce((sum, a) => sum + (a.similarity || 0), 0) / Math.max(1, validAnswers.length)) * 100,
        )

        setQuizResults({ score })

        const result = {
          quizId,
          slug,
          quizType: "code",
          score,
          answers: finalAnswers,
          totalTime: (Date.now() - startTime) / 1000,
          timestamp: Date.now(),
          isCompleted: true,
        }

        quizService.saveQuizResult(result)

        if (isLoggedIn) {
          const response = await fetch(`/api/quiz/${slug}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          })

          if (!response.ok) {
            throw new Error(`Failed to save results: ${response.status}`)
          }
        }

        setIsCompleted(true)
      } catch (err) {
        setError("Failed to complete quiz. Please try again.")
      } finally {
        setIsSubmitting(false)
        submissionInProgress.current = false
      }
    },
    [quizId, slug, startTime, isLoggedIn],
  )

  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed, similarity }
        return newAnswers
      })

      if (currentQuestion >= totalQuestions - 1) {
        completeQuiz([...answers, { answer, timeSpent, hintsUsed, similarity }])
      } else {
        setCurrentQuestion((prev) => prev + 1)
        setStartTime(Date.now())
      }
    },
    [currentQuestion, totalQuestions, completeQuiz, answers],
  )

  const handleQuizComplete = useCallback(
    (quizAnswers: any[] = []) => {
      completeQuiz(quizAnswers)
    },
    [quizData, slug, startTime, isLoggedIn],
  )

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  // Handle feedback modal continue button
  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
    // Ensure isCompleted is set to true when feedback modal is closed
    setIsCompleted(true)
  }, [])

  // Handle quiz restart
  const handleRestart = useCallback(() => {
    setIsCompleted(false)
    setAnswers([])
    setStartTime(Date.now())
    setShowFeedbackModal(false)
    setQuizResults(null)
    setIsSubmitting(false)
    setError(null)

    // Clear saved state
    if (quizData) {
      quizService.clearQuizState(quizData.quizId.toString(), "code")
      localStorage.removeItem(`quiz_${quizData.quizId}_saved`)
    }

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router, quizData])

  if (isLoadingQuizData || isRecoveringAnswers) {
    return <Loader />
  }

  if (isErrorQuizData || !quizData) {
    console.error("Error loading quiz:", queryError)
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            We couldn't load the quiz data. Please try again later.
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/code")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <QuizAuthWrapper
      quizState={{
        quizId: quizData.quizId.toString(),
        quizType: "code",
        quizSlug: slug,
        currentQuestion: 0,
        totalQuestions: quizData.quizData?.questions?.length || 1,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/dashboard/code/${slug}?completed=true`}
      showAuthModal={showAuthModal}
      onAuthModalClose={handleAuthModalClose}
    >
      <div className="flex flex-col gap-4 p-4">
        <QuizActions
          quizId={quizData.quizId.toString()}
          quizSlug={quizData.slug}
          initialIsPublic={quizData.isPublic}
          initialIsFavorite={quizData.isFavorite}
          userId={userId}
          ownerId={quizData?.ownerId || ""}
          position="left-center"
        />

        <CodingQuiz
          quizId={quizData.quizId.toString()}
          slug={quizData.slug}
          isFavorite={quizData.isFavorite}
          isPublic={quizData.isPublic}
          userId={userId}
          ownerId={quizData?.ownerId || ""}
          quizData={quizData.quizData}
          onComplete={handleQuizComplete}
          isCompleted={isCompleted}
          savedAnswers={answers}
          onRestart={handleRestart}
        />

        {showFeedbackModal && (
          <QuizFeedback
            isSubmitting={isSubmitting}
            isSuccess={!error}
            isError={!!error}
            score={quizResults?.score || 0}
            totalQuestions={100} // Use 100 for percentage display
            onContinue={handleFeedbackContinue}
            errorMessage={error || undefined}
            quizType="code"
            waitForSave={true}
            autoClose={false}
          />
        )}
      </div>
    </QuizAuthWrapper>
  )
}
