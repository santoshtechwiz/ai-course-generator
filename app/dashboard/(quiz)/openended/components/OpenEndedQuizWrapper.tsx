"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { QuizFeedback } from "../../components/QuizFeedback"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { quizStorageService } from "@/lib/quiz-storage-service"
import { quizService } from "@/lib/QuizService"
import { useQuiz } from "@/app/context/QuizContext"

interface OpenEndedQuizWrapperProps {
  quizData: any
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  // State
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[]
  >([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isRecoveringAnswers, setIsRecoveringAnswers] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { saveQuizState, saveGuestResult, setShowSignInPrompt } = useQuiz()

  // Refs
  const submissionInProgress = useRef(false)
  const hasSavedToDb = useRef(false)

  // Derived state
  const isLoggedIn = status === "authenticated"
  const quizId = quizData?.id || ""

  // Calculate a score for open-ended questions based on answer quality
  const calculateOpenEndedScore = useCallback(
    (finalAnswers: typeof answers): number => {
      // For open-ended quizzes, we'll evaluate answers based on length and content
      if (!finalAnswers.length || !quizData.questions.length) return 0

      let totalScore = 0

      finalAnswers.forEach((answer, index) => {
        const question = quizData.questions[index]
        if (!question || !answer.answer) return

        // Base score: 70% just for answering
        let questionScore = 70

        // Add up to 30% based on answer length (minimum 20 chars for full points)
        const answerLength = answer.answer.trim().length
        const lengthScore = Math.min(30, Math.round((answerLength / 20) * 30))

        // Combine scores
        questionScore += lengthScore

        // Cap at 100%
        questionScore = Math.min(100, questionScore)

        totalScore += questionScore
      })

      // Calculate average score across all questions
      return Math.round(totalScore / quizData.questions.length)
    },
    [quizData.questions],
  )

  // Initialize quiz state
  useEffect(() => {
    if (status === "loading" || hasInitialized) return

    const initializeQuiz = async () => {
      setIsLoading(true)
      setIsRecoveringAnswers(true)
      setHasInitialized(true)

      try {
        // Check if quiz data is valid
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          console.error("Invalid quiz data:", quizData)
          setError("Quiz data could not be loaded. Please try again later.")
          setIsLoading(false)
          setIsRecoveringAnswers(false)
          return
        }

        // Check if we have a completed quiz state in the URL query params
        const urlParams = new URLSearchParams(window.location.search)
        const hasCompletedParam = urlParams.get("completed") === "true"

        console.log("URL params check:", {
          hasCompletedParam,
          completed: urlParams.get("completed"),
          search: window.location.search,
        })

        // Check if user just signed in
        const wasSignedOut = sessionStorage.getItem("wasSignedIn") === "false"
        const isNowSignedIn = status === "authenticated" && wasSignedOut

        // If user just signed in, check for guest results to display FIRST
        if (isNowSignedIn) {
          console.log("User just signed in, checking for guest results")
          const guestResult = quizService.getGuestResult(quizId)

          if (guestResult) {
            console.log("Found guest result after sign in:", guestResult)
            if (guestResult.answers && guestResult.answers.length > 0) {
              setAnswers(guestResult.answers)
              setQuizResults({ score: guestResult.score || 0 })
              setIsCompleted(true)
              setIsLoading(false)
              setIsRecoveringAnswers(false)

              // Update sessionStorage to prevent this check on subsequent loads
              sessionStorage.setItem("wasSignedIn", "true")

              // Clear guest result after using it
              setTimeout(() => {
                quizService.clearGuestResult(quizId)
              }, 1000)

              return
            }
          }
        }

        // First check for saved result in storage
        const savedResult = quizService.getQuizResult(quizId)
        console.log("Checking for saved result:", savedResult)

        // If we have a completed param or saved results, show the results immediately
        if (hasCompletedParam || (savedResult && savedResult.isCompleted)) {
          console.log("Found completed quiz state or saved results", savedResult)

          if (savedResult && savedResult.answers) {
            console.log("Setting answers from saved result:", savedResult.answers)
            setAnswers(savedResult.answers || [])
            setQuizResults({ score: savedResult.score || 0 })
          }

          setIsCompleted(true)
          setIsLoading(false)
          setIsRecoveringAnswers(false)
          return
        }

        // Try to load answers from storage
        const savedAnswers = quizStorageService.getQuizAnswers(quizId)
        if (savedAnswers && savedAnswers.length > 0) {
          console.log("Found saved answers in storage:", savedAnswers)
          setAnswers(savedAnswers)

          // If we also have a completed param, show the results
          if (hasCompletedParam) {
            console.log("Setting isCompleted to true based on URL param")
            setIsCompleted(true)
          }

          setIsLoading(false)
          setIsRecoveringAnswers(false)
          return
        }

        // Update signed in state
        sessionStorage.setItem("wasSignedIn", status === "authenticated" ? "true" : "false")

        // Check for saved state in storage
        const savedState = quizService.getQuizState(quizId, "openended")
        console.log("Checking saved state:", savedState)

        // Check if there's a saved state for this quiz, restore it
        if (savedState) {
          setCurrentQuestion(savedState.currentQuestion || 0)
          setStartTime(savedState.startTime || Date.now())
          setIsCompleted(savedState.isCompleted || false)

          if (savedState.answers) {
            console.log("Setting answers from saved state:", savedState.answers)
            setAnswers(savedState.answers)
          }

          // If quiz was completed, show results
          if (savedState.isCompleted) {
            setIsCompleted(true)

            // Calculate score if not available
            if (!quizResults) {
              const score = calculateOpenEndedScore(savedState.answers || [])
              setQuizResults({ score })
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading saved quiz state:", err)
        setError("Failed to load quiz state. Please try again.")
      } finally {
        setIsLoading(false)
        setIsRecoveringAnswers(false)
      }
    }

    initializeQuiz()
  }, [quizId, status, quizData, calculateOpenEndedScore, quizResults])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0) {
        quizService.saveQuizState({
          quizId,
          quizType: "openended",
          slug,
          currentQuestion,
          totalQuestions: quizData?.questions?.length || 0,
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
  }, [answers, currentQuestion, isCompleted, quizId, quizData?.questions?.length, slug, startTime])

  // Save answers whenever they change
  useEffect(() => {
    if (answers.length > 0) {
      quizStorageService.saveQuizAnswers(quizId, answers)
    }
  }, [answers, quizId])

  // Complete quiz function
  const completeQuiz = async (finalAnswers: typeof answers) => {
    console.log("Completing quiz with answers:", finalAnswers)

    // Save answers to storage immediately
    quizStorageService.saveQuizAnswers(quizId, finalAnswers)

    // Prevent multiple submissions
    if (submissionInProgress.current) {
      console.log("Submission already in progress, ignoring duplicate call")
      return
    }

    submissionInProgress.current = true
    setIsSubmitting(true)
    setError(null)
    setSaveError(null)
    hasSavedToDb.current = false

    try {
      // Calculate scores for the quiz
      const score = calculateOpenEndedScore(finalAnswers)
      console.log("Calculated score:", score)

      // Create the result object
      const result = {
        quizId,
        slug,
        quizType: "openended",
        score,
        answers: finalAnswers,
        totalTime: (Date.now() - startTime) / 1000,
        timestamp: Date.now(),
        isCompleted: true,
      }

      // Save to storage
      quizService.saveQuizResult(result)
      console.log("Saved result to storage:", result)

      // Set isCompleted to true before showing feedback
      setIsCompleted(true)

      // Show feedback modal
      setQuizResults({ score })
      setIsSuccess(true)
      setShowFeedbackModal(true)

      // If user is logged in, save to database
      if (isLoggedIn) {
        console.log("User is logged in, saving to database")

        // Check if we've already saved this result
        const alreadySaved = localStorage.getItem(`quiz_${quizId}_saved`) === "true"
        if (alreadySaved) {
          console.log("Results already saved, skipping submission")
          hasSavedToDb.current = true
          return
        }

        try {
          const response = await fetch(`/api/quiz/${slug}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizId,
              slug,
              answers: finalAnswers.map((a) => ({
                answer: a.answer,
                timeSpent: a.timeSpent,
                hintsUsed: a.hintsUsed,
                similarity: a.similarity,
              })),
              totalTime: (Date.now() - startTime) / 1000,
              score,
              type: "openended",
              totalQuestions: quizData.questions.length,
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to save results: ${response.status}`)
          }

          console.log("Database save result successful")
          hasSavedToDb.current = true
          localStorage.setItem(`quiz_${quizId}_saved`, "true")
        } catch (dbError) {
          console.error("Error saving to database:", dbError)
          setSaveError(dbError instanceof Error ? dbError.message : "Failed to save results to database")
          // Still show results even if DB save fails
        }
      } else {
        console.log("User is not logged in, saving to guest storage")
        // Save result for guest user with the correct dashboard path and completed parameter
        const dashboardPath = `/dashboard/openended/${slug}?completed=true`
        saveGuestResult({
          ...result,
          redirectPath: dashboardPath, // Include the completed parameter directly in the path
          isCompleted: true,
        })

        // Also save to quiz state for authentication flow
        saveQuizState({
          quizId,
          quizType: "openended",
          slug,
          currentQuestion,
          totalQuestions: quizData.questions?.length || 0,
          startTime,
          isCompleted: true,
          answers: finalAnswers,
          redirectPath: dashboardPath,
        })

        // Show auth modal with a slight delay to ensure results are displayed first
        setTimeout(() => {
          setShowAuthModal(true)
        }, 500)
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

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string) => {
      // Calculate time spent on this question
      const timeSpent = (Date.now() - startTime) / 1000
      const hintsUsed = false // You can implement hint tracking if needed

      // Create a new answers array with the current answer
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed }
      setAnswers(newAnswers)

      // Check if this is the last question
      if (currentQuestion < quizData.questions.length - 1) {
        // Move to the next question
        setCurrentQuestion((prev) => prev + 1)
        // Reset the start time for the next question
        setStartTime(Date.now())
      } else {
        // This is the last question, complete the quiz
        completeQuiz(newAnswers)
      }
    },
    [answers, currentQuestion, quizData.questions.length, startTime],
  )

  // Handle quiz restart
  const handleRestart = useCallback(() => {
    setCurrentQuestion(0)
    setAnswers([])
    setIsCompleted(false)
    setStartTime(Date.now())
    setShowFeedbackModal(false)
    setQuizResults(null)
    setIsSubmitting(false)
    setIsSuccess(false)
    setError(null)
    setSaveError(null)

    // Clear saved state
    quizService.clearQuizState(quizId, "openended")
    localStorage.removeItem(`quiz_${quizId}_saved`)

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router, quizId])

  // Handle quiz completion
  const handleComplete = useCallback(
    (score: number) => {
      // Update quiz results
      setQuizResults({ score })

      // If user is logged in, update the score in the database
      if (isLoggedIn) {
        // Check if we've already saved this result
        const alreadySaved = localStorage.getItem(`quiz_${quizId}_saved`) === "true"
        if (alreadySaved) {
          console.log("Results already saved, skipping submission")
          return
        }

        fetch(`/api/quiz/${slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId,
            slug,
            answers: answers.map((a) => ({
              answer: a.answer,
              timeSpent: a.timeSpent,
              hintsUsed: a.hintsUsed,
              similarity: a.similarity,
            })),
            totalTime: (Date.now() - startTime) / 1000,
            score,
            type: "openended",
            totalQuestions: quizData.questions.length,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to update score: ${response.status}`)
            }
            localStorage.setItem(`quiz_${quizId}_saved`, "true")
            console.log("Score updated successfully")
          })
          .catch((err) => {
            console.error("Error updating quiz score:", err)
            setSaveError(err instanceof Error ? err.message : "Failed to update score")
          })
      }
    },
    [answers, isLoggedIn, quizId, quizData.questions.length, slug, startTime],
  )

  // Handle feedback modal continue button
  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
    // Ensure isCompleted is set to true when feedback modal is closed
    setIsCompleted(true)
  }, [])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestionData = useMemo(() => {
    return quizData?.questions?.[currentQuestion] || null
  }, [currentQuestion, quizData?.questions])

  // Loading state
  if (isLoading || isRecoveringAnswers) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            {error || "We couldn't load the quiz data. Please try again later."}
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/openended")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render quiz or results
  return (
    <QuizAuthWrapper
      quizState={{
        quizId,
        quizType: "openended",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData?.questions?.length || 0,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/dashboard/openended/${slug}?completed=true`} // Always include completed=true
      showAuthModal={showAuthModal}
      onAuthModalClose={() => setShowAuthModal(false)}
    >
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <QuizResultsOpenEnded
              answers={answers}
              questions={quizData.questions}
              onRestart={handleRestart}
              onComplete={handleComplete}
              quizId={quizId}
              title={quizData.title}
              slug={slug}
              clearGuestData={() => quizService.clearQuizState(quizId, "openended")}
              startTime={startTime}
              totalQuestions={quizData.questions.length}
              score={quizResults?.score || 0}
              onSignIn={() => setShowAuthModal(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentQuestionData && (
              <OpenEndedQuizQuestion
                question={currentQuestionData}
                onAnswer={handleAnswer}
                questionNumber={currentQuestion + 1}
                totalQuestions={quizData.questions.length}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={!!error || !!saveError}
          score={quizResults?.score || 0}
          totalQuestions={100} // Use 100 for percentage display
          onContinue={handleFeedbackContinue}
          errorMessage={error || saveError || undefined}
          quizType="openended"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
