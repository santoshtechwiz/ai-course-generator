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
import { quizService } from "@/lib/QuizService"
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
  const [isRecoveringAnswers, setIsRecoveringAnswers] = useState(false)
  const [isResultLoading, setIsResultLoading] = useState(false)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { saveQuizState, saveGuestResult, setShowSignInPrompt } = useQuiz()

  // Refs
  const submissionInProgress = useRef(false)
  const hasSavedToDb = useRef(false)
  const hasInitialized = useRef(false)

  // Derived state
  const isLoggedIn = status === "authenticated"
  const quizId = quizData?.id || ""

  // Initialize quiz state
  useEffect(() => {
    if (status === "loading" || hasInitialized.current) return

    const initializeQuiz = async () => {
      setIsLoading(true)
      setIsRecoveringAnswers(true)
      hasInitialized.current = true

      try {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          setError("Quiz data could not be loaded. Please try again later.")
          return
        }

        const savedState = quizService.getQuizState(quizId, "blanks")
        if (savedState) {
          setCurrentQuestion(savedState.currentQuestion || 0)
          setStartTime(savedState.startTime || Date.now())
          setAnswers(savedState.answers || [])
          setIsCompleted(savedState.isCompleted || false)
        }
      } catch (err) {
        setError("Failed to initialize quiz. Please try again.")
      } finally {
        setIsLoading(false)
        setIsRecoveringAnswers(false)
      }
    }

    initializeQuiz()
  }, [quizId, status, quizData])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0 && quizId) {
        quizService.saveQuizState({
          quizId,
          quizType: "blanks",
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
          quizType: "blanks",
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

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed, similarity }
        return newAnswers
      })

      if (currentQuestion >= quizData.questions.length - 1) {
        completeQuiz([...answers, { answer, timeSpent, hintsUsed, similarity }])
      } else {
        setCurrentQuestion((prev) => prev + 1)
        setStartTime(Date.now())
      }
    },
    [currentQuestion, quizData.questions.length, completeQuiz, answers],
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
    quizService.clearQuizState(quizId, "blanks")
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
          console.log("Results already saved, skipping database update")
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
            type: "blanks",
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
        quizId,
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
      {isResultLoading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading results...</p>
        </div>
      ) : (
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
                quizId={quizId}
                title={quizData.title}
                slug={slug}
                clearGuestData={() => quizService.clearQuizState(quizId, "blanks")}
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
      )}
      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={!!error || !!saveError}
          score={quizResults?.score || 0}
          totalQuestions={100} // Use 100 for percentage display
          onContinue={handleFeedbackContinue}
          errorMessage={error || saveError || undefined}
          quizType="blanks"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
