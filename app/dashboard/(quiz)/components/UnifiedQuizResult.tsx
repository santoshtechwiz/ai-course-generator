"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useDispatch } from "react-redux"
import { Trophy, Share2, Clock, Target, Star, Medal, Award, Download } from "lucide-react"

import { CheckCircle2, XCircle, BookOpen } from "lucide-react"
// Use Recharts directly for chart rendering to avoid coupling with chart wrapper
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
// Avoid importing AppDispatch here to reduce type coupling in this UI component
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
import { UnifiedLoader } from "@/components/loaders"
import BlankQuizResults from "../blanks/components/BlankQuizResults"
import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded"

// ...existing code...

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

export default function UnifiedQuizResult({ result, slug, quizType = "mcq", onRetake }: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading: isAuthLoading, subscription } = useAuth()

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
      <div className="min-h-[400px] flex items-center justify-center">
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message="Loading your quiz results..."
          className="text-center"
        />
      </div>
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
          correctAnswers: result?.results?.filter((r: any) => r.isCorrect === true).length ?? result?.score ?? 0,
          totalQuestions: result?.totalQuestions ?? result?.maxScore ?? result?.results?.length ?? 1,
          stillLearningAnswers: result?.stillLearningAnswers,
          incorrectAnswers: result?.incorrectAnswers
        }}
      />
    )
  }

  // Delegate to specialized text-result components for blanks / open-ended quizzes
  // This reuses the existing BaseTextQuizResult logic (similarity scoring, insights, etc.)
  if (quizType === 'blanks') {
    return (
      <BlankQuizResults
        result={result}
        onRetake={() => (onRetake ? onRetake() : handleRetake())}
        isAuthenticated={isAuthenticated}
        slug={slug}
      />
    )
  }

  if (quizType === 'openended' || quizType === 'open-ended') {
    return (
      <OpenEndedQuizResults
        result={result}
        onRetake={() => (onRetake ? onRetake() : handleRetake())}
        isAuthenticated={isAuthenticated}
        slug={slug}
      />
    )
  }

  const pathname = usePathname?.() ?? ''

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({
          title: `My Quiz Results - ${getEnhancedTitle(result, slug, quizType)}`,
          text: `I scored ${metrics.percentage}% on this ${quizType} quiz!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator && (navigator as any).clipboard) {
        (navigator as any).clipboard.writeText(window.location.href)
      }
    }
  }

  const metrics: ScoreMetrics = useMemo(() => {
    if (!result) return {
      percentage: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      accuracy: 0,
      performanceLevel: 'needs-improvement'
    }

    // Calculate correct answers from results array
    const resultsArray = result?.questionResults?.length ? result.questionResults : result?.results || []
    const isTextQuiz = quizType === 'blanks' || quizType === 'openended' || quizType === 'open-ended'
    const correctAnswers = resultsArray.filter((r: any) => {
      if (r?.isCorrect === true) return true
      if (isTextQuiz) {
        // similarity may be 0..1 or 0..100 depending on source
        const simCandidates = [r?.similarity, r?.similarityScore, r?.similarityPercent]
        for (const raw of simCandidates) {
          if (typeof raw === 'number') {
            if (raw >= 0.8 || raw >= 80) return true
          } else if (typeof raw === 'string') {
            const p = parseFloat(raw)
            if (!isNaN(p) && (p >= 0.8 || p >= 80)) return true
          }
        }
      }
      return false
    }).length
    const totalQuestions = result.totalQuestions ?? result.maxScore ?? resultsArray.length ?? 0
    const percentage = result.percentage ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0)
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

  // Ensure user answer is captured and displayed
  // Use questionResults if available, fallback to results
  const questionResults = result?.questionResults?.length ? result.questionResults : result?.results || [];

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

  const chartData = useMemo(() => {
    const correct = metrics.correctAnswers
    const total = metrics.totalQuestions
    const incorrect = Math.max(0, total - correct)

    return {
      pieData: [
        { name: 'Correct', value: correct, color: 'var(--color-correct, #10b981)' },
        { name: 'Incorrect', value: incorrect, color: 'var(--color-incorrect, #ef4444)' },
      ],
      topicPerfData: (result?.topicPerformance || []).map((t: any) => ({ name: t.topic || t.name, value: t.score || 0 }))
    }
  }, [metrics.correctAnswers, metrics.totalQuestions, result?.topicPerformance])

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
      {/* Top header - harmonized with BaseTextQuizResult */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className={cn('relative overflow-hidden border-2 shadow-xl rounded-2xl', quizType === 'blanks' ? 'border-pink-200' : '')}>
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', quizType === 'blanks' ? 'from-pink-50 via-pink-100 to-pink-50' : '')} />
          <CardHeader className="relative z-10 text-center py-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg border">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <CardTitle className="text-3xl md:text-4xl font-bold mb-2">{getEnhancedTitle(result, slug, quizType)}</CardTitle>
              <p className="text-sm text-muted-foreground">Completed on {result?.completedAt ? new Date(result.completedAt).toLocaleString() : ''}</p>
            </div>
          </CardHeader>
        </Card>

        {/* Metric cards row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-2xl font-semibold text-primary mt-1">{Math.round(metrics.percentage)}%</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Completion Time</div>
            <div className="text-xl font-semibold mt-1">{metrics.timeSpent ? formatTime(metrics.timeSpent) : (result?.totalTime ? formatTime(result.totalTime) : '-')}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="text-xl font-semibold mt-1 text-green-600">{metrics.percentage >= 60 ? 'Passed' : 'Failed'}</div>
          </Card>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary + Charts */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{Math.round(metrics.percentage)}%</div>
                <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
              </div>
              <div className="w-36 h-36">
                  <div className="w-28 h-28">
                  <PieChart width={112} height={112}>
                    <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={6} labelLine={false}>
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                  </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">{metrics.correctAnswers}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">{metrics.totalQuestions}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">{Math.round(metrics.accuracy)}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">{metrics.timeSpent ? formatTime(metrics.timeSpent) : '-'}</div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
              </div>
          </Card>

          <Card className="p-4">
            <CardHeader className="px-0">
              <CardTitle className="text-sm font-semibold">Performance by Topic</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2 h-44">
              {chartData.topicPerfData && chartData.topicPerfData.length ? (
                  <BarChart data={chartData.topicPerfData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
                    <RechartsTooltip />
                  </BarChart>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No topic breakdown available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right: Question Breakdown + Recommendations + CTAs */}
        <div className="lg:col-span-2 space-y-4">
            <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Question Breakdown</CardTitle>
              <div className="text-sm text-muted-foreground">Tap a question to expand</div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue={undefined}>
                {questionResults.map((q: any, idx: number) => {
                  const baseCorrect = q?.correct ?? q?.isCorrect ?? q?.status === 'correct'
                  const isTextQuiz = quizType === 'blanks' || quizType === 'openended' || quizType === 'open-ended'
                  let isCorrect = Boolean(baseCorrect)
                  if (!isCorrect && isTextQuiz) {
                    const simCandidates = [q?.similarity, q?.similarityScore, q?.similarityPercent]
                    for (const raw of simCandidates) {
                      if (typeof raw === 'number') {
                        if (raw >= 0.8 || raw >= 80) {
                          isCorrect = true
                          break
                        }
                      } else if (typeof raw === 'string') {
                        const p = parseFloat(raw)
                        if (!isNaN(p) && (p >= 0.8 || p >= 80)) {
                          isCorrect = true
                          break
                        }
                      }
                    }
                  }
                  return (
                    <AccordionItem value={`q-${idx}`} key={idx}>
                        <AccordionTrigger className="w-full flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-50 text-green-600 ring-2 ring-green-100' : 'bg-red-50 text-red-600 ring-2 ring-red-100 animate-pulse'}`}>
                              {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div className="text-sm text-foreground leading-snug text-left truncate">{`Q${idx+1}: ${q?.question || q?.title || 'Question'}`}</div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-4">{isCorrect ? 'Correct' : 'Incorrect'}</div>
                        </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-3 text-sm space-y-3">
                          {(() => {
                            const rawUser = q?.userAnswer ?? q?.answer ?? ''
                            let displayAnswer = rawUser || '-'
                            const opts = q?.options || q?.question?.options || q?.choices || null
                            if (opts && Array.isArray(opts) && rawUser) {
                              const found = opts.find((o: any) => String(o.id ?? o.value ?? o.key) === String(rawUser) || String(o.id ?? o.value ?? o.key) === String(q?.selectedOptionId ?? rawUser))
                              if (found) {
                                displayAnswer = found.label ?? found.text ?? found.title ?? String(found.value ?? found.id)
                              }
                            }

                            return (
                              <div>
                                <div className="font-medium mb-1">Your answer</div>
                                <div className="p-3 bg-muted/10 rounded text-sm">{displayAnswer}</div>
                              </div>
                            )
                          })()}

                          <div>
                            <div className="font-medium mb-1">Correct answer</div>
                            <div className="p-3 bg-muted/10 rounded text-sm">{q?.correctAnswer ?? q?.expected ?? '-'}</div>
                          </div>

                          {q?.explanation && (
                            <div>
                              <div className="font-medium mb-1">Explanation</div>
                              <div className="text-muted-foreground text-sm">{q.explanation}</div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <CardHeader className="px-0">
                <CardTitle className="text-sm font-semibold">Key Takeaways</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                <div className="p-4 bg-muted/20 rounded">{/* subtle background */}
                  <ul className="space-y-2">
                    {(result?.takeaways || generateTakeawaysFromResult(result)).map((t: any, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 text-primary"><Star className="w-4 h-4" /></div>
                        <div className="text-sm text-muted-foreground">{t}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="px-0">
                <CardTitle className="text-sm font-semibold">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {(result?.recommendations || generateRecommendations(result)).map((rec: any, i: number) => (
                    <div key={i} className="p-3 bg-sky-50 rounded-lg flex items-start gap-3 border border-sky-100">
                      <div className="p-2 rounded-md bg-sky-100 text-sky-700"><BookOpen className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
                <div className="flex-1">
                  {/* Hide the review CTA if the results indicate they've already been reviewed
                      or if user is already on a review page. Fall back to a 'Reviewed' badge. */}
                  {!(result?.reviewed || result?.hasBeenReviewed || result?.reviewedAt || pathname.includes('/review')) ? (
                    <Button className="w-full py-3" onClick={() => router.push(`/dashboard/${quizType}/${slug}/review`)}>
                      Review All Answers
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Reviewed
                      </span>
                    </div>
                  )}
                </div>
            <Button variant="outline" onClick={() => onRetake ? onRetake() : handleRetake()} className="sm:w-40">
              Retake Quiz
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="sm:w-40">
              Go to Dashboard
            </Button>
          </div>

          {/* Per-type deep render intentionally omitted to keep unified layout
              If specialized per-quiz interactions are required, they should
              be migrated into the unified component or invoked from a
              dedicated review flow. */}
        </div>
      </div>
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
  return typeMap[quizType as keyof typeof typeMap] || String(quizType)
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function renderDetailedResults(quizType: QuizType, result: any, slug: string, onRetake: () => void) {
  // derive basic metrics locally to avoid relying on outer scope
  const resultsArray = result?.questionResults?.length ? result.questionResults : result?.results || []
  const correctAnswers = resultsArray.filter((r: any) => r.isCorrect === true).length
  const totalQuestions = result.totalQuestions ?? result.maxScore ?? resultsArray.length ?? 0
  const percentage = result.percentage ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0)

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
              <span>{correctAnswers}</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>{Math.round(percentage)}%</span>
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

// (Specialized per-quiz renderers removed - unify behavior here)

// Generate simple recommendations if none provided
function generateRecommendations(result: any) {
  if (result?.recommendations) return result.recommendations
  const recs = [] as any[]
  if ((result?.incorrectTopics || []).length) {
    (result.incorrectTopics || []).slice(0,3).forEach((t:string) => {
      recs.push({ title: `Review: ${t}`, description: `Study the ${t} section and try related exercises.` })
    })
  } else {
    recs.push({ title: 'Practice more problems', description: 'Solve 5-10 practice questions focused on weak areas.' })
  }
  return recs
}

function generateTakeawaysFromResult(result: any) {
  if (result?.takeaways) return result.takeaways
  const arr = [] as string[]
  if (result?.percentage >= 90) arr.push('Strong understanding of the material. Keep it up!')
  else if (result?.percentage >= 75) arr.push('Good job — focus on a few topics to improve further.')
  else arr.push('Spend time reviewing the incorrect questions and fundamentals.')
  return arr
}
