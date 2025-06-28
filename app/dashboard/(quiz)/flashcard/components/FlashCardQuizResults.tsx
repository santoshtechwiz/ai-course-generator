"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { RefreshCw, Trophy, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

const scoreVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
      delay: 0.3,
    },
  },
}

const celebrationVariants = {
  hidden: { scale: 0, opacity: 0, rotate: -180 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
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
  const [animateStats, setAnimateStats] = useState(false)

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

  // Performance level with enhanced feedback
  const performance = useMemo(() => {
    if (percentCorrect >= 90)
      return {
        level: "Excellent",
        emoji: "🏆",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-800",
      }
    if (percentCorrect >= 80)
      return {
        level: "Great",
        emoji: "🎉",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-800",
      }
    if (percentCorrect >= 70)
      return {
        level: "Good",
        emoji: "👍",
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/20",
        borderColor: "border-amber-200 dark:border-amber-800",
      }
    if (percentCorrect >= 60)
      return {
        level: "Fair",
        emoji: "📚",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        borderColor: "border-orange-200 dark:border-orange-800",
      }
    return {
      level: "Keep Practicing",
      emoji: "💪",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
    }
  }, [percentCorrect])

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setAnimateStats(true)
    }, 1000)
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <UnifiedLoader message="Loading results..." subMessage="Calculating your performance" />
      </motion.div>
    )
  }

  if (totalQuestions === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-4">
          <div className="text-xl font-medium">No Results Available</div>
          <p className="text-muted-foreground">No flashcard results were found. Try taking the quiz again.</p>
          <Button onClick={onRestart || handleGoToFlashcards} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Flashcards
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          className={`text-center space-y-6 relative rounded-2xl p-6 sm:p-8 border-2 shadow-lg ${performance.bgColor} ${performance.borderColor}`}
        >
          <div className="space-y-3">
            <motion.h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {internalTitle}
            </motion.h1>
            <motion.p
              className="text-lg font-medium text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Quiz Complete!
            </motion.p>
          </div>

          <motion.div
            className="flex items-center justify-center gap-3"
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="text-3xl"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              {performance.emoji}
            </motion.span>
            <span className={`text-xl font-semibold ${performance.color}`}>{performance.level}</span>
          </motion.div>

          {/* Streak indicator if applicable */}
          {correctAnswers >= 5 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              <Flame className="w-4 h-4" />
              <span className="font-bold">Great streak!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Score Overview */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {/* Main Score with enhanced animation */}
              <div className="text-center mb-8">
                <motion.div
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary mb-2"
                  variants={scoreVariants}
                  initial="hidden"
                  animate={animateStats ? "visible" : "hidden"}
                >
                  {percentCorrect}%
                </motion.div>
                <p className="text-lg text-muted-foreground">Overall Score</p>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <motion.div
                  className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400"
                    initial={{ scale: 0 }}
                    animate={animateStats ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  >
                    {correctAnswers}
                  </motion.div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium">Known Well</div>
                  <div className="text-xs text-green-600 dark:text-green-400">{percentCorrect}%</div>
                </motion.div>

                <motion.div
                  className="text-center p-4 sm:p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400"
                    initial={{ scale: 0 }}
                    animate={animateStats ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                  >
                    {stillLearningAnswers}
                  </motion.div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Still Learning</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">{percentStillLearning}%</div>
                </motion.div>

                <motion.div
                  className="text-center p-4 sm:p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400"
                    initial={{ scale: 0 }}
                    animate={animateStats ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
                  >
                    {incorrectAnswers}
                  </motion.div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">Needs Improvement</div>
                  <div className="text-xs text-red-600 dark:text-red-400">{percentIncorrect}%</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  )
}
