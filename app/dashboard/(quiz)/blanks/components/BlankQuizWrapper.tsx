"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { getSavedQuizState, clearSavedQuizState } from "@/hooks/quiz-session-storage"
import { QuizFeedback } from "../../components/QuizFeedback"
import { submitQuizResult } from "@/lib/quiz-result-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuiz } from "@/app/context/QuizContext"

// Add this function at the top of the file, outside the component
function clearQuizStateForId(quizId: string) {
  if (typeof window === "undefined") return

  // Clear all storage related to this quiz
  localStorage.removeItem(`quiz_result_${quizId}`)
  sessionStorage.removeItem(`quiz_state_blanks_${quizId}`)

  // Also check for any other keys that might contain this quiz ID
  Object.keys(localStorage).forEach((key) => {
    if (key.includes(quizId)) {
      localStorage.removeItem(key)
    }
  })

  Object.keys(sessionStorage).forEach((key) => {
    if (key.includes(quizId)) {
      sessionStorage.removeItem(key)
    }
  })
}

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoggedIn = status === "authenticated"
  const submissionInProgress = useRef(false)
  const hasSavedToDb = useRef(false)

  const { saveQuizState, saveGuestResult, setShowSignInPrompt } = useQuiz()

  // Add this function to ensure answers are properly saved to localStorage
  const saveAnswersToLocalStorage = useCallback(
    (answersToSave: typeof answers) => {
      if (typeof window === "undefined" || !quizData?.id) return

      try {
        // Save answers to localStorage with quiz ID
        const storageKey = `quiz_answers_${quizData.id}`
        localStorage.setItem(storageKey, JSON.stringify(answersToSave))
        console.log("Saved answers to localStorage:", answersToSave)
      } catch (error) {
        console.error("Error saving answers to localStorage:", error)
      }
    },
    [quizData?.id],
  )

  // Add this function to load answers from localStorage
  const loadAnswersFromLocalStorage = useCallback(() => {
    if (typeof window === "undefined" || !quizData?.id) return null

    try {
      const storageKey = `quiz_answers_${quizData.id}`
      const savedAnswers = localStorage.getItem(storageKey)
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers)
        console.log("Loaded answers from localStorage:", parsedAnswers)
        return parsedAnswers
      }
    } catch (error) {
      console.error("Error loading answers from localStorage:", error)
    }
    return null
  }, [quizData?.id])

  // Modify the completeQuiz function to save answers to localStorage
  const completeQuiz = async (finalAnswers: typeof answers) => {
    console.log("Completing quiz with answers:", finalAnswers)

    // Save answers to localStorage immediately
    saveAnswersToLocalStorage(finalAnswers)

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
      // Calculate a score for the quiz
      const calculateOpenEndedScore = (answers: any) => {
        let correctAnswers = 0
        const questions = quizData.questions

        for (let i = 0; i < answers.length; i++) {
          if (questions[i] && answers[i] && questions[i].answer && answers[i].answer) {
            const answer = answers[i].answer.trim().toLowerCase()
            const correctAnswer = questions[i].answer.trim().toLowerCase()

            if (answer === correctAnswer) {
              correctAnswers++
            }
          }
        }

        return (correctAnswers / answers.length) * 100 // Return percentage
      }

      const score = calculateOpenEndedScore(finalAnswers)
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
      }

      // Always save to localStorage for persistence
      localStorage.setItem(`quiz_result_${quizData.id}`, JSON.stringify(result))
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
            quizId: quizData.id,
            slug,
            answers: finalAnswers.map((a) => ({
              answer: a.answer,
              timeSpent: a.timeSpent,
              hintsUsed: a.hintsUsed,
            })),
            totalTime: (Date.now() - startTime) / 1000,
            score,
            type: "blanks",
            totalQuestions: quizData.questions.length,
          })
          console.log("Database save result successful")
          hasSavedToDb.current = true
        } catch (dbError) {
          console.error("Error saving to database:", dbError)
          // Still show results even if DB save fails
        }
      } else {
        console.log("User is not logged in, saving to guest storage")
        // Save result for guest user
        saveGuestResult({
          ...result,
          redirectPath: `/dashboard/blanks/${slug}?completed=true`, // Add completed parameter
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

  // Modify the useEffect that checks for saved quiz state
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading") {
      setIsLoading(true)
      try {
        // Check if we have a completed quiz state in the URL query params
        const urlParams = new URLSearchParams(window.location.search)
        const hasCompletedParam = urlParams.get("completed") === "true"

        // Try to load answers from localStorage first
        const savedAnswers = loadAnswersFromLocalStorage()
        if (savedAnswers && savedAnswers.length > 0) {
          console.log("Found saved answers in localStorage:", savedAnswers)
          setAnswers(savedAnswers)

          // If we also have a completed param, show the results
          if (hasCompletedParam) {
            setIsCompleted(true)
          }

          setIsLoading(false)
          return
        }

        // Check for quiz result in localStorage
        const savedResultKey = `quiz_result_${quizData.id}`
        const savedResult = localStorage.getItem(savedResultKey)
        const parsedResult = savedResult ? JSON.parse(savedResult) : null

        console.log("URL params:", { hasCompletedParam })
        console.log("Saved result:", parsedResult)

        // If we have a completed param or saved results, show the results immediately
        if (hasCompletedParam || parsedResult) {
          console.log("Found completed quiz state or saved results", parsedResult)
          if (parsedResult && parsedResult.answers) {
            setAnswers(parsedResult.answers || [])
          }
          setIsCompleted(true)
          setIsLoading(false)
          return
        }

        // Check for saved quiz state on mount
        if (typeof window !== "undefined" && status !== "loading") {
          setIsLoading(true)
          try {
            // Check if user just signed out
            const wasSignedIn = sessionStorage.getItem("wasSignedIn") === "true"
            const isNowSignedOut = wasSignedIn && !isLoggedIn

            // If user just signed out, clear all quiz state
            if (isNowSignedOut) {
              clearQuizStateForId(quizData.id)
              sessionStorage.removeItem("wasSignedIn")
              setIsLoading(false)
              return
            }

            // Update signed in state
            sessionStorage.setItem("wasSignedIn", isLoggedIn ? "true" : "false")

            // First check for saved state in session storage
            const savedState = getSavedQuizState()

            // Check if there's a saved state for this quiz, restore it
            if (savedState) {
              const { quizState, answers: savedAnswers } = savedState

              // If there's a saved state for this quiz, restore it
              if (quizState && quizState.quizId === quizData.id && quizState.quizType === "blanks") {
                setCurrentQuestion(quizState.currentQuestion)
                setStartTime(quizState.startTime)
                setIsCompleted(quizState.isCompleted)

                if (savedAnswers) {
                  setAnswers(
                    savedAnswers as {
                      answer: string
                      timeSpent: number
                      hintsUsed: boolean
                      similarity?: number
                    }[],
                  )
                }

                // Clear saved state
                clearSavedQuizState()

                // If quiz was completed, show results
                if (quizState.isCompleted) {
                  setIsCompleted(true)
                }
              }
            }
          } catch (err) {
            console.error("Error loading saved quiz state:", err)
          } finally {
            setIsLoading(false)
          }
        }
      } catch (err) {
        console.error("Error loading saved quiz state:", err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [quizData?.id, status, loadAnswersFromLocalStorage, isLoggedIn])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0) {
        saveQuizState({
          quizId: quizData.id,
          quizType: "blanks",
          slug,
          timeSpent: [(Date.now() - startTime) / 1000],

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

  // Add this effect to save answers whenever they change
  useEffect(() => {
    if (answers.length > 0) {
      saveAnswersToLocalStorage(answers)
    }
  }, [answers, saveAnswersToLocalStorage])

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

    // Force a refresh to ensure all components are reset
    router.refresh()
  }, [router])

  const handleComplete = useCallback(
    (score: number) => {
      // Update quiz results
      setQuizResults({ score })

      // If user is logged in, update the score in the database
      if (isLoggedIn) {
        submitQuizResult({
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
        }).catch((err) => {
          console.error("Error updating quiz score:", err)
        })
      }
    },
    [answers, isLoggedIn, quizData.id, quizData.questions.length, slug, startTime],
  )

  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
    // Ensure isCompleted is set to true when feedback modal is closed
    setIsCompleted(true)
  }, [])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestionData = useMemo(() => {
    return quizData.questions?.[currentQuestion] || null
  }, [currentQuestion, quizData.questions])

  // Debug logging
  useEffect(() => {
    console.log("Quiz state:", {
      isCompleted,
      showFeedbackModal,
      quizResults,
      currentQuestion,
      totalQuestions: quizData?.questions?.length,
    })
  }, [isCompleted, showFeedbackModal, quizResults, currentQuestion, quizData?.questions?.length])

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
      redirectPath={`/quiz/blanks/${slug}`}
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
              clearGuestData={clearSavedQuizState}
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
          quizType="fill-blanks"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
