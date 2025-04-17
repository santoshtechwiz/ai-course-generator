"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { Separator } from "@/components/ui/separator"
import { formatTime } from "@/lib/utils"
import { motion } from "framer-motion"
import { User } from "lucide-react"

import type { QuizType } from "@/app/types/types"
import QuizAuthWrapper from "./QuizAuthWrapper"

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
}: QuizResultBaseProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Clear guest data after showing results if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && clearGuestData) {
      // Set a timeout to clear data after the user has had time to view results
      const timer = setTimeout(() => {
        clearGuestData()
      }, 300000) // Clear after 5 minutes

      return () => clearTimeout(timer)
    }
  }, [status, clearGuestData])

  // If user is not authenticated, show sign-in prompt with results summary
  if (status === "unauthenticated") {
    const percentage = Math.round(score)
    const performance = getPerformanceLevel(percentage)
    const formattedTime = formatTime(totalTime)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="w-full shadow-lg overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
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
                  You scored {Math.round((percentage / 100) * totalQuestions)} out of {totalQuestions} questions
                </p>
                <p className="text-sm text-muted-foreground">Completed in {formattedTime}</p>
              </div>
            </div>

            <Separator />

            {/* Sign In Prompt */}
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Sign in to save your results</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to save your quiz results, track your progress, and access more features.
              </p>
              <SignInPrompt callbackUrl={`/dashboard/${quizType}/${slug}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // For authenticated users, render the children
  return <QuizAuthWrapper>{children}</QuizAuthWrapper>
}

export function getPerformanceLevel(score: number) {
  const levels = [
    {
      threshold: 90,
      color: "text-green-500",
      bgColor: "bg-green-500",
      label: "Master",
      message: "Mastery achieved! You're crushing it!",
    },
    {
      threshold: 70,
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      label: "Proficient",
      message: "Great job! You have a strong understanding.",
    },
    {
      threshold: 50,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      label: "Developing",
      message: "Good effort! Review these areas to improve.",
    },
    {
      threshold: 0,
      color: "text-red-500",
      bgColor: "bg-red-500",
      label: "Needs Practice",
      message: "Keep learning! Let's strengthen these concepts.",
    },
  ]

  return levels.find((level) => score >= level.threshold) || levels[levels.length - 1]
}
