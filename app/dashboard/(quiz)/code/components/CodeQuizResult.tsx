"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Code,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import SyntaxHighlighter from "react-syntax-highlighter"
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs"

interface CodeQuizResultProps {
  result: {
    quizId: string | number
    slug: string
    title: string
    completedAt: string
    score: number
    maxScore: number
    percentage: number
    questions: {
      id: string | number
      question: string
      code?: string
      language?: string
      correctAnswer: string
      explanation?: string
    }[]
    answers: {
      questionId: string | number
      userAnswer?: string
      isCorrect: boolean
    }[]
  }
  onRetake?: () => void
}

const getPerformanceData = (percentage: number) => {
  if (percentage >= 90) return { label: "Excellent", color: "emerald", message: "Outstanding work!" }
  if (percentage >= 80) return { label: "Very Good", color: "blue", message: "Great job!" }
  if (percentage >= 70) return { label: "Good", color: "green", message: "Well done!" }
  if (percentage >= 60) return { label: "Fair", color: "yellow", message: "You're getting there." }
  if (percentage >= 50) return { label: "Needs Work", color: "orange", message: "Review the material." }
  return { label: "Poor", color: "red", message: "Try again after studying." }
}

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake()
    dispatch(clearQuizState())
    router.push(`/dashboard/code/${result.slug}`)
  }, [onRetake, dispatch, router, result.slug])

  const handleBrowse = () => {
    router.push("/dashboard/quizzes")
  }

  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const performance = useMemo(() => getPerformanceData(result.percentage), [result.percentage])
  const formattedDate = useMemo(() => {
    try {
      return new Date(result.completedAt).toLocaleDateString()
    } catch {
      return "Recently"
    }
  }, [result.completedAt])

  const metrics = useMemo(() => ({
    correct: result.score,
    total: result.maxScore,
    percentage: result.percentage,
    incorrect: result.maxScore - result.score,
  }), [result])

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <Badge className="w-fit">{result.title}</Badge>
            <CardTitle className="text-3xl">Code Quiz Results</CardTitle>
            <CardDescription className="flex items-center gap-2 text-muted-foreground text-sm">
              <Code className="w-4 h-4" />
              Completed on {formattedDate}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6 pt-4">
          <div>
            <span className="text-muted-foreground text-sm">Score</span>
            <div className="text-2xl font-semibold">{metrics.correct} / {metrics.total}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Accuracy</span>
            <div className="text-2xl font-semibold text-blue-600">{metrics.percentage}%</div>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Performance</span>
            <div className={cn(
              "text-2xl font-semibold",
              `text-${performance.color}-600`
            )}>
              {performance.label}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleRetake} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={handleBrowse} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Code Question Breakdown</CardTitle>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
              const allIds = result.questions.map((q) => String(q.id))
              setExpandedQuestions(new Set(allIds))
            }}>
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpandedQuestions(new Set())}>
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.questions.map((q, index) => {
            const answer = result.answers.find(a => String(a.questionId) === String(q.id))
            const isCorrect = answer?.isCorrect
            const expanded = expandedQuestions.has(String(q.id))

            return (
              <Collapsible
                key={q.id}
                open={expanded}
                onOpenChange={() => toggleQuestion(String(q.id))}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className={cn(
                    "cursor-pointer hover:bg-muted rounded-lg px-4 py-3 transition-all",
                    isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <Check className="text-green-600 w-4 h-4" />
                        ) : (
                          <X className="text-red-600 w-4 h-4" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-semibold">Question:</span>
                      <p className="text-muted-foreground mt-1">{q.question}</p>
                    </div>

                    {q.code && (
                      <div>
                        <span className="font-semibold mb-2 block">Code Snippet:</span>
                        <div className="rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={q.language || 'javascript'}
                            style={vs2015}
                            showLineNumbers
                          >
                            {q.code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="font-semibold">Your Answer:</span>
                      <div className="mt-1 p-3 bg-background border rounded-md">
                        {answer?.userAnswer || "Not Answered"}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Correct Answer:</span>
                      <div className="mt-1 p-3 bg-background border rounded-md">
                        {q.correctAnswer}
                      </div>
                    </div>

                    {q.explanation && (
                      <div>
                        <span className="font-semibold">Explanation:</span>
                        <p className="mt-1 p-3 bg-background/60 border rounded-md">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
