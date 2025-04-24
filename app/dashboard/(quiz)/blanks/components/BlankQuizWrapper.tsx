"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"

import { QuizFeedback } from "../../components/QuizFeedback"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { quizStorageService } from "@/lib/quiz-storage-service"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { quizService } from "@/lib/QuizService" // Import QuizService
import { useQuiz } from "@/app/context/QuizContext"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
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

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { saveQuizState, saveGuestResult, setShowSignInPrompt } = useQuiz()

  // Refs
  const submissionInProgress = useRef(false)
  const hasSavedToDb = useRef(false)

  // Derived state
  const isLoggedIn = status === "authenticated"

  // Initialize quiz state
  useEffect(() => {
    let guestResult: any
    let savedResult: any
    let savedAnswers: any
    let savedState: any

    const initializeQuiz = async () => {
      if (typeof window !== "undefined" && status !== "loading") {
        setIsLoading(true)
        try {
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
            guestResult = quizService.getGuestResult(quizData.id)

            if (guestResult) {
              console.log("Found guest result after sign in:", guestResult)
              if (guestResult.answers && guestResult.answers.length > 0) {
                setAnswers(guestResult.answers)
                setIsCompleted(true)
                setIsLoading(false)

                // Update sessionStorage to prevent this check on subsequent loads
                sessionStorage.setItem("wasSignedIn", "true")
                return
              }
            }
          }

          // First check for saved result in storage
          savedResult = quizService.getQuizResult(quizData.id)
          console.log("Checking for saved result:", savedResult)

          // If we have a completed param or saved results, show the results immediately
          if (hasCompletedParam || savedResult) {
            console.log("Found completed quiz state or saved results", savedResult)
            if (savedResult && savedResult.answers) {
              console.log("Setting answers from saved result:", savedResult.answers)
              setAnswers(savedResult.answers || [])
            }
            setIsCompleted(true)
            setIsLoading(false)
            return
          }

          // Try to load answers from storage
          savedAnswers = quizStorageService.getQuizAnswers(quizData.id)
          if (savedAnswers && savedAnswers.length > 0) {
            console.log("Found saved answers in storage:", savedAnswers)
            setAnswers(savedAnswers)

            // If we also have a completed param, show the results
            if (hasCompletedParam) {
              console.log("Setting isCompleted to true based on URL param")
              setIsCompleted(true)
            }

            setIsLoading(false)
            return
          }

          // Update signed in state
          sessionStorage.setItem("wasSignedIn", status === "authenticated" ? "true" : "false")

          // Check for saved state in storage
          savedState = quizService.getQuizState(quizData.id, "blanks")
          console.log("Checking saved state:", savedState)

          // Check if there's a saved state for this quiz, restore it
          if (savedState) {
            setCurrentQuestion(savedState.currentQuestion)
            setStartTime(savedState.startTime)
            setIsCompleted(savedState.isCompleted)

            if (savedState.answers) {
              console.log("Setting answers from saved state:", savedState.answers)
              setAnswers(savedState.answers)
            }

            // If quiz was completed, show results
            if (savedState.isCompleted) {
              setIsCompleted(true)
            }
          }
        } catch (err: any) {
          console.error("Error loading saved quiz state:", err)
        } finally {
          setIsLoading(false)
        }
      }
    }
    initializeQuiz()
  }, [quizData?.id, status])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0) {
        quizService.saveQuizState({
          quizId: quizData.id,
          quizType: "blanks",
          slug,
          currentQuestion,
          totalQuestions: quizData.questions?.length || 0,
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
  }, [answers, currentQuestion, isCompleted, quizData.id, quizData.questions?.length, slug, startTime])

  // Save answers whenever they change
  useEffect(() => {
    if (answers.length > 0) {
      quizStorageService.saveQuizAnswers(quizData.id, answers)
    }
  }, [answers, quizData.id])

  // Complete quiz function
  const completeQuiz = async (finalAnswers: typeof answers) => {
    console.log("Completing quiz with answers:", finalAnswers)

    // Save answers to storage immediately
    quizStorageService.saveQuizAnswers(quizData.id, finalAnswers)

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
      // Calculate scores for the quiz using similarity
      const calculateScore = () => {
        let totalSimilarity = 0
        const questions = quizData.questions

        for (let i = 0; i < finalAnswers.length; i++) {
          if (questions[i] && finalAnswers[i]) {
            // Use the similarity if it's already calculated
            if (finalAnswers[i].similarity !== undefined) {
              totalSimilarity += finalAnswers[i].similarity
            } else {
              // Calculate similarity if not already done
              const userAnswer = finalAnswers[i].answer?.trim().toLowerCase() || ""
              const correctAnswer = questions[i].answer?.trim().toLowerCase() || ""
              const similarity = quizStorageService.calculateSimilarity(correctAnswer, userAnswer)
              finalAnswers[i].similarity = similarity
              totalSimilarity += similarity
            }
          }
        }

        return Math.round(totalSimilarity / Math.max(1, finalAnswers.length))
      }

      const score = calculateScore()
      console.log("Calculated score:", score)

      // Create the result object
      const result = {
        quizId: quizData.id,
        slug,
        quizType: "blanks",
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
        try {
          await fetch(`/api/quiz/${slug}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizId: quizData.id,
              slug,
              answers: finalAnswers.map((a) => ({
                answer: a.answer,
                timeSpent: a.timeSpent,
                hintsUsed: a.hintsUsed,
                similarity: a.similarity,
              })),
              totalTime: (Date.now() - startTime) / 1000,
              score,
              type: "blanks",
              totalQuestions: quizData.questions.length,
            }),
          })
          console.log("Database save result successful")
          hasSavedToDb.current = true
          localStorage.setItem(`quiz_${quizData.id}_saved`, "true")
        } catch (dbError) {
          console.error("Error saving to database:", dbError)
          setSaveError(dbError instanceof Error ? dbError.message : "Failed to save results to database")
          // Still show results even if DB save fails
        }
      } else {
        console.log("User is not logged in, saving to guest storage")
        // Save result for guest user with the correct dashboard path and completed parameter
        const dashboardPath = `/dashboard/blanks/${slug}?completed=true`
        saveGuestResult({
          ...result,
          redirectPath: dashboardPath, // Include the completed parameter directly in the path
          isCompleted: true,
        })

        // Also save to quiz state for authentication flow
        saveQuizState({
          quizId: quizData.id,
          quizType: "blanks",
          slug,
          currentQuestion,
          totalQuestions: quizData.questions.length,
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
    (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed, similarity }
        return newAnswers
      })

      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setStartTime(Date.now()) // Reset start time for the next question
      } else {
        // For the last question, we need to update answers first, then complete the quiz
        const updatedAnswers = [...answers]
        updatedAnswers[currentQuestion] = { answer, timeSpent, hintsUsed, similarity }
        completeQuiz(updatedAnswers)
      }
    },
    [answers, currentQuestion, quizData.questions.length],
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

    // Clear saved state
    quizService.clearQuizState(quizData.id, "blanks")

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router, quizData.id])

  // Handle quiz completion
  const handleComplete = useCallback(
    (score: number) => {
      // Update quiz results
      setQuizResults({ score })

      // If user is logged in, update the score in the database
      if (isLoggedIn) {
        fetch(`/api/quiz/${slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: quizData.id,
            slug,
            answers: answers.map((a) => ({
              answer: a.answer,
              timeSpent: a.timeSpent,
              hintsUsed: a.hintsUsed,
              similarity: a.similarity,
            })),
            totalTime: (Date.now() - startTime) / 1000,
            score,
            type: "blanks",
            totalQuestions: quizData.questions.length,
          }),
        }).catch((err) => {
          console.error("Error updating quiz score:", err)
        })
      }
    },
    [answers, isLoggedIn, quizData.id, quizData.questions.length, slug, startTime],
  )

  // Handle feedback modal continue button
  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
    // Ensure isCompleted is set to true when feedback modal is closedeedback modal is closed
    setIsCompleted(true)
  }, [])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestionData = useMemo(() => {
    return quizData.questions?.[currentQuestion] || null
  }, [currentQuestion, quizData.questions])

  // Loading state
  if (isLoading) {
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
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            We couldn't load the quiz data. Please try again later.
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/blanks")}>Return to Quiz Creator</Button>
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
        quizId: quizData?.id,
        quizType: "blanks",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData?.questions?.length || 0,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/dashboard/blanks/${slug}?completed=true`} // Always include completed=true
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
            <BlankQuizResults
              answers={answers}
              questions={quizData.questions}
              onRestart={handleRestart}
              onComplete={handleComplete}
              quizId={quizData.id}
              title={quizData.title}
              slug={slug}
              clearGuestData={() => quizService.clearQuizState(quizData.id, "blanks")}
              startTime={startTime}
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
              <FillInTheBlanksQuiz
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
          isError={!!error}
          score={quizResults?.score || 0}
          totalQuestions={100} // Use 100 for percentage display
          onContinue={handleFeedbackContinue}
          errorMessage={error || undefined}
          quizType="blanks"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
