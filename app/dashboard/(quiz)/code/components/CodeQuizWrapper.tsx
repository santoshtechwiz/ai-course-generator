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
import { useQuiz } from "@/app/dashboard/(quiz)/context/QuizContext"
import { useQuizResult } from "@/app/dashboard/(quiz)/hooks/useQuizResult"

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

  // Refs
  const submissionInProgress = useRef(false)

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

  // Use the quiz result hook
  const {
    isLoading: isSavingResult,
    isSaving,
    error: saveError,
    saveResult,
  } = useQuizResult({
    quizId: quizData?.quizId?.toString() || "",
    slug,
    answers,
    totalTime,
    score,
    quizType: "code",
    totalQuestions: quizData?.quizData?.questions?.length || 1,
    startTime,
  })

  // Calculate total time whenever needed
  useEffect(() => {
    if (startTime) {
      const calculatedTotalTime = (Date.now() - startTime) / 1000
      setTotalTime(calculatedTotalTime > 0 ? calculatedTotalTime : 300) // Default to 5 minutes if invalid
    }
  }, [startTime, isCompleted])

  // Check for completed state in URL
  useEffect(() => {
    if (typeof window !== "undefined" && quizData?.quizId) {
      setIsRecoveringAnswers(true)

      try {
        // Check URL for completed parameter
        const urlParams = new URLSearchParams(window.location.search)
        const hasCompletedParam = urlParams.get("completed") === "true"

        if (hasCompletedParam) {
          setIsCompleted(true)
        }
      } catch (error) {
        console.error("Error checking URL parameters:", error)
      } finally {
        setIsRecoveringAnswers(false)
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

    try {
      // Update answers state
      setAnswers(finalAnswers)

      // Calculate total time
      const calculatedTotalTime = (Date.now() - startTime) / 1000
      setTotalTime(calculatedTotalTime)

      // Create the result object
      const result = {
        quizId: quizData?.quizId.toString() || "",
        slug,
        quizType: "code",
        score,
        answers: finalAnswers,
        totalTime: calculatedTotalTime,
        timestamp: Date.now(),
        isCompleted: true,
      }

      // Set isCompleted to true before showing feedback
      setIsCompleted(true)

      // Show feedback modal
      setQuizResults({ score })
      setShowFeedbackModal(true)

      // If user is logged in, save to database
      if (isLoggedIn) {
        console.log("User is logged in, saving to database")
        await saveResult()
      } else {
        console.log("User is not logged in, saving to guest storage")
        // Save result for guest user with the correct dashboard path and completed parameter
        const dashboardPath = `/dashboard/code/${slug}?completed=true`
        saveGuestResult({
          ...result,
          redirectPath: dashboardPath,
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
        setTimeout(() => {
          setShowAuthModal(true)
        }, 1000)
      }
    } catch (err: any) {
      console.error("Error completing quiz:", err)
      // Even on error, we should show results with what we have
      setIsCompleted(true)
    } finally {
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

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router])

  if (isLoading || isRecoveringAnswers) {
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
            isSubmitting={isSaving}
            isSuccess={!saveError}
            isError={!!saveError}
            score={quizResults?.score || 0}
            totalQuestions={100} // Use 100 for percentage display
            onContinue={handleFeedbackContinue}
            errorMessage={saveError || undefined}
            quizType="code"
            waitForSave={true}
            autoClose={false}
          />
        )}
      </div>
    </QuizAuthWrapper>
  )
}
