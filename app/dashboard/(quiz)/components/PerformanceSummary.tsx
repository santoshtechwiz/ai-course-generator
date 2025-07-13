"use client"
import { motion } from "framer-motion"
import { Target, Clock, Share2, RotateCcw, Home, CheckCircle2, XCircle, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic"

// Dynamically import Confetti to avoid SSR issues
const Confetti = dynamic(() => import("react-confetti"), { ssr: false })

interface PerformanceSummaryProps {
  title: string
  performance: {
    level: string
    color: string
    emoji: string
    bgColor?: string
  }
  percentage: number
  stats: {
    correct: number
    incorrect: number
    total: number
    totalTime: number
    avgTime: number
    accuracy: number
  }
  result: any
  formatDate: (date: string) => string
  onRetry: () => void
  onGoHome: () => void
  onShare: () => void
}

export function PerformanceSummary({
  title,
  performance,
  percentage,
  stats,
  result,
  formatDate,
  onRetry,
  onGoHome,
  onShare,
}: PerformanceSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMotivationalMessage = () => {
    if (percentage >= 90) return "Outstanding performance! You've mastered this topic! 🌟"
    if (percentage >= 80) return "Excellent work! You're doing great! 🎉"
    if (percentage >= 70) return "Good job! Keep up the momentum! 👍"
    if (percentage >= 60) return "Nice effort! A bit more practice will help! 📚"
    return "Don't give up! Every expert was once a beginner! 💪"
  }

  const getPerformanceColor = () => {
    if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400"
    if (percentage >= 80) return "text-blue-600 dark:text-blue-400"
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400"
    if (percentage >= 60) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getPerformanceBg = () => {
    if (percentage >= 90) return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
    if (percentage >= 80) return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
    if (percentage >= 70) return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
    if (percentage >= 60) return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
    return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
  }

  // Show confetti for high scores
  const showConfetti = percentage >= 90

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 1920}
            height={typeof window !== "undefined" ? window.innerHeight : 1080}
            numberOfPieces={250}
            recycle={false}
          />
        </div>
      )}
      <Card className={`relative overflow-hidden border-2 ${getPerformanceBg()}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 dark:to-white/5" />

        <CardHeader className="relative z-10 text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-6xl mb-3"
          >
            {performance.emoji}
          </motion.div>

          <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-foreground">{title}</CardTitle>

          <Badge
            variant="secondary"
            className={`text-lg px-4 py-2 font-semibold ${getPerformanceColor()} bg-background/80 border`}
          >
            {performance.level}
          </Badge>

          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{getMotivationalMessage()}</p>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Score Circle */}
          <div className="flex justify-center">
            <div className="relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted-foreground/20"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={getPerformanceColor()}
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - percentage / 100) }}
                  transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    {percentage}%
                  </motion.div>
                  <div className="text-sm text-muted-foreground font-medium">Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {stats.correct}/{stats.total} correct
              </span>
            </div>
            <Progress value={percentage} className="h-3 bg-muted/50" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              className="text-center p-4 rounded-xl bg-background/60 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.correct}</div>
              <div className="text-xs text-muted-foreground font-medium">Correct</div>
            </motion.div>

            <motion.div
              className="text-center p-4 rounded-xl bg-background/60 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-center mb-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.incorrect}</div>
              <div className="text-xs text-muted-foreground font-medium">Incorrect</div>
            </motion.div>

            <motion.div
              className="text-center p-4 rounded-xl bg-background/60 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-xs text-muted-foreground font-medium">Total</div>
            </motion.div>

            <motion.div
              className="text-center p-4 rounded-xl bg-background/60 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatTime(stats.totalTime)}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Time</div>
            </motion.div>
          </div>

          {/* Quiz Info */}
          {result?.completedAt && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Completed on {formatDate(result.completedAt)}</span>
            </div>
          )}

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2 bg-background/80 hover:bg-background min-h-[48px] min-w-[180px] text-base"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </Button>
            <Button
              onClick={onGoHome}
              variant="secondary"
              className="flex items-center gap-2 min-h-[48px] min-w-[180px] text-base"
            >
              <Home className="w-4 h-4" />
              Continue to Next Quiz
            </Button>
            <Button
              onClick={onShare}
              variant="ghost"
              size="icon"
              className="hover:bg-background/80 min-h-[48px] min-w-[48px]"
              aria-label="Share your results"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {/* Actionable feedback: Review incorrect answers */}
            {stats.incorrect > 0 && (
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  // Optionally, trigger a callback or highlight incorrect answers if available
                }}
                variant="destructive"
                className="flex items-center gap-2 min-h-[48px] min-w-[180px] text-base"
              >
                <XCircle className="w-4 h-4" />
                Review Incorrect Answers
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
