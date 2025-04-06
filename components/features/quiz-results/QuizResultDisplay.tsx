"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import type { QuizType } from "@/app/types/types"
import { formatTime } from "@/lib/utils"
import { motion } from "framer-motion"
import { BookOpen, Clock, HelpCircle, RotateCw, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sparkles } from "lucide-react"

interface QuizResultDisplayProps {
  quizId: string | number
  title: string
  score: number
  totalQuestions: number
  totalTime: number // in seconds
  correctAnswers: number
  type: QuizType
  slug: string
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  MASTERY: 90,
  PROFICIENT: 70,
  DEVELOPING: 50,
} as const

// Performance levels with associated styles and labels
const PERFORMANCE_LEVELS = [
  {
    threshold: PERFORMANCE_THRESHOLDS.MASTERY,
    colorClass: "text-green-500",
    badgeLabel: "Master",
    bgColorClass: "bg-green-500",
    message: "Mastery achieved! You're crushing it!",
  },
  {
    threshold: PERFORMANCE_THRESHOLDS.PROFICIENT,
    colorClass: "text-blue-500",
    badgeLabel: "Proficient",
    bgColorClass: "bg-blue-500",
    message: "Great job! You have a strong understanding.",
  },
  {
    threshold: PERFORMANCE_THRESHOLDS.DEVELOPING,
    colorClass: "text-yellow-500",
    badgeLabel: "Developing",
    bgColorClass: "bg-yellow-500",
    message: "Good effort! Review these areas to improve.",
  },
  {
    threshold: 0,
    colorClass: "text-red-500",
    badgeLabel: "Needs Practice",
    bgColorClass: "bg-red-500",
    message: "Keep learning! Let's strengthen these concepts.",
  },
] as const

const buildQuizUrl = (quizId: string | number, type: QuizType) => {
  const routes: Record<QuizType, string> = {
    mcq: `/dashboard/mcq/${quizId}`,
    "fill-blanks": `/dashboard/blanks/${quizId}`,
    openended: `/dashboard/open-ended/${quizId}`,
    code: `/dashboard/code/${quizId}`,
    flashcard: `/dashboard/flashcard/${quizId}`,
    default: `/dashboard/quiz/${quizId}`,
  }

  return routes[type] || routes.default
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
}: QuizResultDisplayProps) {
  const router = useRouter()
  const percentage = Math.round((score / totalQuestions) * 100)
  const questionsPerMinute = totalTime > 0 ? (totalQuestions / (totalTime / 60)) : 0
  const normalizedSpeed = Math.min(100, Math.round(questionsPerMinute * 10))

  // Calculate performance level based on thresholds
  const getPerformanceLevel = () => {
    return PERFORMANCE_LEVELS.find(level => percentage >= level.threshold) || PERFORMANCE_LEVELS[PERFORMANCE_LEVELS.length - 1]
  }

  const performance = getPerformanceLevel()

  // Format quiz type for display
  const formatQuizType = (quizType: QuizType) => {
    return quizType
      .replace(/-/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="w-full">
        <CardHeader className="text-center relative">
          {percentage >= PERFORMANCE_LEVELS[0].threshold && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-4 -right-4"
            >
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </motion.div>
          )}
          <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
          <div className="flex justify-center mt-2">
            <Badge variant="outline" className={`text-sm ${performance.colorClass}`}>
              {performance.badgeLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          {/* Main Score Display */}
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Percentage Circle */}
            <div className="flex flex-col items-center justify-center space-y-2 p-6 rounded-lg bg-muted/50">
              <div className="relative">
                <Progress
                  value={percentage}
                  className="h-32 w-32 rounded-full [&>div]:bg-transparent"
                  indicatorClassName={`${performance.bgColorClass} [&>div]:stroke-[8]`}
                />
                <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${performance.colorClass}`}>
                  {percentage}%
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">{performance.message}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-4">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-semibold">
                    {correctAnswers} / {totalQuestions} correct
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">{formatTime(totalTime)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <HelpCircle className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Quiz Type</p>
                  <p className="font-semibold">{formatQuizType(type)}</p>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy</span>
                  <span>{percentage}%</span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2"
                  indicatorClassName={performance.bgColorClass}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="h-2" indicatorClassName="bg-green-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Speed</span>
                  <span>{questionsPerMinute.toFixed(1)} q/min</span>
                </div>
                <Progress
                  value={normalizedSpeed}
                  className="h-2"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Improvement Suggestions */}
          {percentage < PERFORMANCE_THRESHOLDS.PROFICIENT && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Review Concepts</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a custom course to focus on areas needing improvement.
                    </p>
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      Create Course →
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Practice Variations</h4>
                    <p className="text-sm text-muted-foreground">
                      Try different question types on the same material.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="link" size="sm" className="px-0">
                        Fill-in-Blanks →
                      </Button>
                      <Button variant="link" size="sm" className="px-0">
                        Open-Ended →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Flashcards</h4>
                    <p className="text-sm text-muted-foreground">
                      Create flashcards for key concepts to reinforce learning.
                    </p>
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      Make Flashcards →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {percentage >= PERFORMANCE_THRESHOLDS.PROFICIENT && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Next Challenges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Advanced Topics</h4>
                    <p className="text-sm text-muted-foreground">
                      Ready to level up? Try more advanced material on this subject.
                    </p>
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      Explore Advanced →
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Teach Others</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a study guide to reinforce your knowledge and help others.
                    </p>
                    <Button variant="link" size="sm" className="mt-2 px-0">
                      Create Guide →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center px-6 pb-6">
          <Button
            onClick={() => router.push(`${buildQuizUrl(slug, type)}`)}
            className="w-full sm:w-auto"
            variant={percentage < PERFORMANCE_THRESHOLDS.PROFICIENT ? "default" : "outline"}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/dashboard/quizzes")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Back to Quizzes
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="w-full sm:w-auto"
          >
            Dashboard
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}