"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Clock, 
  Activity, 
  RefreshCw, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Trophy, 
  Share2,
  CheckCircle,
  AlertCircle,
  Eye,
  RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { NoResults } from "@/components/ui/no-results"
import { Confetti } from "@/components/ui/confetti"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
  reviewCards?: number[]
  stillLearningCards?: number[]
  answers?: Answer[]
  questions?: Question[]
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  score = 0,
  totalQuestions: propTotalQuestions = 0,
  correctAnswers: propCorrectAnswers = 0,
  stillLearningAnswers: propStillLearningAnswers = 0,
  incorrectAnswers: propIncorrectAnswers = 0,
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
  const [showConfetti, setShowConfetti] = useState(false)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const hasShownConfettiRef = useRef(false)

  // Calculate actual results from answers array to ensure consistency
  const calculatedResults = useMemo(() => {
    if (!answers || answers.length === 0) {
      return {
        totalQuestions: propTotalQuestions,
        correctAnswers: propCorrectAnswers,
        stillLearningAnswers: propStillLearningAnswers,
        incorrectAnswers: propIncorrectAnswers,
      }
    }

    const correct = answers.filter(a => a.answer === "correct" || a.isCorrect === true).length
    const stillLearning = answers.filter(a => a.answer === "still_learning").length
    const incorrect = answers.filter(a => a.answer === "incorrect" || a.isCorrect === false).length
    const total = answers.length

    return {
      totalQuestions: total,
      correctAnswers: correct,
      stillLearningAnswers: stillLearning,
      incorrectAnswers: incorrect,
    }
  }, [answers, propTotalQuestions, propCorrectAnswers, propStillLearningAnswers, propIncorrectAnswers])

  const { totalQuestions, correctAnswers, stillLearningAnswers, incorrectAnswers } = calculatedResults

  // Format the total time
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }, [totalTime])

  // Calculate average time per card
  const avgTimePerCard = useMemo(() => {
    if (totalQuestions === 0) return 0
    return Math.round(totalTime / totalQuestions)
  }, [totalTime, totalQuestions])

  // Calculate percentage for each category
  const percentCorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  }, [correctAnswers, totalQuestions])

  const percentStillLearning = useMemo(() => {
    return totalQuestions > 0 ? Math.round((stillLearningAnswers / totalQuestions) * 100) : 0
  }, [stillLearningAnswers, totalQuestions])

  const percentIncorrect = useMemo(() => {
    return totalQuestions > 0 ? Math.round((incorrectAnswers / totalQuestions) * 100) : 0
  }, [incorrectAnswers, totalQuestions])

  useEffect(() => {
    // Show confetti if score is good
    if (!hasShownConfettiRef.current && percentCorrect >= 70) {
      hasShownConfettiRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentCorrect]);

  function getPerformanceLevel(percentage: number) {
    if (percentage >= 90)
      return {
        level: "Excellent",
        message: "Outstanding! You've mastered these flashcards.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        emoji: "🏆",
      }
    if (percentage >= 80)
      return {
        level: "Very Good",
        message: "Great job! You have strong recall.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        emoji: "🎯",
      }
    if (percentage >= 70)
      return {
        level: "Good",
        message: "Well done! Your memory is solid.",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        emoji: "🌟",
      }
    if (percentage >= 60)
      return {
        level: "Satisfactory",
        message: "You're on the right track!",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        emoji: "👍",
      }
    if (percentage >= 50)
      return {
        level: "Needs Improvement",
        message: "You're getting there. Keep studying!",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        emoji: "📚",
      }
    return {
      level: "Study Required",
      message: "More practice needed to master these flashcards.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      emoji: "📝",
    }
  }

  const performance = getPerformanceLevel(percentCorrect)

  // Handle go back to flashcards page
  const handleGoToFlashcards = useCallback(() => {
    router.push("/dashboard/flashcard")
  }, [router])

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentCorrect}% (${performance.level}) on the ${title} flashcard quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  // Helper for enhancing answers with question data
  const enhancedAnswers = useMemo(() => {
    return answers.map((answer) => {
      const question = questions.find(q => String(q.id) === String(answer.questionId))
      return {
        ...answer,
        question: question?.question || "Unknown question",
        correctAnswer: question?.answer || "Unknown answer",
        difficulty: question?.difficulty || "medium",
        saved: question?.saved || false
      }
    })
  }, [answers, questions])

  // Group answers by result type for review
  const reviewableCards = useMemo(() => {
    const incorrect = enhancedAnswers.filter(a => a.answer === "incorrect" || a.isCorrect === false)
    const stillLearning = enhancedAnswers.filter(a => a.answer === "still_learning")
    return { incorrect, stillLearning }
  }, [enhancedAnswers])

  // If no data
  if (totalQuestions === 0) {
    return (
      <NoResults
        variant="quiz"
        title="No Results Available"
        description="No flashcard results were found. Try taking the quiz again."
        action={{
          label: "Start Flashcards",
          onClick: onRestart || handleGoToFlashcards,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    )
  }

  return (
    <>
      {showConfetti && <Confetti />}
      
      <motion.div
        className="space-y-8 max-w-4xl mx-auto p-4"
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
          <div className="flex items-center justify-center gap-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <BookOpen className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-left">
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {title}
              </motion.h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-2"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className={`mt-3 px-4 py-2 text-sm font-semibold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
            >
              <motion.span
                className="mr-2 text-lg"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              >
                {performance.emoji}
              </motion.span>
              {performance.level}
            </Badge>
          </motion.div>

          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {performance.message}
          </motion.p>
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
            <CardHeader className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-b-2 border-primary/10 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
                    <Trophy className="w-12 h-12 text-primary drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-foreground">Your Score</CardTitle>
                    <p className="text-muted-foreground text-lg">Flashcard performance summary</p>
                  </div>
                </div>
                <div className="text-right">
                  <motion.div
                    className="text-6xl font-black text-primary drop-shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    {percentCorrect}%
                  </motion.div>
                  <div className="text-lg text-muted-foreground font-medium">
                    {correctAnswers} of {totalQuestions}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Overall Progress</span>
                    <motion.span
                      key={percentCorrect}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {correctAnswers}/{totalQuestions} correct
                    </motion.span>
                  </div>
                  <div className="relative">
                    <Progress value={percentCorrect} className="h-4 rounded-full bg-muted/50" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                        repeatDelay: 1,
                      }}
                      style={{ opacity: percentCorrect > 0 ? 1 : 0 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="text-4xl font-black text-green-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      {correctAnswers}
                    </motion.div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Knew It!</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">{percentCorrect}%</div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="text-4xl font-black text-yellow-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      {stillLearningAnswers}
                    </motion.div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold">Still Learning</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{percentStillLearning}%</div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="text-4xl font-black text-red-500"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      {incorrectAnswers}
                    </motion.div>
                    <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Didn't Know</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">{percentIncorrect}%</div>
                  </motion.div>
                </div>

                {/* Time info */}
                <div className="p-6 bg-muted/10 rounded-xl border border-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium">Time Performance</span>
                    </div>
                    <span className="text-lg font-semibold">{formattedTime}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Average per card: {avgTimePerCard}s</span>
                    <span>Total questions: {totalQuestions}</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0">
              <div className="w-full space-y-4">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    onClick={onRestart || handleGoToFlashcards}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>

                  {reviewableCards.incorrect.length > 0 && (
                    <Button
                      onClick={() => onReview?.(reviewableCards.incorrect.map(a => Number(a.questionId)))}
                      variant="outline"
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Review Missed ({reviewableCards.incorrect.length})
                    </Button>
                  )}

                  {reviewableCards.stillLearning.length > 0 && (
                    <Button
                      onClick={() => onReviewStillLearning?.(reviewableCards.stillLearning.map(a => Number(a.questionId)))}
                      variant="outline"
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <Activity className="h-4 w-4" />
                      Review Learning ({reviewableCards.stillLearning.length})
                    </Button>
                  )}

                  <Button
                    onClick={() => setShowDetailedResults(!showDetailedResults)}
                    variant="outline"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Eye className="h-4 w-4" />
                    {showDetailedResults ? 'Hide' : 'Show'} Details
                  </Button>

                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        {showDetailedResults && enhancedAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-center">Detailed Results</h3>
            <div className="space-y-3">
              {enhancedAnswers.map((answer, index) => {
                const isCorrect = answer.answer === "correct" || answer.isCorrect === true
                const isStillLearning = answer.answer === "still_learning"
                const isIncorrect = answer.answer === "incorrect" || answer.isCorrect === false

                return (
                  <motion.div
                    key={`${answer.questionId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                        : isStillLearning
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        isCorrect 
                          ? 'text-green-500'
                          : isStillLearning
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isStillLearning ? (
                          <Activity className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-2">
                          Question {index + 1}
                          {answer.difficulty && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {answer.difficulty}
                            </Badge>
                          )}
                          {answer.saved && (
                            <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700">
                              Saved
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {answer.question}
                        </div>
                        <div className="text-sm">
                          <strong>Answer:</strong> {answer.correctAnswer}
                        </div>
                        {answer.timeSpent !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Time spent: {answer.timeSpent}s
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  )
}

