"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  RefreshCw,
  Home,
  Download,
  Share2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/tailwindUtils"

interface QuizAnswer {
  questionId: string | number
  answer?: string
  selectedOption?: string
  selectedOptionId?: string
  isCorrect?: boolean
  userAnswer?: string
}

interface QuizQuestion {
  id: string | number
  question?: string
  text?: string
  options: string[] | { id: string; text: string }[]
  answer?: string
  correctAnswer?: string
  correctOptionId?: string
}

interface QuizResult {
  quizId: string | number
  slug: string
  title: string
  questions?: QuizQuestion[] | null
  questionResults?: any[]
  answers?: QuizAnswer[] | null
  completedAt: string
  score: number
  maxScore: number
  percentage: number
}

interface McqQuizResultProps {
  result: QuizResult
  slug?: string
  quizType?: string
  onRetake?: () => void
}

// Simplified performance level function with reduced object creation
const getPerformanceData = (percentage: number) => {
  if (percentage >= 90) return { level: "Excellent", emoji: "🏆", color: "emerald", message: "Outstanding knowledge! You've mastered this topic." }
  if (percentage >= 80) return { level: "Very Good", emoji: "🎯", color: "blue", message: "Great job! You have strong understanding." }
  if (percentage >= 70) return { level: "Good", emoji: "✅", color: "green", message: "Well done! Your knowledge is solid." }
  if (percentage >= 60) return { level: "Fair", emoji: "📚", color: "yellow", message: "Good effort! Keep studying to improve." }
  if (percentage >= 50) return { level: "Needs Work", emoji: "💪", color: "orange", message: "You're making progress. More study needed." }
  return { level: "Poor", emoji: "📖", color: "red", message: "Keep learning! Review the material thoroughly." }
}

// Memoized question item component to prevent unnecessary re-renders
const QuestionItem = ({ 
  question, 
  answer, 
  index, 
  isExpanded, 
  onToggle 
}: {
  question: QuizQuestion | any
  answer: QuizAnswer | any
  index: number
  isExpanded: boolean
  onToggle: () => void
}) => {
  const questionText = question.question || question.text || `Question ${index + 1}`
  const userAnswerText = answer?.userAnswer || answer?.selectedOption || answer?.selectedOptionId || answer?.answer || "Not answered"
  const correctAnswerText = question.correctAnswer || question.answer || question.correctOptionId || "Answer unavailable"
  const isCorrect = answer?.isCorrect ?? false

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isCorrect 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <CardTitle className="text-base font-medium">
                  Question {index + 1}
                </CardTitle>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Question:</h4>
                <p className="text-muted-foreground">{questionText}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-1">Your Answer:</h4>
                  <p className={cn(
                    "text-sm p-2 rounded border",
                    isCorrect 
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                  )}>
                    {userAnswerText}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Correct Answer:</h4>
                  <p className="text-sm p-2 rounded border bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                    {correctAnswerText}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function McqQuizResult({ result, slug, quizType = "mcq", onRetake }: McqQuizResultProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  // Memoized calculations
  const performance = useMemo(() => getPerformanceData(result.percentage), [result.percentage])
  
  const metrics = useMemo(() => ({
    correct: result.score || 0,
    incorrect: (result.maxScore || 0) - (result.score || 0),
    total: result.maxScore || 0,
    percentage: Math.round(result.percentage || 0),
  }), [result.score, result.maxScore, result.percentage])

  const formattedDate = useMemo(() => {
    try {
      const date = result?.completedAt ? new Date(result.completedAt) : null
      if (!date || isNaN(date.getTime())) {
        return "Just now"
      }
      return date.toLocaleDateString()
    } catch {
      return "Recently"
    }
  }, [result?.completedAt])

  const questions = result.questions || []
  const answers = result.answers || []
  const questionResults = result.questionResults || []
  const hasQuestionDetails = questions.length > 0 || questionResults.length > 0
  const quizSlug = slug || result.slug || result.quizId || ""

  // Optimized event handlers
  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const expandAll = useCallback(() => {
    if (!hasQuestionDetails) return
    const allIds = new Set<string>()
    if (questions.length > 0) {
      questions.forEach(q => q?.id && allIds.add(q.id.toString()))
    } else if (questionResults.length > 0) {
      questionResults.forEach((qr, index) => allIds.add(qr.questionId?.toString() || index.toString()))
    }
    setExpandedQuestions(allIds)
  }, [hasQuestionDetails, questions, questionResults])

  const collapseAll = useCallback(() => {
    setExpandedQuestions(new Set())
  }, [])

  const handleShare = useCallback(async () => {
    try {
      const shareText = `I scored ${result.percentage}% (${performance.level}) on the ${result.title} quiz! ${performance.emoji}`
      
      if (navigator.share) {
        await navigator.share({
          title: `${result.title} - Quiz Results`,
          text: shareText,
          url: window.location.href,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
        toast.success("Results copied to clipboard!")
      } else {
        toast.error("Sharing not supported")
      }
    } catch {
      toast.error("Failed to share results")
    }
  }, [result.title, result.percentage, performance.level, performance.emoji])

  const handleDownload = useCallback(() => {
    const resultText = `
Quiz Results: ${result.title}
Date: ${formattedDate}
Score: ${result.score}/${result.maxScore} (${result.percentage}%)
Performance: ${performance.level} ${performance.emoji}

${hasQuestionDetails ? 
  `Detailed Results:\n${(questions.length > 0 ? questions : questionResults)
    .map((item, i) => {
      let questionText, userAnswerText, correctAnswerText, isCorrect
      if (questions.length > 0) {
        const q = item
        const userAnswer = answers.find(a => a?.questionId?.toString() === q?.id?.toString())
        isCorrect = userAnswer?.isCorrect ?? false
        questionText = q.question || q.text || `Question ${i + 1}`
        userAnswerText = userAnswer?.userAnswer || userAnswer?.selectedOption || userAnswer?.selectedOptionId || userAnswer?.answer || "Not answered"
        correctAnswerText = q.correctAnswer || q.answer || q.correctOptionId || "Answer unavailable"
      } else {
        const qr = item
        isCorrect = qr.isCorrect ?? false
        questionText = qr.question || qr.text || `Question ${i + 1}`
        userAnswerText = qr.userAnswer || qr.selectedOption || "Not answered"
        correctAnswerText = qr.correctAnswer || "Answer unavailable"
      }
      return `Q${i + 1}: ${questionText}\nYour answer: ${userAnswerText}\nCorrect answer: ${correctAnswerText}\nResult: ${isCorrect ? "Correct ✓" : "Incorrect ✗"}\n`
    }).join("\n")}` : 
  "No detailed results available."
}`.trim()

    const blob = new Blob([resultText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.title.replace(/\s+/g, "-").toLowerCase()}-results.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Results downloaded!")
  }, [result, performance, hasQuestionDetails, questions, questionResults, answers, formattedDate])

  const handleRetakeQuiz = useCallback(() => {
    if (typeof onRetake === "function") {
      onRetake()
    } else {
      router.push(`/dashboard/${quizType}/${quizSlug}`)
    }
  }, [onRetake, router, quizType, quizSlug])

  const handleBrowseQuizzes = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Error state
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load your quiz results. The session may have expired or some data might be missing.
          </p>
        </div>
        <Button onClick={handleBrowseQuizzes} className="gap-2">
          <Home className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <Card className="overflow-hidden">
        <div className={cn(
          "bg-gradient-to-br p-6 md:p-8 text-white",
          `from-${performance.color}-500 to-${performance.color}-600`
        )}>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Left side - Quiz info */}
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/40">
                {result.title.length > 30 ? `${result.title.substring(0, 30)}...` : result.title}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Quiz Results</h1>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Completed on {formattedDate}</span>
              </div>
            </div>

            {/* Right side - Score circle */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${metrics.percentage * 2.83} ${283 - metrics.percentage * 2.83}`}
                    className="transition-all duration-1000 ease-out"
                    style={{ animationDelay: '300ms' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl md:text-4xl font-bold">{metrics.percentage}%</div>
                  <div className="text-xs opacity-80">{metrics.correct} of {metrics.total}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance badge */}
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-lg">{performance.emoji}</span>
              <span className="font-semibold">{performance.level}</span>
            </div>
            <p className="mt-2 text-white/90">{performance.message}</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Correct</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.correct}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg">Incorrect</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.incorrect}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Accuracy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{metrics.correct}/{metrics.total}</span>
            </div>
            <Progress 
              value={metrics.percentage} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleRetakeQuiz} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share Results
        </Button>
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button variant="outline" onClick={handleBrowseQuizzes} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>

      {/* Question Details */}
      {hasQuestionDetails && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Question Details
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(questions.length > 0 ? questions : questionResults).map((item, index) => {
              const questionId = item?.id?.toString() || item?.questionId?.toString() || index.toString()
              const answer = questions.length > 0 
                ? answers.find(a => a?.questionId?.toString() === item?.id?.toString())
                : item
              
              return (
                <QuestionItem
                  key={questionId}
                  question={item}
                  answer={answer}
                  index={index}
                  isExpanded={expandedQuestions.has(questionId)}
                  onToggle={() => toggleQuestion(questionId)}
                />
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

