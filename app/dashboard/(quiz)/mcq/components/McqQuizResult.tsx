"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { submitQuizResult } from "@/lib/quiz-result-service"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import {
  searchAllStorageForAnswers,
  saveQuizResult,
  loadQuizResult,
  loadQuizAnswers,
} from "@/hooks/quiz-session-storage"

interface McqQuizResultProps {
  quizId: number
  slug: string
  title: string
  answers: { answer: string; timeSpent: number; isCorrect: boolean }[]
  totalQuestions: number
  startTime: number
  score: number
  onRestart: () => void
  onSignIn: () => void
  questions?: { id: number; question: string; options: string[]; answer: string }[]
}

export default function McqQuizResult({
  quizId,
  slug,
  title,
  answers: initialAnswersProp,
  totalQuestions,
  startTime,
  score: initialScore,
  onRestart,
  onSignIn,
  questions = [],
}: McqQuizResultProps) {
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSavedToDb, setHasSavedToDb] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSaved, setHasSaved] = useState(false)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; isCorrect: boolean }[]>(
    initialAnswersProp || [],
  )
  const [score, setScore] = useState(initialScore || 0)
  const [isRecovering, setIsRecovering] = useState(false)

  // Refs
  const hasSavedRef = useRef(false)
  const saveAttemptsRef = useRef(0)
  const lastSaveAttemptRef = useRef(0)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Derived state
  const isLoggedIn = status === "authenticated"

  // Debug logging
  useEffect(() => {
    console.log("McqQuizResult mounted with props:", {
      quizId,
      slug,
      title,
      initialAnswersLength: initialAnswersProp?.length,
      totalQuestions,
      startTime,
      initialScore,
      isLoggedIn,
      questionsLength: questions?.length,
    })
  }, [quizId, slug, title, initialAnswersProp, totalQuestions, startTime, initialScore, isLoggedIn, questions])

  // Try to recover answers if they're missing
  useEffect(() => {
    const recoverAnswers = async () => {
      if ((!initialAnswersProp || initialAnswersProp.length === 0) && !isRecovering) {
        console.log("Attempting to recover answers for quiz:", quizId)
        setIsRecovering(true)

        try {
          // Try to find answers in storage using the utility function
          const recoveredAnswers = await searchAllStorageForAnswers(String(quizId))

          if (recoveredAnswers && Array.isArray(recoveredAnswers) && recoveredAnswers.length > 0) {
            console.log("Recovered answers:", recoveredAnswers)
            setAnswers(recoveredAnswers)

            // Recalculate score if needed
            if (initialScore === 0 || initialScore === undefined) {
              const correctCount = recoveredAnswers.filter((a) => a && a.isCorrect).length
              const calculatedScore = Math.round((correctCount / recoveredAnswers.length) * 100)
              console.log("Recalculated score:", calculatedScore)
              setScore(calculatedScore)
            }
          } else {
            // Try to load answers using the loadQuizAnswers utility
            const loadedAnswers = loadQuizAnswers(String(quizId))
            if (loadedAnswers && Array.isArray(loadedAnswers) && loadedAnswers.length > 0) {
              console.log("Loaded answers from storage:", loadedAnswers)
              setAnswers(loadedAnswers)

              // Recalculate score if needed
              if (initialScore === 0 || initialScore === undefined) {
                const correctCount = loadedAnswers.filter((a) => a && a.isCorrect).length
                const calculatedScore = Math.round((correctCount / loadedAnswers.length) * 100)
                console.log("Recalculated score:", calculatedScore)
                setScore(calculatedScore)
              }
            } else {
              console.warn("No answers could be recovered")
            }
          }
        } catch (err) {
          console.error("Error recovering answers:", err)
        } finally {
          setIsRecovering(false)
        }
      }
    }

    recoverAnswers()
  }, [initialAnswersProp, quizId, initialScore])

  // Update the component to correctly display the score and answers
  useEffect(() => {
    // Validate the answers array
    if (answers && answers.length > 0) {
      console.log("McqQuizResult received answers:", answers)

      // Count correct answers
      const correctCount = answers.filter((a) => a && a.isCorrect).length
      console.log(`Correct answers: ${correctCount}/${answers.length}`)

      // Verify the score matches the correct answer count
      const calculatedScore = Math.round((correctCount / answers.length) * 100)
      if (calculatedScore !== score) {
        console.warn(`Score mismatch: Provided ${score}%, calculated ${calculatedScore}%`)
        setScore(calculatedScore)
      }
    } else {
      console.warn("McqQuizResult received empty or invalid answers array")
    }
  }, [answers, score])

  // Save results to database if user is logged in
  useEffect(() => {
    const saveResultsToDb = async () => {
      // Skip if we've already attempted to save too many times
      if (saveAttemptsRef.current >= 5) {
        console.log("Maximum save attempts reached, skipping")
        return
      }

      // Throttle save attempts to prevent infinite loops
      const now = Date.now()
      if (now - lastSaveAttemptRef.current < 5000) {
        // 5 second throttle
        console.log("Throttling save attempt")
        return
      }
      lastSaveAttemptRef.current = now

      // Skip if we've already saved or if we're not logged in
      if (saveAttempted || !isLoggedIn || hasSavedRef.current) return

      // Check if we've already saved this result using the utility function
      const quizResult = loadQuizResult(String(quizId))
      const alreadySaved = quizResult && quizResult.saved === true

      if (alreadySaved) {
        console.log("Results already saved, skipping submission")
        setHasSaved(true)
        hasSavedRef.current = true
        return
      }

      // Mark that we've attempted to save to prevent multiple attempts
      setSaveAttempted(true)
      setIsSubmitting(true)
      setSaveError(null)
      saveAttemptsRef.current += 1

      try {
        // Check if we're on a completed page (URL has completed=true)
        const isCompletedPage = typeof window !== "undefined" && window.location.search.includes("completed=true")
        console.log("Saving results to database, isCompletedPage:", isCompletedPage)

        // If we don't have valid answers, don't try to save
        if (!answers || answers.length === 0) {
          console.warn("No answers to save, skipping submission")
          setIsSubmitting(false)
          return
        }

        // Submit the result
        await submitQuizResult({
          quizId,
          slug,
          answers: answers.map((a) => ({
            answer: a.answer,
            timeSpent: a.timeSpent,
            isCorrect: a.isCorrect,
          })),
          totalTime: (Date.now() - startTime) / 1000,
          score,
          type: "mcq",
          totalQuestions,
        })

        // Mark as saved using the utility function
        setHasSaved(true)
        hasSavedRef.current = true

        // Save the result with a saved flag
        saveQuizResult(String(quizId), {
          answers,
          score,
          totalTime: (Date.now() - startTime) / 1000,
          saved: true,
          timestamp: Date.now(),
        })

        // Only show toast for the first save attempt
        if (saveAttemptsRef.current <= 2) {
          toast({
            title: "Results saved",
            description: "Your quiz results have been saved successfully.",
          })
        }
      } catch (err) {
        console.error("Error saving to database:", err)
        setSaveError(err instanceof Error ? err.message : "Failed to save results to database")
      } finally {
        setIsSubmitting(false)
      }
    }

    // Only run this effect once when the component mounts
    if (isLoggedIn && !hasSavedRef.current) {
      saveResultsToDb()
    }
  }, [isLoggedIn, quizId, slug, answers, startTime, score, totalQuestions, toast])

  // Handle navigation to dashboard
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard/mcq")
  }, [router])

  // Render content based on authentication status
  const renderContent = () => {
    // Show loading state while recovering answers
    if (isRecovering) {
      return (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p>Recovering your quiz results...</p>
          </div>
        </div>
      )
    }

    if (!isLoggedIn) {
      return (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
          <Alert>
            <AlertTitle className="text-xl">Sign in to view your results</AlertTitle>
            <AlertDescription className="mt-4">
              <p className="mb-4">Your quiz has been completed! Sign in to view your results and save your progress.</p>
              <Button onClick={onSignIn} className="mr-2">
                Sign In
              </Button>
              <Button variant="outline" onClick={handleGoToDashboard}>
                Return to Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Safety check for answers array
    const safeAnswers = answers || []
    const safeTotalQuestions = totalQuestions || safeAnswers.length || 1

    return (
      <>
        <QuizResultDisplay
          quizId={String(quizId)}
          title={title || "Quiz"}
          score={score || 0}
          totalQuestions={safeTotalQuestions}
          totalTime={(Date.now() - startTime) / 1000}
          correctAnswers={safeAnswers.filter((a) => a && a.isCorrect).length}
          type="mcq"
          slug={slug}
          answers={safeAnswers}
          onRestart={onRestart}
          showAuthModal={false}
        />

        {saveError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error saving results</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="mt-4 text-center">
            <p className="text-muted-foreground">Saving your results...</p>
          </div>
        )}
      </>
    )
  }

  // Always return a motion.div wrapper to ensure consistent hook execution
  return (
    <motion.div
      key={isLoggedIn ? "results" : "auth-prompt"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {renderContent()}
    </motion.div>
  )
}
