"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { RefreshCw, RotateCcw, Share2, Trophy, Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Confetti } from "@/components/ui/confetti"
import { UnifiedLoader } from "@/components/ui/unified-loader"

interface Answer {
  questionId: string | number
  answer: "correct" | "incorrect" | "still_learning"
  isCorrect?: boolean
  timeSpent?: number
}

interface Question {
  id: string | number
  question: string
  answer: string
  difficulty?: string
  saved?: boolean
}

interface FlashCardResultsProps {
  quizId?: string
  slug: string
  title?: string
  score?: number
  totalQuestions?: number
  correctAnswers?: number
  stillLearningAnswers?: number
  incorrectAnswers?: number
  totalTime?: number
  onRestart?: () => void
  answers?: Answer[]
  questions?: Question[]
  result?: any
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  quizId,
  score = 0,
  totalQuestions: propTotalQuestions = 0,
  correctAnswers: propCorrectAnswers = 0,
  stillLearningAnswers: propStillLearningAnswers = 0,
  incorrectAnswers: propIncorrectAnswers = 0,
  totalTime = 0,
  onRestart,
  answers = [],
  questions = [],
  result,
}: FlashCardResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const hasShownConfettiRef = useRef(false)
  const [internalTitle, setInternalTitle] = useState(result?.title || title)

  // Process result prop if available
  useEffect(() => {
    if (result?.title) {
      setInternalTitle(result.title)
    }
  }, [result])

  // Calculate actual results from answers array to ensure consistency
  const calculatedResults = useMemo(() => {
    if (result) {
      if (result.totalQuestions && result.correctAnswers !== undefined) {
        return {
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          stillLearningAnswers: result.stillLearningAnswers || 0,
          incorrectAnswers: result.incorrectAnswers || 0,
        }
      }
      if (result.answers && result.answers.length > 0) {
        const resultAnswers = result.answers as Answer[]
        const correct = resultAnswers.filter((a: Answer) => a.answer === "correct" || a.isCorrect === true).length
        const stillLearning = resultAnswers.filter((a: Answer) => a.answer === "still_learning").length
        const incorrect = resultAnswers.filter((a: Answer) => a.answer === "incorrect" || a.isCorrect === false).length
        const total = result.totalQuestions || resultAnswers.length

        return {
          totalQuestions: total,
          correctAnswers: correct,
          stillLearningAnswers: stillLearning,
          incorrectAnswers: incorrect,
        }
      }
    }

    if (answers && answers.length > 0) {
      const correct = answers.filter((a) => a.answer === "correct" || a.isCorrect === true).length
      const stillLearning = answers.filter((a) => a.answer === "still_learning").length
      const incorrect = answers.filter((a) => a.answer === "incorrect" || a.isCorrect === false).length
      const total = propTotalQuestions || answers.length

      return {
        totalQuestions: total,
        correctAnswers: correct,
        stillLearningAnswers: stillLearning,
        incorrectAnswers: incorrect,
      }
    }

    return {
      totalQuestions: propTotalQuestions,
      correctAnswers: propCorrectAnswers,
      stillLearningAnswers: propStillLearningAnswers,
      incorrectAnswers: propIncorrectAnswers,
    }
  }, [result, answers, propTotalQuestions, propCorrectAnswers, propStillLearningAnswers, propIncorrectAnswers])

  const { totalQuestions, correctAnswers, stillLearningAnswers, incorrectAnswers } = calculatedResults

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formattedTime = formatTime(totalTime)
  const avgTimePerCard = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0

  // Calculate percentages
  const percentCorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  }, [correctAnswers, totalQuestions])

  const percentStillLearning = useMemo(() => {
    return totalQuestions > 0 ? Math.round((stillLearningAnswers / totalQuestions) * 100) : 0
  }, [stillLearningAnswers, totalQuestions])

  const percentIncorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((incorrectAnswers / totalQuestions) * 100) : 0
  }, [incorrectAnswers, totalQuestions])

  // Performance level
  const performance = useMemo(() => {
    if (percentCorrect >= 90) return { level: "Excellent", emoji: "🏆", color: "text-green-600" }
    if (percentCorrect >= 80) return { level: "Great", emoji: "🎉", color: "text-blue-600" }
    if (percentCorrect >= 70) return { level: "Good", emoji: "👍", color: "text-amber-600" }
    if (percentCorrect >= 60) return { level: "Fair", emoji: "📚", color: "text-orange-600" }
    return { level: "Keep Practicing", emoji: "💪", color: "text-red-600" }
  }, [percentCorrect])

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hasShownConfettiRef.current && percentCorrect >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [percentCorrect])

  // Event handlers
  const handleGoToFlashcards = useCallback(() => {
    router.push(`/dashboard/flashcard/${slug}?reset=true`)
  }, [router, slug])

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentCorrect}% on the ${title} flashcard quiz! 🎯`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      console.error("Sharing failed:", error)
    }
  }, [title, percentCorrect])

  if (isLoading) {
    return <UnifiedLoader message="Loading results..." subMessage="Calculating your performance" />
  }

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center space-y-4">
          <div className="text-xl font-medium">No Results Available</div>
          <p className="text-muted-foreground">No flashcard results were found. Try taking the quiz again.</p>
          <Button onClick={onRestart || handleGoToFlashcards} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Flashcards
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{internalTitle}</h1>
            <p className="text-lg font-medium text-primary">Quiz Complete!</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl ${performance.color}`}>{performance.emoji}</span>
            <span className={`text-xl font-semibold ${performance.color}`}>{performance.level}</span>
          </div>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Your Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Main Score */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-primary mb-2">{percentCorrect}%</div>
                <p className="text-lg text-muted-foreground">Overall Score</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">Known Well</div>
                  <div className="text-xs text-green-600 dark:text-green-400">{percentCorrect}%</div>
                </div>

                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stillLearningAnswers}</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Still Learning</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">{percentStillLearning}%</div>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">Need Review</div>
                  <div className="text-xs text-red-600 dark:text-red-400">{percentIncorrect}%</div>
                </div>
              </div>

              {/* Time Stats */}
              <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Total: {formattedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Avg: {avgTimePerCard}s/card</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button
            onClick={onRestart || handleGoToFlashcards}
            size="lg"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Study Again
          </Button>

          <Button onClick={handleShare} variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </motion.div>

        {/* Performance Summary */}
        <motion.div
          className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">Study Summary</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Cards Completed</div>
                <div className="text-sm text-muted-foreground">{totalQuestions} flashcards</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Study Session</div>
                <div className="text-sm text-muted-foreground">{formattedTime} total</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-background/30 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              {percentCorrect >= 80
                ? "Excellent work! You've mastered this topic well. 🎉"
                : percentCorrect >= 60
                  ? "Good progress! Keep studying to improve your understanding. 📚"
                  : "Keep practicing! Regular review will help you master these concepts. 💪"}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {showConfetti && <Confetti isActive={showConfetti} />}
    </>
  )
}
