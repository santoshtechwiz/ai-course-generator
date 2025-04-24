"use client"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { QuizFeedback } from "../../components/QuizFeedback"
import QuizActions from "../../components/QuizActions"
import { useQuizResult } from "@/hooks/useQuizResult"

interface McqQuizWrapperProps {
  quizData: any
  slug: string
  userId: string
}

export default function McqQuizWrapper({ quizData, slug, userId }: McqQuizWrapperProps) {
  // Refs to prevent unnecessary re-renders
  const initializedRef = useRef(false)
  const startTimeRef = useRef(Date.now())
  const processingAnswerRef = useRef(false)

  // Router
  const router = useRouter()

  // Local state to prevent excessive re-renders
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { data: session, status } = useSession()

  // Check authentication status once on mount
  useEffect(() => {
    setIsAuthenticated(status === "authenticated")
  }, [status])

  // Initialize state from quiz data and localStorage - only run once
  useEffect(() => {
    if (!quizData || initializedRef.current) return

    initializedRef.current = true
    startTimeRef.current = Date.now()

    // Initialize answers array
    const totalQuestions = quizData.questions?.length || 0
    const emptyAnswers = new Array(totalQuestions).fill(null)

    // Check if we have a saved state
    const storageKey = `mcq_quiz_${quizData.id}_state`
    const savedState = localStorage.getItem(storageKey)

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)

        // Only restore if it's the same quiz
        if (parsed.quizId === quizData.id) {
          setCurrentQuestionIndex(parsed.currentQuestionIndex || 0)
          setAnswers(parsed.answers || emptyAnswers)
          setIsCompleted(parsed.isCompleted || false)

          if (parsed.startTime) {
            startTimeRef.current = parsed.startTime
          }

          if (parsed.isCompleted) {
            setQuizScore(parsed.score || 0)
          }
        }
      } catch (e) {
        console.error("Error parsing saved quiz state:", e)
        setAnswers(emptyAnswers)
      }
    } else {
      setAnswers(emptyAnswers)
    }
  }, [quizData])

  // Save state to localStorage when it changes - debounced to prevent excessive writes
  useEffect(() => {
    if (!quizData) return

    const saveTimeout = setTimeout(() => {
      const stateToSave = {
        quizId: quizData.id,
        currentQuestionIndex,
        answers,
        isCompleted,
        startTime: startTimeRef.current,
        score: quizScore,
      }

      localStorage.setItem(`mcq_quiz_${quizData.id}_state`, JSON.stringify(stateToSave))
    }, 500) // Debounce for 500ms

    return () => clearTimeout(saveTimeout)
  }, [currentQuestionIndex, answers, isCompleted, quizScore, quizData])

  // Error handling
  if (!quizData) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            We couldn't load the quiz data. Please try again later.
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get the current question from the quiz data
  const question = quizData.questions?.[currentQuestionIndex]
  const totalQuestions = quizData.questions?.length || 0

  // Memoized handlers to prevent recreation on every render
  const _handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      // Prevent duplicate processing
      if (processingAnswerRef.current) return
      processingAnswerRef.current = true

      // Update answers array
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestionIndex] = {
          answer,
          timeSpent,
          isCorrect,
        }
        return newAnswers
      })

      // If this is the last question, show completion modal
      if (currentQuestionIndex === totalQuestions - 1) {
        // Calculate score based on the updated answers
        setTimeout(() => {
          const updatedAnswers = [...answers]
          updatedAnswers[currentQuestionIndex] = { answer, timeSpent, isCorrect }

          const correctAnswers = updatedAnswers.filter((a) => a && a.isCorrect).length
          const score = Math.round((correctAnswers / totalQuestions) * 100)

          setQuizScore(score)
          setShowFeedbackModal(true)
          processingAnswerRef.current = false
        }, 100)
      } else {
        // Move to next question
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1)
          processingAnswerRef.current = false
        }, 100)
      }
    },
    [currentQuestionIndex, totalQuestions, answers],
  )

  const handleAnswer = quizData ? _handleAnswer : () => {}

  const {
    saveResult,
    isLoading: isSavingResult,
    error: saveError,
  } = useQuizResult({
    quizId: quizData?.id?.toString() || "",
    slug,
    answers,
    totalTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
    score: quizScore,
    quizType: "mcq",
    totalQuestions,
    startTime: startTimeRef.current,
  })

  const _handleQuizComplete = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate score
      const correctAnswers = answers.filter((a) => a && a.isCorrect).length
      const score = Math.round((correctAnswers / totalQuestions) * 100)
      setQuizScore(score)

      // Save the result using the hook
      await saveResult()

      // If not authenticated, show sign-in prompt
      if (!isAuthenticated) {
        setShowSignInPrompt(true)
      }

      setIsCompleted(true)
      setShowFeedbackModal(false)
    } catch (err) {
      console.error("Error completing quiz:", err)
      setError(err instanceof Error ? err.message : "Failed to save quiz results")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuizComplete = useCallback(_handleQuizComplete, [
    answers,
    totalQuestions,
    isAuthenticated,
    saveResult,
    setQuizScore,
    setIsCompleted,
    setShowFeedbackModal,
    setShowSignInPrompt,
  ])

  const handleRestart = useCallback(() => {
    // Reset all state
    setCurrentQuestionIndex(0)
    setAnswers(new Array(totalQuestions).fill(null))
    setIsCompleted(false)
    setShowFeedbackModal(false)
    setQuizScore(0)
    setError(null)
    startTimeRef.current = Date.now()

    // Clear localStorage state
    localStorage.removeItem(`mcq_quiz_${quizData.id}_state`)
  }, [totalQuestions, quizData])

  const handleSignIn = useCallback(() => {
    // Save current state before redirecting
    const stateToSave = {
      quizId: quizData.id,
      currentQuestionIndex,
      answers,
      isCompleted,
      startTime: startTimeRef.current,
      score: quizScore,
    }

    localStorage.setItem(`mcq_quiz_${quizData.id}_state`, JSON.stringify(stateToSave))

    // Redirect to sign in page
    router.push(`/auth/signin?callbackUrl=/dashboard/mcq/${slug}?completed=true`)
  }, [router, slug, quizData, currentQuestionIndex, answers, isCompleted, quizScore])

  const handleFeedbackContinue = useCallback(() => {
    handleQuizComplete()
  }, [handleQuizComplete])

  return (
    <QuizAuthWrapper
      quizId={quizData.id.toString()}
      quizType="mcq"
      slug={slug}
      currentQuestion={currentQuestionIndex + 1} // Convert to 1-based for display
      totalQuestions={totalQuestions}
      isCompleted={isCompleted}
      answers={answers}
      redirectPath={`/dashboard/mcq/${slug}?completed=true`}
    >
      <div className="flex flex-col gap-4 p-4">
        <QuizActions
          quizId={quizData.id.toString()}
          quizSlug={quizData.slug}
          initialIsPublic={quizData.isPublic}
          initialIsFavorite={quizData.isFavorite}
          userId={userId}
          ownerId={quizData?.userId || ""}
          position="left-center"
        />

        {!isCompleted ? (
          <McqQuiz
            question={question}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1} // Convert to 1-based for display
            totalQuestions={totalQuestions}
          />
        ) : (
          <McqQuizResult
            quizId={quizData.id}
            slug={quizData.slug}
            title={quizData.title || "Multiple Choice Quiz"}
            answers={answers}
            totalQuestions={totalQuestions}
            startTime={startTimeRef.current}
            score={quizScore}
            onRestart={handleRestart}
            onSignIn={handleSignIn}
          />
        )}

        {showFeedbackModal && (
          <QuizFeedback
            isSubmitting={isSubmitting}
            isSuccess={!error}
            isError={!!error}
            score={quizScore}
            totalQuestions={totalQuestions}
            onContinue={handleFeedbackContinue}
            errorMessage={error || undefined}
            quizType="mcq"
          />
        )}

        {showSignInPrompt && !isAuthenticated && (
          <Alert className="mt-4">
            <AlertTitle>Sign in to save your progress</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Your quiz results have been saved temporarily. Sign in to permanently save your progress.
              </p>
              <Button onClick={handleSignIn} size="sm">
                Sign In
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </QuizAuthWrapper>
  )
}
