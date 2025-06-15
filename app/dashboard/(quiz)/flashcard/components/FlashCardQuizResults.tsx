"use client"

import { useMemo, useCallback, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Award, Clock, Activity, BarChart3, RefreshCw, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NoResults } from "@/components/ui/no-results"
import { QuizLoader } from "@/components/ui/quiz-loader"

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
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
  reviewCards?: number[]
  stillLearningCards?: number[]
  answers?: Array<{
    questionId: string | number
    answer: "correct" | "incorrect" | "still_learning"
    isCorrect?: boolean
    timeSpent?: number
  }>
  questions?: Array<{
    id: string | number
    question: string
    answer: string
  }>
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  score = 0,
  totalQuestions = 0,
  correctAnswers = 0,
  stillLearningAnswers = 0,
  incorrectAnswers = 0,
  totalTime = 0,
  onRestart,
  onReview,
  onReviewStillLearning,
  reviewCards = [],
  stillLearningCards = [],
  answers = [],
  questions = [],
}: FlashCardResultsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for smooth transition
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  // Process answers to categorize cards by response type
  const cardsByCategory = useMemo(() => {
    const correct: Array<{ id: string | number; question: string; answer: string }> = []
    const stillLearning: Array<{ id: string | number; question: string; answer: string }> = []
    const incorrect: Array<{ id: string | number; question: string; answer: string }> = []

    if (answers && questions) {
      answers.forEach((answer) => {
        const question = questions.find((q) => q.id.toString() === answer.questionId.toString())
        if (question) {
          const cardData = {
            id: question.id,
            question: question.question,
            answer: question.answer,
          }

          switch (answer.answer) {
            case "correct":
              correct.push(cardData)
              break
            case "still_learning":
              stillLearning.push(cardData)
              break
            case "incorrect":
              incorrect.push(cardData)
              break
          }
        }
      })
    }

    return { correct, stillLearning, incorrect }
  }, [answers, questions])

  // Memoize calculations to avoid recalculating on every render
  const { formattedTime, accuracyPercentage, cardsPerMinute, calculatedCounts } = useMemo(() => {
    // Format time from seconds to minutes and seconds
    const mins = Math.floor(totalTime / 60)
    const secs = totalTime % 60
    const formattedTime = `${mins}m ${secs}s`

    // Calculate counts from answers if not provided
    const calculatedCorrect = correctAnswers || cardsByCategory.correct.length
    const calculatedStillLearning = stillLearningAnswers || cardsByCategory.stillLearning.length
    const calculatedIncorrect = incorrectAnswers || cardsByCategory.incorrect.length
    const calculatedTotal = totalQuestions || calculatedCorrect + calculatedStillLearning + calculatedIncorrect

    // Calculate metrics - only "correct" answers count toward accuracy
    const accuracyPercentage = calculatedTotal > 0 ? Math.round((calculatedCorrect / calculatedTotal) * 100) : 0
    const cardsPerMinute = totalTime > 0 ? Math.round((calculatedTotal / (totalTime / 60)) * 10) / 10 : 0

    return {
      formattedTime,
      accuracyPercentage,
      cardsPerMinute,
      calculatedCounts: {
        correct: calculatedCorrect,
        stillLearning: calculatedStillLearning,
        incorrect: calculatedIncorrect,
        total: calculatedTotal,
      },
    }
  }, [totalTime, score, totalQuestions, correctAnswers, stillLearningAnswers, incorrectAnswers, cardsByCategory])

  // Memoize handlers to prevent recreating functions on every render
  const handleRetake = useCallback(() => {
    if (onRestart) {
      onRestart()
    } else {
      router.push(`/dashboard/flashcard/${slug}`)
    }
  }, [onRestart, router, slug])

  const handleViewAll = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Handle reviewing incorrect cards
  const handleReviewIncorrect = useCallback(() => {
    if (onReview && cardsByCategory.incorrect.length > 0) {
      const incorrectIndices = cardsByCategory.incorrect.map((card) =>
        questions.findIndex((q) => q.id.toString() === card.id.toString()),
      )
      onReview(incorrectIndices.filter((idx) => idx !== -1))
    }
  }, [onReview, cardsByCategory.incorrect, questions])

  // Handle reviewing still learning cards
  const handleReviewStillLearning = useCallback(() => {
    if (onReviewStillLearning && cardsByCategory.stillLearning.length > 0) {
      const stillLearningIndices = cardsByCategory.stillLearning.map((card) =>
        questions.findIndex((q) => q.id.toString() === card.id.toString()),
      )
      onReviewStillLearning(stillLearningIndices.filter((idx) => idx !== -1))
    }
  }, [onReviewStillLearning, cardsByCategory.stillLearning, questions])

  // Check if we have cards for review
  const hasIncorrectCards = cardsByCategory.incorrect.length > 0
  const hasStillLearningCards = cardsByCategory.stillLearning.length > 0

  // Optimized animation variants with hardware acceleration and smoother transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        ease: "easeOut",
        duration: 0.4,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 15,
      willChange: "transform, opacity",
    },
    visible: {
      opacity: 1,
      y: 0,
      willChange: "auto",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
        mass: 0.8,
      },
    },
  }

  // Validation
  if (typeof score !== "number" || typeof totalQuestions !== "number") {
    console.warn("Invalid props passed to FlashCardResults")
    return (
      <NoResults
        variant="error"
        title="Invalid Results Data"
        description="There was an issue displaying your results."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />
    )
  }

  // Only show "No Results" if there are truly no questions and no answers
  if (calculatedCounts.total === 0 && !score && !correctAnswers) {
    return (
      <NoResults
        variant="quiz"
        title="No Results Found"
        description="Try retaking the quiz to view results."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="w-4 h-4" />,
        }}
      />
    )
  }

  if (isLoading) {
    return <QuizLoader message="Calculating results..." />
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      layout
      layoutRoot
    >
      <motion.div variants={itemVariants} className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title} Completed!</h1>
        <p className="text-muted-foreground">You've completed your flashcard session.</p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">
                    {calculatedCounts.correct} / {calculatedCounts.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">{formattedTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-2 rounded-full">
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{accuracyPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cards/Min</p>
                  <p className="text-2xl font-bold">{cardsPerMinute}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Correct Cards */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Got It Right</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Mastered cards</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {calculatedCounts.correct}
                </span>
              </div>

              {/* Still Learning Cards */}
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Still Learning</p>
                    <p className="text-sm text-amber-600 dark:text-amber-500">Need more practice</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {calculatedCounts.stillLearning}
                </span>
              </div>

              {/* Incorrect Cards */}
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Missed</p>
                    <p className="text-sm text-red-600 dark:text-red-500">Need to review</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-700 dark:text-red-400">{calculatedCounts.incorrect}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Review Sections */}
      {(hasStillLearningCards || hasIncorrectCards) && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Review Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Still Learning Cards Review */}
              {hasStillLearningCards && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                      <div>
                        <h3 className="font-medium text-amber-700 dark:text-amber-400">
                          Still Learning Cards ({calculatedCounts.stillLearning})
                        </h3>
                        <p className="text-sm text-amber-600 dark:text-amber-500">Cards you marked as still learning</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReviewStillLearning}
                            className="border-amber-200 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/20"
                          >
                            Review
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Review cards you're still learning</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {cardsByCategory.stillLearning.slice(0, 3).map((card, index) => (
                      <div key={card.id} className="text-sm p-2 bg-white dark:bg-amber-950/40 rounded border">
                        <p className="font-medium truncate">{card.question}</p>
                      </div>
                    ))}
                    {cardsByCategory.stillLearning.length > 3 && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                        +{cardsByCategory.stillLearning.length - 3} more cards
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Incorrect Cards Review */}
              {hasIncorrectCards && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                      <div>
                        <h3 className="font-medium text-red-700 dark:text-red-400">
                          Missed Cards ({calculatedCounts.incorrect})
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-500">Cards you got wrong</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReviewIncorrect}
                            className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/20"
                          >
                            Review
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Review cards you got wrong</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {cardsByCategory.incorrect.slice(0, 3).map((card, index) => (
                      <div key={card.id} className="text-sm p-2 bg-white dark:bg-red-950/40 rounded border">
                        <p className="font-medium truncate">{card.question}</p>
                      </div>
                    ))}
                    {cardsByCategory.incorrect.length > 3 && (
                      <p className="text-xs text-red-600 dark:text-red-500 text-center">
                        +{cardsByCategory.incorrect.length - 3} more cards
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleRetake} size="lg" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={handleViewAll} size="lg">
          View All Quizzes
        </Button>
      </motion.div>
    </motion.div>
  )
}
