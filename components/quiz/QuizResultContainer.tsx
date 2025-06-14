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
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-xl border-muted rounded-2xl overflow-hidden">
        {showHeader && (
          <>
            <CardHeader className="bg-muted/50 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Trophy className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {quizType.charAt(0).toUpperCase() + quizType.slice(1)} Quiz
                    </Badge>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Quiz Results
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed on {formattedDate}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {percentage}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {score} of {totalQuestions} correct
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{performance.label}</span>
                  <span className="text-sm text-muted-foreground">{score}/{totalQuestions}</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className="h-2" 
                  />
                </div>
                <p className={cn("text-sm mt-2", performance.color)}>
                  {performance.emoji} {performance.message}
                </p>
              </div>
            </CardHeader>
            <div className="w-full h-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20" />
          </>
        )}

        <CardContent className="p-6 space-y-6">
          {children}
        </CardContent>
        
        {showFooter && (
          <CardFooter className="flex justify-between items-center p-6 bg-muted/30 border-t">
            <Button variant="outline" onClick={handleBrowseQuizzes} className="gap-2">
              <Home className="w-4 h-4" />
              Browse Quizzes
            </Button>
            <Button onClick={handleRetake} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
