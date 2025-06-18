"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, RefreshCw, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface QuizResultContainerProps {
  children: React.ReactNode
  title: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
  onRetake?: () => void
  slug?: string
  quizType?: string
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export function QuizResultContainer({
  children,
  title,
  score,
  totalQuestions,
  percentage,
  completedAt,
  onRetake,
  slug,
  quizType = "quiz",
  showHeader = true,
  showFooter = true,
  className,
}: QuizResultContainerProps) {
  const router = useRouter()
  
  const getPerformanceInfo = () => {
    if (percentage >= 90) {
      return {
        label: "Excellent",
        message: "Outstanding work!",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        emoji: "🏆",
      }
    } else if (percentage >= 80) {
      return {
        label: "Very Good",
        message: "Great job!",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        emoji: "🎯",
      }
    } else if (percentage >= 70) {
      return {
        label: "Good",
        message: "Well done!",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        emoji: "👍",
      }
    } else if (percentage >= 60) {
      return {
        label: "Fair",
        message: "You're getting there.",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        emoji: "👌",
      }
    } else {
      return {
        label: "Needs Improvement",
        message: "Keep practicing!",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        emoji: "📚",
      }
    }
  }
  
  const formattedDate = new Date(completedAt).toLocaleDateString()
  const performance = getPerformanceInfo()
  
  const handleRetake = () => {
    if (onRetake) {
      onRetake()
    } else if (slug && quizType) {
      router.push(`/dashboard/${quizType}/${slug}`)
    }
  }
  
  const handleBrowseQuizzes = () => {
    router.push("/dashboard/quizzes")
  }

  return (
    <motion.div
      className={cn("max-w-4xl mx-auto", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="shadow-xl border-muted rounded-2xl overflow-hidden">
        {showHeader && (
          <>
            <CardHeader className="bg-muted/50 pb-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-center sm:text-left">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 leading-tight break-words">
                    {title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {completedAt
                      ? `Completed on ${new Date(completedAt).toLocaleDateString()} at ${new Date(
                          completedAt
                        ).toLocaleTimeString()}`
                      : "Quiz results"}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{percentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {score}/{totalQuestions} questions
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="w-full h-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20" />
          </>
        )}

        <CardContent className={cn("p-0", 
          showHeader ? "pt-0" : "", 
          "overflow-auto max-h-[70vh] sm:max-h-[none]"
        )}>
          <div className="space-y-1 px-4 py-6 sm:px-6">{children}</div>
        </CardContent>
        
        {showFooter && (
          <>
            <div className="w-full h-px bg-muted" />
            <CardFooter className="bg-muted/30 p-4 sm:p-6 flex flex-wrap gap-4 justify-between">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleRetake} variant="default" className="gap-2 font-medium">
                  <RefreshCw className="h-4 w-4" />
                  Retake Quiz
                </Button>
                <Button onClick={handleBrowseQuizzes} variant="outline" className="gap-2 font-medium">
                  <Home className="h-4 w-4" />
                  Browse Quizzes
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </motion.div>
  )
}
