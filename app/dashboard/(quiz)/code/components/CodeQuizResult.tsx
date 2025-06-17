"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Check, X, ChevronDown, ChevronUp, RefreshCw, Code, BookOpen } from "lucide-react"
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
      questionId?: string | number
      question: string
      text?: string
      prompt?: string
      code?: string
      codeSnippet?: string
      language?: string
      correctAnswer: string
      answer?: string
      explanation?: string
      expectedOutput?: string
      userAnswer?: string
      submittedAnswer?: string
      [key: string]: any
    }[]
    answers: {
      questionId: string | number
      id?: string | number
      userAnswer?: string
      answer?: string
      code?: string
      text?: string
      isCorrect: boolean
      [key: string]: any
    }[]
    questionResults?: {
      questionId: string | number
      id?: string | number
      question?: string
      correctAnswer?: string
      userAnswer?: string
      isCorrect?: boolean
      type?: string
      similarity?: number
      timeSpent?: number
      [key: string]: any
    }[]
    metrics?: {
      correct: number
      incorrect: number
      total: number
      percentage: number
      [key: string]: any
    }
    [key: string]: any
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

  const performance = useMemo(() => getPerformanceData(result.percentage || 0), [result.percentage])
  const formattedDate = useMemo(() => {
    try {
      return new Date(result.completedAt).toLocaleDateString()
    } catch {
      return "Recently"
    }
  }, [result.completedAt])

  // Simplified and reliable metrics calculation
  const metrics = useMemo(() => {
    let correctAnswers = 0
    let totalQuestions = 0

    // Primary: Use direct score values if available and valid
    if (typeof result.score === "number" && typeof result.maxScore === "number" && result.maxScore > 0) {
      correctAnswers = Math.max(0, result.score)
      totalQuestions = result.maxScore
    }
    // Secondary: Count from questionResults
    else if (Array.isArray(result.questionResults) && result.questionResults.length > 0) {
      correctAnswers = result.questionResults.filter((qr) => qr.isCorrect === true).length
      totalQuestions = result.questionResults.length
    }
    // Tertiary: Count from answers array
    else if (Array.isArray(result.answers) && result.answers.length > 0) {
      correctAnswers = result.answers.filter((a) => a.isCorrect === true).length
      totalQuestions = result.answers.length
    }
    // Final fallback: Use questions array
    else if (Array.isArray(result.questions) && result.questions.length > 0) {
      totalQuestions = result.questions.length
      // Try to match answers to questions for correct count
      if (Array.isArray(result.answers)) {
        correctAnswers = result.questions.filter((q, index) => {
          const answer = result.answers[index]
          return answer?.isCorrect === true
        }).length
      }
    }

    // Ensure we have valid numbers
    correctAnswers = Math.max(0, correctAnswers)
    totalQuestions = Math.max(1, totalQuestions)

    const calculatedPercentage = Math.round((correctAnswers / totalQuestions) * 100)
    const finalPercentage =
      typeof result.percentage === "number" && result.percentage >= 0
        ? Math.min(result.percentage, 100)
        : calculatedPercentage

    return {
      correct: correctAnswers,
      total: totalQuestions,
      percentage: Math.max(0, Math.min(finalPercentage, 100)),
      incorrect: totalQuestions - correctAnswers,
    }
  }, [result])

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <Badge className="w-fit">{result.title}</Badge>
            <CardTitle className="text-2xl sm:text-3xl break-words">Code Quiz Results</CardTitle>
            <CardDescription className="flex items-center gap-2 text-muted-foreground text-sm">
              <Code className="w-4 h-4" />
              Completed on {formattedDate}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <span className="text-muted-foreground text-sm block mb-1">Score</span>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {metrics.correct} / {metrics.total}
            </div>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground text-sm block mb-1">Accuracy</span>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{metrics.percentage}%</div>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground text-sm block mb-1">Performance</span>
            <div className={cn("text-xl sm:text-2xl font-bold", `text-${performance.color}-600`)}>
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
          <CardTitle>Question Breakdown</CardTitle>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const allIds = result.questions.map((q) => String(q.id || q.questionId || ""))
                setExpandedQuestions(new Set(allIds))
              }}
            >
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpandedQuestions(new Set())}>
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.questions.map((q, index) => {
            const qid = String(q.id || q.questionId || index)
            const answer = result.answers?.find((a) => String(a.questionId || a.id) === qid) || result.answers?.[index]
            const questionResult =
              result.questionResults?.find((qr) => String(qr.questionId || qr.id) === qid) ||
              result.questionResults?.[index]

            // Extract question text
            let questionText = ""
            if (typeof q.question === "string" && q.question.trim().length > 0) {
              questionText = q.question
            } else if (typeof q.text === "string" && q.text.trim().length > 0) {
              questionText = q.text
            } else if (typeof q.prompt === "string" && q.prompt.trim().length > 0) {
              questionText = q.prompt
            }

            // Extract code snippet
            let codeSnippet = ""
            if (typeof q.code === "string" && q.code.trim().length > 0) {
              codeSnippet = q.code
            } else if (typeof q.codeSnippet === "string" && q.codeSnippet.trim().length > 0) {
              codeSnippet = q.codeSnippet
            }

            const codeLanguage = q.language || answer?.language || questionResult?.language || "javascript"

            // Get user answer
            const getUserAnswer = () => {
              if (answer?.userAnswer) return answer.userAnswer
              if (answer?.code) return answer.code
              if (answer?.answer) return answer.answer
              if (questionResult?.userAnswer) return questionResult.userAnswer
              if (q.userAnswer) return q.userAnswer
              if (q.submittedAnswer) return q.submittedAnswer
              return null
            }

            const userAnswer = getUserAnswer()

            // Get correct answer
            let correctAnswer = ""
            if (typeof q.correctAnswer === "string" && q.correctAnswer.trim()) {
              correctAnswer = q.correctAnswer
            } else if (typeof q.answer === "string" && q.answer.trim()) {
              correctAnswer = q.answer
            } else if (typeof q.expectedOutput === "string" && q.expectedOutput.trim()) {
              correctAnswer = q.expectedOutput
            }

            const explanation = q.explanation || answer?.explanation || questionResult?.explanation || ""
            const isCorrect =
              (answer && answer.isCorrect === true) || (questionResult && questionResult.isCorrect === true) || false
            const expanded = expandedQuestions.has(qid)

            return (
              <Collapsible key={q.id} open={expanded} onOpenChange={() => toggleQuestion(String(q.id))}>
                <CollapsibleTrigger asChild>
                  <CardHeader
                    className={cn(
                      "cursor-pointer hover:bg-muted rounded-lg px-4 py-3 transition-all",
                      isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
                    )}
                  >
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
                      <p className="text-muted-foreground mt-1 break-words">{questionText}</p>
                    </div>
                    {codeSnippet && codeSnippet.trim() !== "" && (
                      <div>
                        <span className="font-semibold mb-2 block">Code Snippet:</span>
                        <div className="rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                            customStyle={{ padding: "1rem", fontSize: "0.85rem" }}
                          >
                            {codeSnippet}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Your Answer:</span>
                      {userAnswer === null ? (
                        <div className="mt-1 p-3 bg-background border rounded-md text-muted-foreground italic">
                          Not Answered
                        </div>
                      ) : typeof userAnswer === "string" && userAnswer.includes("\n") ? (
                        <div className="mt-1 rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                            customStyle={{ fontSize: "0.85rem" }}
                          >
                            {userAnswer}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <div className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-mono text-sm break-words">
                          {userAnswer}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">Correct Answer:</span>
                      {!correctAnswer ? (
                        <div className="mt-1 p-3 bg-background border rounded-md text-muted-foreground italic">
                          Unavailable
                        </div>
                      ) : typeof correctAnswer === "string" && correctAnswer.includes("\n") ? (
                        <div className="mt-1 rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                            customStyle={{ fontSize: "0.85rem" }}
                          >
                            {correctAnswer}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <div className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-mono text-sm break-words">
                          {correctAnswer}
                        </div>
                      )}
                    </div>
                    {explanation && (
                      <div>
                        <span className="font-semibold">Explanation:</span>
                        <div className="mt-1 p-3 bg-background/60 border rounded-md whitespace-pre-wrap break-words">
                          {explanation}
                        </div>
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
