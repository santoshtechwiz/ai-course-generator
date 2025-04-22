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
}

export default function McqQuizResult({
  quizId,
  slug,
  title,
  answers,
  totalQuestions,
  startTime,
  score,
  onRestart,
  onSignIn,
}: McqQuizResultProps) {
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSavedToDb, setHasSavedToDb] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSaved, setHasSaved] = useState(false)

  // Refs
  const hasSavedRef = useRef(false)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Derived state
  const isLoggedIn = status === "authenticated"

  // Update the component to correctly display the score and answers
  // Add this near the top of the component
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
      }
    } else {
      console.warn("McqQuizResult received empty or invalid answers array")
    }
  }, [answers, score])

  // Save results to database if user is logged in
  useEffect(() => {
    const saveResultsToDb = async () => {
      // Skip if we've already attempted to save or if we're not logged in
      if (saveAttempted || !isLoggedIn || hasSavedRef.current) return

      // Mark that we've attempted to save to prevent multiple attempts
      setSaveAttempted(true)
      setIsSubmitting(true)
      setSaveError(null)

      try {
        // Check if we're on a completed page (URL has completed=true)
        const isCompletedPage = typeof window !== "undefined" && window.location.search.includes("completed=true")
        console.log("Saving results to database, isCompletedPage:", isCompletedPage)

        // If we're on a completed page, we might need to get the answers from localStorage
        let answersToSubmit = answers
        if (isCompletedPage && (!answers || answers.length === 0)) {
          // Try to get answers from localStorage
          const savedResult = localStorage.getItem(`quiz_result_${quizId}`)
          if (savedResult) {
            const parsedResult = JSON.parse(savedResult)
            if (parsedResult.answers && parsedResult.answers.length > 0) {
              answersToSubmit = parsedResult.answers
              console.log("Using answers from saved result:", answersToSubmit)
            }
          }
        }

        // Check if we've already saved this result
        const alreadySaved = localStorage.getItem(`quiz_result_${quizId}_saved`) === "true"
        if (alreadySaved) {
          console.log("Results already saved, skipping submission")
          setHasSaved(true)
          hasSavedRef.current = true
          return
        }

        // Submit the result
        await submitQuizResult({
          quizId,
          slug,
          answers: answersToSubmit.map((a) => ({
            answer: a.answer,
            timeSpent: a.timeSpent,
            isCorrect: a.isCorrect,
          })),
          totalTime: (Date.now() - startTime) / 1000,
          score,
          type: "mcq",
          totalQuestions,
        })

        // Mark as saved
        setHasSaved(true)
        hasSavedRef.current = true
        localStorage.setItem(`quiz_result_${quizId}_saved`, "true")

        toast({
          title: "Results saved",
          description: "Your quiz results have been saved successfully.",
        })
      } catch (err) {
        console.error("Error saving to database:", err)
        setError(err instanceof Error ? err.message : "Failed to save results to database")
      } finally {
        setIsSubmitting(false)
      }
    }

    // Only run this effect once when the component mounts
    saveResultsToDb()
  }, [isLoggedIn, quizId, slug, answers, startTime, score, totalQuestions, toast, hasSavedRef, saveAttempted])

  // Handle navigation to dashboard
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard/mcq")
  }, [router])

  // Render content based on authentication status
  const renderContent = () => {
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

    return (
      <>
        <QuizResultDisplay
          quizId={String(quizId)}
          title={title}
          score={score}
          totalQuestions={totalQuestions}
          totalTime={(Date.now() - startTime) / 1000}
          correctAnswers={answers.filter((a) => a.isCorrect).length}
          type="mcq"
          slug={slug}
          answers={answers}
          onRestart={onRestart}
          showAuthModal={false}
        />

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error saving results</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
