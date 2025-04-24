"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import { motion } from "framer-motion"

import QuizAuthWrapper from "./QuizAuthWrapper"
import type { QuizType } from "@/app/types/quiz-types"
import { GuestSignInPrompt } from "./GuestSignInPrompt"
import { Loader2 } from "lucide-react"
import { useQuiz } from "@/app/context/QuizContext"
import { formatTime } from "@/lib/utils"
import { getPerformanceLevel } from "@/utils/quiz-utils"

interface QuizResultBaseProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  slug: string
  quizType: QuizType
  children: React.ReactNode
  clearGuestData?: () => void
  isSaving?: boolean
  correctAnswers?: number
  showAuthModal?: boolean
  onRestart?: () => void
  isLoading?: boolean
}

export function QuizResultBase({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  slug,
  quizType,
  children,
  clearGuestData,
  isSaving = false,
  correctAnswers = 0,
  showAuthModal = true,
  onRestart,
  isLoading = false,
}: QuizResultBaseProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { saveGuestResult, setShowSignInPrompt } = useQuiz()

  // Clear guest data after showing results if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && clearGuestData && showAuthModal) {
      // Save result for guest user if not already saved
      saveGuestResult({
        quizId,
        quizType,
        slug,
        score,
        answers: [],
        totalTime,
        timestamp: Date.now(),
      })

      // Show sign-in prompt
      setShowSignInPrompt(true)

      // Set a timeout to clear data after the user has had time to view results
      const timer = setTimeout(() => {
        // Only clear if we're still on the results page
        if (document.visibilityState === "visible") {
          clearGuestData()
        }
      }, 300000) // Clear after 5 minutes

      return () => clearTimeout(timer)
    }
  }, [
    status,
    clearGuestData,
    saveGuestResult,
    setShowSignInPrompt,
    quizId,
    quizType,
    slug,
    score,
    totalTime,
    showAuthModal,
  ])

  // Cleanup function to run when component unmounts
  useEffect(() => {
    return () => {
      // If clearGuestData is provided, call it when component unmounts
      // but only if we're not in the middle of an auth flow
      if (clearGuestData && !localStorage.getItem("preserveGuestResults")) {
        clearGuestData()
      }
    }
  }, [clearGuestData])

  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz results...</p>
      </div>
    )
  }

  // If user is not authenticated, show sign-in prompt with results summary
  if (status === "unauthenticated" && showAuthModal) {
    const percentage = Math.round(score)
    const performance = getPerformanceLevel(score)
    const formattedTime = formatTime(totalTime)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="w-full shadow-lg overflow-hidden">
          <CardContent className="space-y-6 px-6 py-8">
            {/* Score Summary */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Progress
                  value={percentage}
                  className="h-32 w-32 rounded-full [&>div]:bg-transparent"
                  indicatorClassName={`${performance.bgColor} [&>div]:stroke-[8]`}
                />
                <motion.div
                  className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${performance.color}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {percentage}%
                </motion.div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  You scored {correctAnswers} out of {totalQuestions} questions
                </p>
                <p className="text-sm text-muted-foreground">Completed in {formattedTime}</p>
              </div>
            </div>

            <Separator />

            {/* Sign In Prompt */}
            <GuestSignInPrompt
              callbackUrl={`/dashboard/${quizType}/${slug}`}
              quizType={quizType}
              quizId={slug}
              score={percentage}
              onSkip={() => router.push("/dashboard")}
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // For authenticated users, render the children
  return (
    <QuizAuthWrapper quizId={quizId} quizType={quizType} slug={slug}>
      {children}
    </QuizAuthWrapper>
  )
}
