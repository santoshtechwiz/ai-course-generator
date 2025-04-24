"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { QuizResultDisplay } from "../../components/QuizResultDisplay"
import { useQuizResult } from "@/hooks/useQuizResult"

interface McqQuizResultProps {
  quizId: number | string
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
  // Refs to track state without causing re-renders
  const hasSavedRef = useRef(false)
  const attemptedSaveRef = useRef(false)

  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSaved, setHasSaved] = useState(false)

  // Hooks
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Derived values
  const isLoggedIn = status === "authenticated"
  const totalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000))
  const quizIdString = String(quizId)
  const storageKey = `quiz_result_${quizIdString}_saved`

  // Check if already saved on mount
  useEffect(() => {
    const alreadySaved = localStorage.getItem(storageKey) === "true"
    if (alreadySaved) {
      setHasSaved(true)
      hasSavedRef.current = true
    }
  }, [storageKey])

  // Use the quiz result hook
  const {
    saveResult,
    isLoading: isSavingResult,
    error: saveError,
  } = useQuizResult({
    quizId: quizIdString,
    slug,
    answers,
    totalTime,
    score,
    quizType: "mcq",
    totalQuestions,
    startTime,
  })

  // Save results to database if user is logged in - only run once
  useEffect(() => {
    const saveResultsToDb = async () => {
      // Skip if already saved, already attempted, or not logged in
      if (hasSavedRef.current || attemptedSaveRef.current || !isLoggedIn || answers.length === 0) {
        return
      }

      // Mark that we've attempted to save
      attemptedSaveRef.current = true

      // Check if already saved in localStorage
      const alreadySaved = localStorage.getItem(storageKey) === "true"
      if (alreadySaved) {
        setHasSaved(true)
        hasSavedRef.current = true
        return
      }

      setIsSubmitting(true)

      try {
        // Use the hook to save results
        await saveResult()

        // Mark as saved
        setHasSaved(true)
        hasSavedRef.current = true

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

    // Only run this effect once
    if (!hasSavedRef.current && !attemptedSaveRef.current) {
      saveResultsToDb()
    }
  }, [isLoggedIn, saveResult, toast])

  // Update error state when saveError changes
  useEffect(() => {
    if (saveError) {
      setError(saveError)
    }
  }, [saveError])

  // Memoized handlers
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard/mcq")
  }, [router])

  const handleRestartClick = useCallback(() => {
    onRestart()
  }, [onRestart])

  const handleSignInClick = useCallback(() => {
    onSignIn()
  }, [onSignIn])

  // Render content based on authentication status
  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
          <Alert>
            <AlertTitle className="text-xl">Sign in to view your results</AlertTitle>
            <AlertDescription className="mt-4">
              <p className="mb-4">Your quiz has been completed! Sign in to view your results and save your progress.</p>
              <Button onClick={handleSignInClick} className="mr-2">
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
          quizId={quizIdString}
          title={title}
          score={score}
          totalQuestions={totalQuestions}
          totalTime={totalTime}
          correctAnswers={answers.filter((a) => a.isCorrect).length}
          type="mcq"
          slug={slug}
          answers={answers}
          onRestart={handleRestartClick}
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
