"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { notFound } from "next/navigation"
import { useState, useCallback, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import type { CodingQuizProps } from "@/app/types/types"

import { Loader } from "@/components/ui/loader"
import QuizActions from "../../components/QuizActions"
import CodingQuiz from "./CodingQuiz"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { QuizFeedback } from "../../components/QuizFeedback"
import { useQuiz } from "@/app/context/QuizContext"
import { saveQuizResult, loadQuizResult, clearSavedQuizState } from "@/hooks/quiz-session-storage"
import { submitQuizResult } from "@/lib/quiz-result-service"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["quizData", slug],
    queryFn: () => getQuizData(slug),
    retry: 1, // Limit retries to avoid excessive API calls
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  })

  // Check for completed state in URL or localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && quizData?.quizId) {
      // Check URL for completed parameter
      const urlParams = new URLSearchParams(window.location.search)
      const hasCompletedParam = urlParams.get("completed") === "true"

      // Check localStorage for saved result
      const savedResult = loadQuizResult(quizData.quizId.toString())

      if (hasCompletedParam || (savedResult && savedResult.isCompleted)) {
        setIsCompleted(true)
        if (savedResult && savedResult.answers) {
          setAnswers(savedResult.answers)
        }
      }
    }
  }, [quizData?.quizId])

  // Complete quiz function
  const completeQuiz = async (finalAnswers: any[] = []) => {
    console.log("Completing quiz with answers:", finalAnswers)

    // Prevent multiple submissions
    if (submissionInProgress.current) {
      console.log("Submission already in progress, ignoring duplicate call")
      return
    }

    submissionInProgress.current = true
    setIsSubmitting(true)
    setError(null)
    hasSavedToDb.current = false

    try {
      // For code quizzes, we use a fixed score or calculate based on test cases
      const score = 100 // Or calculate based on test cases if available

      // Create the result object
      const result = {
        quizId: quizData?.quizId.toString() || "",
        slug,
        quizType: "code",
        score,
        answers: finalAnswers,
        totalTime: (Date.now() - startTime) / 1000,
        timestamp: Date.now(),
        isCompleted: true,
      }

      // Always save to localStorage for persistence
      if (quizData?.quizId) {
        saveQuizResult(quizData.quizId.toString(), result)
      }
      console.log("Saved result to localStorage:", result)

      // Set isCompleted to true before showing feedback
      setIsCompleted(true)

      // Show feedback modal
      setQuizResults({ score })
      setIsSuccess(true)
      setShowFeedbackModal(true)

      // If user is logged in, save to database
      if (isLoggedIn) {
        console.log("User is logged in, saving to database")
        try {
          await submitQuizResult({
            quizId: quizData?.quizId.toString() || "",
            slug,
            answers: finalAnswers,
            totalTime: (Date.now() - startTime) / 1000,
            score,
            type: "code",
            totalQuestions: quizData?.quizData?.questions?.length || 1,
          })
          console.log("Database save result successful")
          hasSavedToDb.current = true
        } catch (dbError) {
          console.error("Error saving to database:", dbError)
          setSaveError(dbError instanceof Error ? dbError.message : "Failed to save results to database")
          // Still show results even if DB save fails
        }
      } else {
        console.log("User is not logged in, saving to guest storage")
        // Save result for guest user with the correct dashboard path and completed parameter
        const dashboardPath = `/dashboard/code/${slug}?completed=true`
        saveGuestResult({
          ...result,
          redirectPath: dashboardPath, // Include the completed parameter directly in the path
          isCompleted: true,
        })

        // Also save to quiz state for authentication flow
        saveQuizState({
          quizId: quizData?.quizId.toString() || "",
          quizType: "code",
          slug,
          currentQuestion: 0,
          totalQuestions: quizData?.quizData?.questions?.length || 1,
          startTime,
          isCompleted: true,
          answers: finalAnswers,
          redirectPath: dashboardPath,
        })

        // Show auth modal with a slight delay to ensure results are displayed first
        setIsCompleted(true)
        setShowAuthModal(true)
      }
    } catch (err: any) {
      console.error("Error completing quiz:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSuccess(false)
      setShowFeedbackModal(true)
      // Even on error, we should show results with what we have
      setIsCompleted(true)
    } finally {
      setIsSubmitting(false)
      submissionInProgress.current = false
    }
  }

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
    setIsSuccess(false)
    setError(null)

    // Clear saved state
    if (quizData?.quizId) {
      clearSavedQuizState()
    }

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router, quizData?.quizId])

  if (isLoading) {
    return <Loader />
  }

  if (isError || !quizData) {
    console.error("Error loading quiz:", queryError)
    return notFound()
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
            isSuccess={isSuccess}
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
