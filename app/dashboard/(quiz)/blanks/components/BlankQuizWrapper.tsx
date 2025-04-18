"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { getSavedQuizState, clearSavedQuizState, saveQuizState } from "@/hooks/quiz-session-storage"
import { QuizFeedback } from "../../components/QuizFeedback"
import { submitQuizResult } from "@/lib/quiz-result-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading") {
      setIsLoading(true)
      try {
        const savedState = getSavedQuizState()

        // Check if savedState is null before destructuring
        if (savedState) {
          const { quizState, answers: savedAnswers } = savedState

          // If there's a saved state for this quiz, restore it
          if (quizState && quizState.quizId === quizData.id && quizState.quizType === "blanks") {
            setCurrentQuestion(quizState.currentQuestion)
            setStartTime(quizState.startTime)
            setIsCompleted(quizState.isCompleted)

            if (savedAnswers) {
              setAnswers(
                savedAnswers as { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[],
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
  }, [quizData?.id, status])

  // Save quiz state when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0) {
        saveQuizState({
          quizId: quizData.id,
          quizType: "blanks",
          quizSlug: slug,
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

  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, hintsUsed: boolean) => {
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed }
        return newAnswers
      })

      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        completeQuiz([...answers, { answer, timeSpent, hintsUsed }])
      }
    },
    [answers, currentQuestion, quizData.questions.length],
  )

  const completeQuiz = useCallback(
    async (finalAnswers: typeof answers) => {
      setIsSubmitting(true)
      setError(null)

      try {
        // Calculate score based on similarity (this will be updated by BlankQuizResults)
        const score = 0 // Initial score, will be updated

        // If user is logged in, save to database
        if (isLoggedIn) {
          console.log("User is logged in, saving to database")
          await submitQuizResult({
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
          })
        } else {
          console.log("User is not logged in, not saving to database")
          // If user is not authenticated, show auth modal
          setShowAuthModal(true)
        }

        setQuizResults({ score })
        setIsSuccess(true)
        setIsCompleted(true)
        setShowFeedbackModal(true)
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
        setIsSuccess(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [isLoggedIn, quizData.id, quizData.questions.length, slug, startTime],
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
  }, [])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestionData = useMemo(() => {
    return quizData.questions?.[currentQuestion] || null
  }, [currentQuestion, quizData.questions])

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
          quizType="blanks"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
