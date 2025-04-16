"use client"

import type React from "react"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { User, RotateCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { formatTime } from "@/lib/utils"

interface QuizResultBaseProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  slug: string
  quizType: string
  clearGuestData?: () => void
  children?: React.ReactNode
}

export function QuizResultBase({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  slug,
  quizType,
  clearGuestData,
  children,
}: QuizResultBaseProps) {
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  // Get performance level based on score
  const performance = getPerformanceLevel(score)

  // Clear guest data after showing results
  useEffect(() => {
    if (!isAuthenticated && clearGuestData) {
      // Set a timeout to clear data after the user has had time to view results
      const timer = setTimeout(() => {
        clearGuestData()
      }, 300000) // Clear after 5 minutes

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, clearGuestData])

  // If user is not authenticated, show sign-in prompt with results summary
  if (!isAuthenticated) {
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
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className={`text-sm ${performance.color}`}>
                {performance.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6">
            {/* Score Summary */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Progress
                  value={score}
                  className="h-32 w-32 rounded-full [&>div]:bg-transparent"
                  indicatorClassName={`${performance.bgColor} [&>div]:stroke-[8]`}
                />
                <motion.div
                  className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${performance.color}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {score.toFixed(1)}%
                </motion.div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">You completed {totalQuestions} questions</p>
                <p className="text-sm text-muted-foreground">Completed in {formatTime(totalTime)}</p>
              </div>
            </div>

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

          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center px-6 pb-6">
            <motion.div whileHover={{ scale: 1.03 }}>
              <Link
                href={`/${quizType}/${slug}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }}>
              <Link
                href="/dashboard/quizzes"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto"
              >
                Browse More Quizzes
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // For authenticated users, render the children (specific quiz result content)
  return <>{children}</>
}

// Helper function to determine performance level based on score
export function getPerformanceLevel(score: number) {
  const PERFORMANCE_LEVELS = [
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
  ] as const

  return (
    PERFORMANCE_LEVELS.find((level) => score >= level.threshold) || PERFORMANCE_LEVELS[PERFORMANCE_LEVELS.length - 1]
  )
}
