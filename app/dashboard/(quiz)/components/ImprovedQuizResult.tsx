"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy, 
  RefreshCw, 
  Share2, 
  Download, 
  Clock, 
  Target, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Star,
  Medal,
  Award
} from "lucide-react"

import type { AppDispatch } from "@/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { NoResults } from "@/components/ui/no-results"
import { QuizType } from "@/app/types/quiz-types"
import { resetQuiz } from "@/store/slices/quiz"
import { useAuth } from "@/modules/auth"

import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import CertificateGenerator from "@/app/dashboard/course/[slug]/components/CertificateGenerator"

// Import existing result components
import BlankQuizResults from "../blanks/components/BlankQuizResults"
import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded"
import FlashCardResults from "../flashcard/components/FlashCardQuizResults"
import CodeQuizResult from "../code/components/CodeQuizResult"
import { McqQuizResult } from "../mcq/components/McqQuizResult"

interface QuizResultProps {
  result: any
  slug: string
  quizType: QuizType
  onRetake?: () => void
}

interface ScoreMetrics {
  percentage: number
  correctAnswers: number
  totalQuestions: number
  timeSpent?: number
  accuracy: number
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement'
}

const performanceThresholds = {
  excellent: 90,
  good: 75,
  average: 60,
  'needs-improvement': 0
}

const performanceConfig = {
  excellent: {
    color: 'bg-green-500',
    icon: Trophy,
    message: 'Excellent performance! You mastered this topic.',
    badge: 'Excellent'
  },
  good: {
    color: 'bg-blue-500', 
    icon: Award,
    message: 'Good work! You have a solid understanding.',
    badge: 'Good'
  },
  average: {
    color: 'bg-yellow-500',
    icon: Medal,
    message: 'Average performance. Consider reviewing the material.',
    badge: 'Average'
  },
  'needs-improvement': {
    color: 'bg-red-500',
    icon: Target,
    message: 'Keep practicing! Review the concepts and try again.',
    badge: 'Needs Work'
  }
}

export default function ImprovedQuizResult({ result, slug, quizType = "mcq", onRetake }: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [showDetails, setShowDetails] = useState(false)
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { user, subscription } = useAuth()
  const hasActiveSubscription = subscription?.status !== null

  const handleRetake = () => {
    dispatch(resetQuiz())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <SignInPrompt
        onSignIn={handleSignIn}
        onRetake={handleRetake}
        quizType={quizType}
        previewData={{
          percentage: result?.percentage ?? result?.score ?? 0,
          score: result?.score,
          maxScore: result?.maxScore,
          correctAnswers: result?.correctAnswers ?? result?.score,
          totalQuestions: result?.totalQuestions ?? result?.maxScore ?? 1,
          stillLearningAnswers: result?.stillLearningAnswers,
          incorrectAnswers: result?.incorrectAnswers
        }}
      />
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Quiz Results - ${getEnhancedTitle(result, slug, quizType)}`,
          text: `I scored ${metrics.percentage}% on this ${quizType} quiz!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Enhanced metrics calculation
  const metrics: ScoreMetrics = useMemo(() => {
    if (!result) return {
      percentage: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      accuracy: 0,
      performanceLevel: 'needs-improvement'
    }

    const percentage = result.percentage ?? result.score ?? 0
    const correctAnswers = result.correctAnswers ?? result.userScore ?? 0
    const totalQuestions = result.totalQuestions ?? result.maxScore ?? result.questions?.length ?? 0
    const timeSpent = result.totalTime ?? result.timeSpent
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    let performanceLevel: ScoreMetrics['performanceLevel'] = 'needs-improvement'
    if (percentage >= performanceThresholds.excellent) performanceLevel = 'excellent'
    else if (percentage >= performanceThresholds.good) performanceLevel = 'good'
    else if (percentage >= performanceThresholds.average) performanceLevel = 'average'

    return {
      percentage,
      correctAnswers,
      totalQuestions,
      timeSpent,
      accuracy,
      performanceLevel
    }
  }, [result])

  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Results Not Found"
        description="We couldn't load your quiz results. The quiz may not have been completed."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
        }}
      />
    )
  }

  const config = performanceConfig[metrics.performanceLevel]
  const IconComponent = config.icon

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/30 overflow-hidden">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center`}>
                <IconComponent className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground px-2">
              {getEnhancedTitle(result, slug, quizType)}
            </CardTitle>

            <Badge variant="secondary" className="mt-2 text-xs sm:text-sm font-medium px-3 py-1">
              {formatQuizType(quizType)} Quiz Results
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                className="relative"
              >
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                  {Math.round(metrics.percentage)}%
                </div>
                <Badge
                  variant={metrics.performanceLevel === 'excellent' ? 'default' : 'secondary'}
                  className="mt-2 text-sm"
                >
                  {config.badge}
                </Badge>
              </motion.div>

              <Progress
                value={metrics.percentage}
                className="w-full h-2 sm:h-3 bg-muted mx-auto max-w-xs"
              />

              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto px-2">
                {config.message}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {metrics.correctAnswers}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Correct</div>
              </div>

              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {metrics.totalQuestions}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
              </div>

              {metrics.timeSpent && (
                <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-foreground">
                    {formatTime(metrics.timeSpent)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Time</div>
                </div>
              )}

              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-foreground">
                  {Math.round(metrics.accuracy)}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Accuracy</div>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Results Section */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderDetailedResults(quizType, result, slug, handleRetake)}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz-specific Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {renderQuizSpecificResults(quizType, result, slug, handleRetake)}
      </motion.div>
    </div>
  )
}

// Helper functions
function getEnhancedTitle(result: any, slug: string, quizType: QuizType): string {
  if (result?.title && result.title.trim() && !result.title.match(/^[a-zA-Z0-9]{6,}$/)) {
    return result.title.trim()
  }

  const quizIdentifier = slug || result?.quizId || result?.id || "quiz"

  if (String(quizIdentifier).match(/^[a-zA-Z0-9]{6,}$/)) {
    const typeMap = {
      mcq: "Multiple Choice Quiz",
      code: "Code Challenge",
      blanks: "Fill in the Blanks",
      openended: "Open Ended Quiz",
      flashcard: "Flashcard Review",
    }
    return typeMap[quizType as keyof typeof typeMap] || "Quiz Challenge"
  }

  return String(quizIdentifier)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatQuizType(quizType: QuizType): string {
  const typeMap = {
    mcq: "Multiple Choice",
    code: "Code Challenge",
    blanks: "Fill in the Blanks",
    openended: "Open Ended",
    flashcard: "Flashcard",
  }
  return typeMap[quizType] || quizType
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function renderDetailedResults(quizType: QuizType, result: any, slug: string, onRetake: () => void) {
  // This renders additional analytics and insights
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Performance Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Questions Answered:</span>
              <span>{result?.totalQuestions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Correct Answers:</span>
              <span>{result?.correctAnswers || result?.userScore || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>{Math.round(result?.percentage || 0)}%</span>
            </div>
          </div>
        </div>

        {result?.timeSpent && (
          <div className="space-y-2">
            <h4 className="font-semibold">Time Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Time:</span>
                <span>{formatTime(result.timeSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average per Question:</span>
                <span>{formatTime(Math.round(result.timeSpent / (result?.totalQuestions || 1)))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="text-sm text-muted-foreground">
        <p>Want to improve your score? Review the concepts and try again!</p>
      </div>
    </div>
  )
}

function renderQuizSpecificResults(quizType: QuizType, result: any, slug: string, onRetake: () => void) {
  // Wrap existing components in a card for consistency
  return (
    <Card>
      <CardContent className="p-0">
        {(() => {
          switch (quizType) {
            case "mcq":
              return <McqQuizResult result={result} onRetake={onRetake} />
            case "blanks":
              return <BlankQuizResults result={result} isAuthenticated={true} slug={slug} onRetake={onRetake} />
            case "openended":
              return <OpenEndedQuizResults result={result} isAuthenticated={true} slug={slug} onRetake={onRetake} />
            case "code":
              return <CodeQuizResult result={result} onRetake={onRetake} />
            case "flashcard":
              return (
                <FlashCardResults
                  slug={slug}
                  title={result?.title}
                  result={result}
                  onRestart={onRetake}
                />
              )
            default:
              return (
                <div className="p-6 text-center">
                  <div className="mb-4 text-xl font-medium">Quiz Results</div>
                  <div className="mb-2">Score: {result?.percentage ?? result?.score ?? 0}%</div>
                  <Button onClick={onRetake} className="mt-4">Retake Quiz</Button>
                </div>
              )
          }
        })()}
      </CardContent>
    </Card>
  )
}