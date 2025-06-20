"use client"

import { useMemo, useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Award, 
  Clock, 
  Activity, 
  BarChart3, 
  RefreshCw, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Target, 
  Trophy, 
  Share2,
  Home,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NoResults } from "@/components/ui/no-results"
import { Confetti } from "@/components/ui/confetti"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BestGuess } from "@/components/ui/best-guess"

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
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)

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
        color: "text-green-500",
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
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Helper for enhancing answers with question data
  const enhancedAnswers = useMemo(() => {
    return answers.map((answer) => {
      const question = questions.find(q => String(q.id) === String(answer.questionId))
      return {
        ...answer,
        question: question?.question || "Unknown question",
        correctAnswer: question?.answer || "Unknown answer"
      }
    })
  }, [answers, questions])

  // If no data
  const isLoadingOrRedirect = typeof window !== 'undefined' && (document.body.classList.contains('quiz-loading') || document.body.classList.contains('quiz-redirect'));
  if (totalQuestions === 0 && !isLoadingOrRedirect) {
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
      <motion.div
        className="space-y-8 max-w-4xl mx-auto"
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
                  <span>Average time per card: {avgTimePerCard} seconds</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onRestart}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  Restart
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleGoToFlashcards}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  variant="outline"
                >
                  <BookOpen className="w-5 h-5" />
                  All Flashcards
                </Button>
              </motion.div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleShare}
                className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
              >
                <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <Share2 className="w-5 h-5" />
                </motion.div>
                Share Results
              </Button>
            </motion.div>
          </CardFooter>
        </motion.div>

        {/* Specific Review Sections */}
        {stillLearningCards.length > 0 && (
          <motion.div
            className="rounded-3xl shadow-2xl border-2 border-yellow-200/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <CardHeader className="p-8 bg-gradient-to-r from-yellow-50/50 to-yellow-100/50 border-b-2 border-yellow-200/50">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold text-yellow-800">
                <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
                  <Activity className="w-7 h-7 text-yellow-600" />
                </motion.div>
                Still Learning ({stillLearningAnswers} Cards)
              </CardTitle>
              <p className="text-yellow-700/70 text-lg">These cards need more practice</p>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid gap-4">
                {enhancedAnswers
                  .filter(a => a.answer === "still_learning")
                  .map((item, index) => (
                    <motion.div
                      key={`learning-${item.questionId}`}
                      className="p-5 border-2 border-yellow-200 rounded-xl bg-yellow-50 shadow-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.01, y: -2 }}
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                          <span className="text-yellow-700 font-bold">{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-lg text-yellow-800">{item.question}</h3>
                      </div>
                      <div className="ml-9 text-base text-yellow-700">Correct answer: {item.correctAnswer}</div>
                    </motion.div>
                  ))}
              </div>
              
              {onReviewStillLearning && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline" 
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => onReviewStillLearning(stillLearningCards)}
                  >
                    Practice These Cards
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
        
        {/* Need Review Section */}
        {incorrectAnswers > 0 && (
          <motion.div
            className="rounded-3xl shadow-2xl border-2 border-red-200/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <CardHeader className="p-8 bg-gradient-to-r from-red-50/50 to-red-100/50 border-b-2 border-red-200/50">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold text-red-800">
                <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
                  <ThumbsDown className="w-7 h-7 text-red-600" />
                </motion.div>
                Need Review ({incorrectAnswers} Cards)
              </CardTitle>
              <p className="text-red-700/70 text-lg">These cards need more focused study</p>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid gap-4">
                {enhancedAnswers
                  .filter(a => a.answer === "incorrect" || a.isCorrect === false)
                  .map((item, index) => (
                    <motion.div
                      key={`incorrect-${item.questionId}`}
                      className="p-5 border-2 border-red-200 rounded-xl bg-red-50 shadow-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.01, y: -2 }}
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                          <span className="text-red-700 font-bold">{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-lg text-red-800">{item.question}</h3>
                      </div>
                      <div className="ml-9 text-base text-red-700">Correct answer: {item.correctAnswer}</div>
                    </motion.div>
                  ))}
              </div>
              
              {onReview && reviewCards.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => onReview(reviewCards)}
                  >
                    Review These Cards
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
        
        {/* Mastered Section */}
        {correctAnswers > 0 && (
          <motion.div
            className="rounded-3xl shadow-2xl border-2 border-green-200/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            <CardHeader className="p-8 bg-gradient-to-r from-green-50/50 to-green-100/50 border-b-2 border-green-200/50">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold text-green-800">
                <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
                  <ThumbsUp className="w-7 h-7 text-green-600" />
                </motion.div>
                Mastered ({correctAnswers} Cards)
              </CardTitle>
              <p className="text-green-700/70 text-lg">Great job with these cards!</p>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid gap-4 md:grid-cols-2">
                {enhancedAnswers
                  .filter(a => a.answer === "correct" || a.isCorrect === true)
                  .map((item, index) => (
                    <motion.div
                      key={`correct-${item.questionId}`}
                      className="p-4 border-2 border-green-200 rounded-xl bg-green-50 shadow-md"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="flex gap-2 items-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800 line-clamp-1">{item.question}</p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
