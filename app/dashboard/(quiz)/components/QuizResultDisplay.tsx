"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { QuizType } from "@/app/types/types"
import { buildQuizUrl, formatTime } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, HelpCircle, RotateCw, Trophy, Sparkles, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SimilarQuizzes } from "./similar-quizzes"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { useQuizResult } from "@/hooks/use-quiz-result"

interface QuestionTypeStats {
  multipleChoice: number
  fillInBlank: number
  openEnded: number
  total: number
}

// Add the preventAutoSave prop to the interface
interface QuizResultDisplayProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  type: QuizType
  slug: string
  questionTypes?: QuestionTypeStats
  clearGuestData?: () => void
  answers?: QuizAnswer[] // Add answers prop
  preventAutoSave?: boolean // Add flag to prevent auto-saving
}

// Define the QuizAnswer type
interface QuizAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
}

export function QuizResultDisplay({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  correctAnswers,
  type,
  slug,
  questionTypes,
  clearGuestData,
  preventAutoSave,
}: QuizResultDisplayProps) {
  const [progressValue, setProgressValue] = useState(0)
  const router = useRouter()
  const { submitQuizResult, isSubmitting } = useQuizResult({})
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  // Add this at the top of the component
  const savedResultRef = useRef(false)

  // Safely calculate percentage (0-100)
  const percentage = Math.min(100, Math.max(0, Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100)))

  // Calculate questions per minute with safeguards
  const questionsPerMinute = totalTime > 0 ? totalQuestions / (totalTime / 60) : 0
  const normalizedSpeed = Math.min(20, questionsPerMinute) // Cap at 20 q/min for display

  const performance =
    PERFORMANCE_LEVELS.find((level) => percentage >= level.threshold) ||
    PERFORMANCE_LEVELS[PERFORMANCE_LEVELS.length - 1]

  const isHighPerformer = percentage >= 70
  const needsImprovement = percentage < 70

  // Fix time formatting - ensure totalTime is a reasonable number
  const formattedTime = formatTime(Math.min(totalTime, 86400)) // Cap at 24 hours

  // Update the useEffect for saving results to respect the preventAutoSave flag
  // Save results to database for authenticated users
  useEffect(() => {
    const saveResultToDatabase = async () => {
      // Skip saving if preventAutoSave is true
      if (preventAutoSave) {
        console.log("Auto-save prevented by preventAutoSave flag")
        return
      }

      if (isAuthenticated && quizId && slug && !savedResultRef.current) {
        try {
          // Mark as saved before the API call to prevent duplicate saves
          savedResultRef.current = true

          const response = await fetch(`/api/quiz/${slug}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizId,
              score: percentage,
              totalQuestions,
              correctAnswers,
              totalTime,
              type,
              completedAt: new Date().toISOString(),
            }),
          })

          // Check if the response is ok before trying to parse JSON
          if (!response.ok) {
            console.error(`Failed to save quiz results: ${response.status} ${response.statusText}`)

            // Try to parse error details if available
            try {
              const errorData = await response.json()
              console.error("Error details:", errorData)
            } catch (jsonError) {
              console.error("Could not parse error response")
            }
          } else {
            try {
              const data = await response.json()
              console.log("Quiz results saved successfully:", data)
            } catch (jsonError) {
              console.warn("Response was successful but could not parse JSON response")
              console.log("Quiz results saved successfully")
            }
          }
        } catch (error) {
          console.error("Error saving quiz results:", error)
          // Reset the saved flag so we can try again
          savedResultRef.current = false
        }
      }
    }

    // Add a small delay to ensure we don't have race conditions
    const timer = setTimeout(() => {
      saveResultToDatabase()
    }, 300)

    return () => clearTimeout(timer)
  }, [isAuthenticated, quizId, slug, percentage, totalQuestions, correctAnswers, totalTime, type, preventAutoSave])

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

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(score)
    }, 500)
    return () => clearTimeout(timer)
  }, [score])

  const handleRetry = () => {
    router.refresh()
  }

  const handleBackToDashboard = () => {
    router.push(`/dashboard/${type}`)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Quiz Result: ${title}`,
          text: `I scored ${score.toFixed(0)}% on the ${title} quiz!`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

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
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Sign in to save your results</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to save your quiz results, track your progress, and access more features.
              </p>
              <SignInPrompt callbackUrl={`/dashboard/${type}/${slug}`} />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center px-6 pb-6">
            <motion.div whileHover={{ scale: 1.03 }}>
              <Link
                href={buildQuizUrl(slug, type)}
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

  // Regular authenticated user view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="w-full shadow-lg overflow-hidden">
        <CardHeader className="text-center relative">
          <AnimatePresence>
            {isHighPerformer && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className={`text-sm ${performance.color}`}>
                {performance.label}
              </Badge>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          {/* Main Score Display */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Percentage Circle */}
            <motion.div
              className="flex flex-col items-center justify-center space-y-2 p-6 rounded-lg bg-muted/50"
              whileHover={{ scale: 1.02 }}
            >
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
              <motion.p
                className="text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {performance.message}
              </motion.p>
            </motion.div>

            {/* Stats */}
            <div className="flex flex-col justify-center space-y-4">
              <StatItem
                icon={<Trophy className="h-6 w-6 text-yellow-500" />}
                label="Score"
                value={`${correctAnswers} / ${totalQuestions} correct`}
              />
              <StatItem icon={<Clock className="h-6 w-6 text-blue-500" />} label="Time" value={formattedTime} />
              <StatItem
                icon={<HelpCircle className="h-6 w-6 text-purple-500" />}
                label="Quiz Type"
                value={formatQuizType(type)}
              />
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <ProgressBar label="Accuracy" value={percentage} maxValue={100} indicatorColor={performance.bgColor} />
              <ProgressBar label="Completion" value={100} maxValue={100} indicatorColor="bg-green-500" />
              <ProgressBar
                label="Speed"
                value={normalizedSpeed}
                maxValue={20}
                indicatorColor="bg-blue-500"
                displayValue={`${questionsPerMinute.toFixed(1)} q/min`}
              />
            </div>
          </motion.div>

          {/* Question Type Breakdown */}
          {questionTypes && <QuestionTypeBreakdown questionTypes={questionTypes} />}

          <Separator />

          {/* Improvement Suggestions */}
          <AnimatePresence>{needsImprovement && <ImprovementSection percentage={percentage} />}</AnimatePresence>

          {/* Similar Quizzes - Only shown for high performers */}
          <AnimatePresence>
            {isHighPerformer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Continue Your Learning Journey
                </h3>
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Great job! Challenge yourself with more quizzes to keep improving.
                    </p>
                    <SimilarQuizzes />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center px-6 pb-6">
          <motion.div whileHover={{ scale: 1.03 }}>
            <Link
              href={buildQuizUrl(slug, type)}
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full sm:w-auto ${needsImprovement ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"}`}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              {needsImprovement ? "Try Again" : "Challenge Yourself Again"}
            </Link>
          </motion.div>

          {isHighPerformer && (
            <motion.div whileHover={{ scale: 1.03 }}>
              <Link
                href="/dashboard/quizzes/advanced"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Try Advanced Quiz
              </Link>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.03 }}>
            <Link
              href="/dashboard/quizzes"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto"
            >
              Back to Quizzes
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto"
            >
              Dashboard
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Helper Components

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <motion.div
      className="flex items-center space-x-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring" }}
    >
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </motion.div>
  )
}

function ProgressBar({
  label,
  value,
  maxValue,
  indicatorColor,
  displayValue,
}: {
  label: string
  value: number
  maxValue: number
  indicatorColor: string
  displayValue?: string
}) {
  const progressValue = Math.min(100, (value / maxValue) * 100)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{displayValue || `${Math.round(progressValue)}%`}</span>
      </div>
      <Progress value={progressValue} className="h-2" indicatorClassName={indicatorColor} />
    </motion.div>
  )
}

function ImprovementSection({
  percentage,
}: {
  percentage: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center">
        <BookOpen className="h-5 w-5 mr-2 text-orange-500" />
        Ways to Improve
      </h3>
      <motion.div className="grid gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Focus Areas</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {percentage < 50 && <li>Review fundamental concepts in this subject area</li>}
              <li>Practice similar questions to build consistency</li>
              <li>Take your time to read questions carefully</li>
            </ul>
          </CardContent>
        </Card>

        {percentage < 50 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                  Turn Knowledge into Teaching
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Sometimes the best way to learn is to teach! Creating a course can help solidify your understanding.
                </p>
                <Link
                  href="/dashboard/course"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Create a course on this topic
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

function QuestionTypeBreakdown({ questionTypes }: { questionTypes?: QuestionTypeStats }) {
  if (!questionTypes) return null

  return (
    <motion.div
      className="mt-4 p-4 rounded-lg bg-muted/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <h4 className="text-sm font-medium mb-3">Question Type Breakdown</h4>
      <div className="space-y-2">
        {questionTypes.multipleChoice > 0 && (
          <ProgressBar
            label="Multiple Choice"
            value={questionTypes.multipleChoice}
            maxValue={questionTypes.total}
            indicatorColor="bg-purple-500"
            displayValue={`${questionTypes.multipleChoice}/${questionTypes.total}`}
          />
        )}
        {questionTypes.fillInBlank > 0 && (
          <ProgressBar
            label="Fill in the Blank"
            value={questionTypes.fillInBlank}
            maxValue={questionTypes.total}
            indicatorColor="bg-teal-500"
            displayValue={`${questionTypes.fillInBlank}/${questionTypes.total}`}
          />
        )}
        {questionTypes.openEnded > 0 && (
          <ProgressBar
            label="Open Ended"
            value={questionTypes.openEnded}
            maxValue={questionTypes.total}
            indicatorColor="bg-amber-500"
            displayValue={`${questionTypes.openEnded}/${questionTypes.total}`}
          />
        )}
      </div>
    </motion.div>
  )
}

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

function formatQuizType(quizType: QuizType): string {
  return quizType
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
