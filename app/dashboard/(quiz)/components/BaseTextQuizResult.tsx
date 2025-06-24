"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Trophy, Target, Share2, RefreshCw, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { NoResults } from "@/components/ui/no-results"
import { BestGuess } from "@/components/ui/best-guess"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import { calculateAnswerSimilarity, getSimilarityFeedback } from "@/lib/utils/similarity-scoring"

interface QuestionResult {
  questionId: string | number
  id?: string | number
  userAnswer?: string
  correctAnswer?: string
  isCorrect?: boolean
  similarity?: number
  question?: string
  text?: string
  answer?: string
  keywords?: string[]
  similarityLabel?: string
}

interface QuizResultBase {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  slug?: string
  quizId?: string
  questionResults?: QuestionResult[]
  questions?: Array<any>
  answers?: Array<any>
}

interface QuizResultsProps {
  result?: QuizResultBase
  onRetake?: () => void
  isAuthenticated?: boolean
  slug: string
  quizType: 'open-ended' | 'blanks'
}

const performanceLevels = [
  { threshold: 90, level: "Excellent", message: "Outstanding! You've mastered this topic.", color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200", emoji: "🏆" },
  { threshold: 80, level: "Very Good", message: "Great job! You have strong understanding.", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", emoji: "🎯" },
  { threshold: 70, level: "Good", message: "Well done! Your knowledge is solid.", color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200", emoji: "✅" },
  { threshold: 60, level: "Fair", message: "Good effort! Keep studying to improve.", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", emoji: "📚" },
  { threshold: 50, level: "Needs Work", message: "You're making progress. More study needed.", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", emoji: "💪" },
  { threshold: 0, level: "Poor", message: "Keep learning! Review the material thoroughly.", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", emoji: "📖" }
]

function getPerformanceLevel(percentage: number) {
  return performanceLevels.find(level => percentage >= level.threshold) || performanceLevels[performanceLevels.length - 1]
}

function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

export function BaseQuizResults({ result, onRetake, isAuthenticated = true, slug, quizType }: QuizResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)
  const dispatch = useDispatch()

  // Enhanced results calculation
  const enhancedResults = useMemo(() => {
    if (!result?.questionResults) return []
    
    return result.questionResults.map((q) => {
      const questionId = String(q.questionId || q.id || "")
      const actualAnswer = result.answers?.find((a: any) => String(a.questionId || a.id || "") === questionId)
      const questionData = result.questions?.find((quest: any) => String(quest.id || quest.questionId || "") === questionId)
      
      const questionText = q.question || q.text || questionData?.question || questionData?.text || `Question ${questionId}`
      const userAnswer = actualAnswer?.userAnswer || actualAnswer?.text || actualAnswer?.answer || q.userAnswer || q.answer || ""
      const correctAnswer = q.correctAnswer || questionData?.correctAnswer || questionData?.answer || ""
      
      let sim = typeof q.similarity === "number" ? q.similarity : calculateAnswerSimilarity(userAnswer, correctAnswer)
      if (isNaN(sim)) sim = 0
      
      const similarityLabel = q.similarityLabel || getSimilarityLabel(sim)
      const isCorrect = typeof actualAnswer?.isCorrect === "boolean" 
        ? actualAnswer.isCorrect 
        : typeof q.isCorrect === "boolean" 
          ? q.isCorrect 
          : sim >= 0.7

      return {
        ...q,
        questionId,
        question: questionText,
        userAnswer,
        correctAnswer,
        similarity: sim,
        similarityLabel,
        isCorrect,
        _originalData: {
          questionResult: q,
          answerData: actualAnswer,
          questionData: questionData,
        }
      }
    })
  }, [result])

  // Score calculation
  const { correctCount, totalQuestions, percentage } = useMemo(() => {
    const correct = enhancedResults.filter(q => q.isCorrect).length
    const total = enhancedResults.length || 1
    let finalPercentage = result?.percentage

    if (finalPercentage === undefined || finalPercentage === null) {
      if (result?.score !== undefined && result?.maxScore && result.maxScore > 0) {
        finalPercentage = Math.round((result.score / result.maxScore) * 100)
      } else {
        finalPercentage = Math.round((correct / total) * 100)
      }
    }

    return {
      correctCount: correct,
      totalQuestions: total,
      percentage: Math.max(0, Math.min(finalPercentage, 100))
    }
  }, [enhancedResults, result])

  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])

  // Confetti effect
  useEffect(() => {
    if (result?.completedAt && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Handlers
  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake()
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${result?.slug || slug}`)
  }, [onRetake, dispatch, router, result?.slug, slug, quizType])

  const handleViewAllQuizzes = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: `${result?.title || "Quiz"} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${result?.title || "Quiz"} ${quizType} quiz! ${performance.emoji}`,
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
  }, [result, percentage, performance, quizType])

  // Error states
  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Unable to Load Results"
        description="We couldn't load your quiz results. The session may have expired or some data might be missing."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondaryAction={{
          label: "Browse Quizzes",
          onClick: handleViewAllQuizzes,
          variant: "outline",
          icon: <Home className="h-4 w-4" />,
        }}
      />
    )
  }

  if (!Array.isArray(result.questionResults)) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Results"
        description="No valid question results found."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    )
  }

  // Main render
  return (
    <>
      <motion.div
        className="space-y-8 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Header Section */}
        <QuizHeader 
          title={result.title || `${quizType === 'open-ended' ? 'Open-Ended' : 'Fill in the Blanks'} Quiz Results`}
          completedAt={result.completedAt}
          performance={performance}
        />

        {/* Score Overview */}
        <ScoreOverview 
          percentage={percentage}
          correctCount={correctCount}
          totalQuestions={totalQuestions}
          performance={performance}
          quizType={quizType}
        />

        {/* Actions */}
        <QuizActions 
          onRetake={handleRetake}
          onViewAll={handleViewAllQuizzes}
          onShare={handleShare}
        />

        {/* Question Results */}
        <QuestionReview 
          results={enhancedResults}
          quizType={quizType}
        />
      </motion.div>

      {showConfetti && <Confetti isActive={showConfetti} />}
    </>
  )
}

// Sub-components for better organization

function QuizHeader({ title, completedAt, performance }: { 
  title: string, 
  completedAt?: string, 
  performance: ReturnType<typeof getPerformanceLevel> 
}) {
  return (
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
          <Target className="w-8 h-8 text-primary" />
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

      {completedAt && (
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Completed on {new Date(completedAt).toLocaleDateString()} at{" "}
          {new Date(completedAt).toLocaleTimeString()}
        </motion.p>
      )}
    </motion.div>
  )
}

function ScoreOverview({ 
  percentage, 
  correctCount, 
  totalQuestions, 
  performance,
  quizType
}: { 
  percentage: number, 
  correctCount: number, 
  totalQuestions: number, 
  performance: ReturnType<typeof getPerformanceLevel>,
  quizType: 'open-ended' | 'blanks'
}) {
  return (
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
              <p className="text-muted-foreground text-lg">
                {quizType === 'open-ended' ? 'Open-ended answers' : 'Fill-in-the-blanks'} performance summary
              </p>
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
              {percentage}%
            </motion.div>
            <div className="text-lg text-muted-foreground font-medium">
              {correctCount} of {totalQuestions}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between text-lg font-medium">
              <span>Progress</span>
              <motion.span
                key={percentage}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {correctCount}/{totalQuestions} correct
              </motion.span>
            </div>
            <div className="relative">
              <Progress value={percentage} className="h-4 rounded-full bg-muted/50" />
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
                style={{ opacity: percentage > 0 ? 1 : 0 }}
              />
            </div>
          </div>

          <motion.div
            className={`p-6 rounded-2xl border-3 ${performance.bgColor} ${performance.borderColor} shadow-lg`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-4">
              <motion.span
                className="text-4xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 2,
                }}
              >
                {performance.emoji}
              </motion.span>
              <p className={`font-bold text-xl ${performance.color}`}>{performance.message}</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreCard 
              value={correctCount} 
              label="Correct" 
              color="green" 
              delay={0.2}
            />
            <ScoreCard 
              value={totalQuestions - correctCount} 
              label="Incorrect" 
              color="red" 
              delay={0.3}
            />
            <ScoreCard 
              value={totalQuestions} 
              label="Total" 
              color="slate" 
              delay={0.4}
            />
          </div>
        </div>
      </CardContent>
    </motion.div>
  )
}

function ScoreCard({ value, label, color, delay }: { 
  value: number, 
  label: string, 
  color: 'green' | 'red' | 'slate',
  delay: number
}) {
  const colorClasses = {
    green: {
      bg: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-500",
      labelText: "text-green-700 dark:text-green-300"
    },
    red: {
      bg: "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-500",
      labelText: "text-red-700 dark:text-red-300"
    },
    slate: {
      bg: "from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30",
      border: "border-slate-200 dark:border-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      labelText: "text-slate-700 dark:text-slate-300"
    }
  }

  return (
    <motion.div
      className={`bg-gradient-to-br ${colorClasses[color].bg} border-2 ${colorClasses[color].border} rounded-2xl p-6 text-center shadow-lg`}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className={`text-4xl font-black ${colorClasses[color].text}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, type: "spring", stiffness: 200 }}
      >
        {value}
      </motion.div>
      <div className={`text-sm ${colorClasses[color].labelText} font-semibold`}>{label}</div>
    </motion.div>
  )
}

function QuizActions({ onRetake, onViewAll, onShare }: { 
  onRetake: () => void, 
  onViewAll: () => void, 
  onShare: () => void 
}) {
  return (
    <motion.div
      className="rounded-3xl shadow-2xl border-2 border-muted/20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
        <div className="flex gap-3">
          <ActionButton 
            onClick={onRetake}
            icon={<RefreshCw className="w-5 h-5" />}
            label="Retake Quiz"
            animateIcon={{ rotate: 180 }}
          />
          <ActionButton 
            onClick={onViewAll}
            icon={<Home className="w-5 h-5" />}
            label="All Quizzes"
            variant="outline"
          />
        </div>
        <ActionButton 
          onClick={onShare}
          icon={<Share2 className="w-5 h-5" />}
          label="Share Results"
          variant="outline"
          animateIcon={{ rotate: 15, scale: 1.1 }}
        />
      </CardFooter>
    </motion.div>
  )
}

function ActionButton({ 
  onClick, 
  icon, 
  label, 
  variant = 'default',
  animateIcon = {}
}: { 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string, 
  variant?: 'default' | 'outline',
  animateIcon?: any
}) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        className={`gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${variant === 'outline' ? 'border-2 hover:bg-muted/50' : ''}`}
        variant={variant}
      >
        <motion.div whileHover={animateIcon} transition={{ duration: 0.3 }}>
          {icon}
        </motion.div>
        {label}
      </Button>
    </motion.div>
  )
}

function QuestionReview({ results, quizType }: { results: QuestionResult[], quizType: 'open-ended' | 'blanks' }) {
  return (
    <motion.div
      className="rounded-3xl shadow-2xl border-2 border-muted/20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    >
      <CardHeader className="p-8 bg-gradient-to-r from-muted/10 to-muted/20 border-b-2 border-muted/20">
        <CardTitle className="flex items-center gap-4 text-2xl font-bold">
          <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
            <Target className="w-7 h-7 text-primary" />
          </motion.div>
          Answer Review ({results.length} Questions)
        </CardTitle>
        <p className="text-muted-foreground text-lg">Review your answers and learn from mistakes</p>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        {results.map((q, index) => (
          <QuestionItem 
            key={q.questionId} 
            question={q} 
            index={index} 
            quizType={quizType}
          />
        ))}
      </CardContent>
    </motion.div>
  )
}

function QuestionItem({ question, index, quizType }: { 
  question: QuestionResult, 
  index: number,
  quizType: 'open-ended' | 'blanks'
}) {
  return (
    <motion.div
      className="p-6 rounded-2xl border-2 border-muted/30 bg-gradient-to-r from-background to-muted/5 shadow-lg hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
            question.isCorrect ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
          }`}
        >
          {question.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="font-bold mb-3 text-lg text-foreground">
            Question {index + 1}: {question.question}
          </div>

          <div className="space-y-4">
            <BestGuess 
              userAnswer={question.userAnswer || ""} 
              correctAnswer={question.correctAnswer || ""} 
              similarity={question.similarity || 0}
              explanation={getSimilarityFeedback(question.similarity || 0)}
              showDetailedInfo={true}
            />
          </div>

          <motion.div
            className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg border border-muted/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <strong>Similarity:</strong> {Math.round((question.similarity || 0) * 100)}% ({question.similarityLabel})
            {process.env.NODE_ENV !== 'production' && question.userAnswer !== question.correctAnswer && (
              <div className="mt-1 text-xs text-muted-foreground italic">
                <details>
                  <summary>Debug Info</summary>
                  <div className="pl-2 mt-1">
                    <div>User: "{question.userAnswer}"</div>
                    <div>Expected: "{question.correctAnswer}"</div>
                    <div>Raw similarity score: {(question.similarity || 0).toFixed(4)}</div>
                  </div>
                </details>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

