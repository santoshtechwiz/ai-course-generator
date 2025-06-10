"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  RefreshCw,
  Home,
  Share2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Code,
  Terminal,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo, useCallback } from "react"
import { useSelector } from "react-redux"
import { selectOrGenerateQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quiz-slice"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { QuizResult } from "./types"

interface CodeQuizResultProps {
  result?: QuizResult
  onRetake?: () => void
}

function getPerformanceLevel(percentageCorrect: number) {
  if (percentageCorrect >= 90)
    return {
      level: "Expert",
      message: "Outstanding! You've mastered these coding concepts.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    }
  if (percentageCorrect >= 80)
    return {
      level: "Advanced",
      message: "Excellent work! You have strong coding knowledge.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    }
  if (percentageCorrect >= 70)
    return {
      level: "Proficient",
      message: "Great job! Your coding skills are solid.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    }
  if (percentageCorrect >= 60)
    return {
      level: "Developing",
      message: "Good effort! Keep practicing to strengthen your skills.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    }
  if (percentageCorrect >= 50)
    return {
      level: "Learning",
      message: "You're making progress. More practice will help.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    }
  return {
    level: "Beginner",
    message: "Keep learning! Review the concepts and try again.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  }
}

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  const reduxResults = useSelector(selectOrGenerateQuizResults)
  const questions = useSelector(selectQuestions)
  const quizTitle = useSelector(selectQuizTitle)

  const finalResult = result || reduxResults

  const {
    correctQuestions,
    incorrectQuestions,
    correctCount,
    incorrectCount,
    totalCount,
    skippedCount,
    percentageCorrect,
    slug,
  } = useMemo(() => {
    if (!finalResult) {
      return {
        correctQuestions: [],
        incorrectQuestions: [],
        correctCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        skippedCount: 0,
        percentageCorrect: 0,
        slug: "",
      }
    }
    const correctQuestions = finalResult.questionResults?.filter((q) => q.isCorrect) || []
    const incorrectQuestions = finalResult.questionResults?.filter((q) => !q.isCorrect) || []
    const correctCount = correctQuestions.length
    const incorrectCount = incorrectQuestions.length
    const totalCount = finalResult.maxScore || questions.length
    const skippedCount = totalCount - (correctCount + incorrectCount)
    const percentageCorrect = finalResult.percentage || Math.round((correctCount / totalCount) * 100)
    const slug = finalResult.slug || finalResult.quizId || ""
    return {
      correctQuestions,
      incorrectQuestions,
      correctCount,
      incorrectCount,
      totalCount,
      skippedCount,
      percentageCorrect,
      slug,
    }
  }, [finalResult, questions.length])

  const performance = useMemo(() => getPerformanceLevel(percentageCorrect), [percentageCorrect])

  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const expandAllQuestions = useCallback(() => {
    if (!finalResult?.questionResults) return
    const expandedState: Record<string, boolean> = {}
    finalResult.questionResults.forEach((q) => {
      if (q.questionId) {
        expandedState[q.questionId] = true
      }
    })
    setExpandedQuestions(expandedState)
  }, [finalResult])

  const collapseAllQuestions = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  const handleShare = useCallback(async () => {
    if (!finalResult) return
    try {
      const shareData = {
        title: `${finalResult.title} - Code Quiz Results`,
        text: `I scored ${percentageCorrect}% (${performance.level}) on the ${finalResult.title} coding quiz!`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast.success("Results copied to clipboard!")
      } else {
        toast.error("Sharing not supported on this device")
      }
    } catch (error) {
      toast.error("Failed to share results")
    }
  }, [finalResult, percentageCorrect, performance.level])

  const handleRetake = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else if (slug) {
      router.push(`/dashboard/code/${slug}`)
    }
  }, [onRetake, slug, router])

  if (!finalResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load your code quiz results. The session may have expired or some data might be missing.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRetake} className="gap-2">
            <Code className="w-4 h-4" />
            Take Quiz Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
            <Home className="w-4 h-4" />
            Browse Quizzes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Code className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{finalResult.title || quizTitle || "Code Quiz Results"}</h1>
            <Badge
              variant="secondary"
              className={`mt-2 ${performance.color} ${performance.bgColor} ${performance.borderColor}`}
            >
              {performance.level} Level
            </Badge>
          </div>
        </div>
        {finalResult.completedAt && (
          <p className="text-muted-foreground">
            Completed on {new Date(finalResult.completedAt).toLocaleDateString()} at{" "}
            {new Date(finalResult.completedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Your Score</CardTitle>
                <CardDescription>Code quiz performance summary</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{percentageCorrect}%</div>
              <div className="text-sm text-muted-foreground">
                {correctCount} of {totalCount}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {correctCount}/{totalCount} correct
                </span>
              </div>
              <Progress value={percentageCorrect} className="h-2" />
            </div>
            <div className={`p-4 rounded-lg border-2 ${performance.bgColor} ${performance.borderColor}`}>
              <p className={`font-medium ${performance.color}`}>{performance.message}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-success">{correctCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{incorrectCount}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{skippedCount}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex flex-wrap gap-3 justify-between p-4">
          <div className="flex gap-2">
            <Button onClick={handleRetake} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
              <Home className="w-4 h-4" />
              All Quizzes
            </Button>
          </div>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Results
          </Button>
        </CardFooter>
      </Card>
      {finalResult.questionResults && finalResult.questionResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Code Review</CardTitle>
                  <CardDescription>Review your answers and learn from mistakes</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAllQuestions} className="gap-1">
                  <ChevronDown className="w-4 h-4" />
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAllQuestions} className="gap-1">
                  <ChevronUp className="w-4 h-4" />
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {finalResult.questionResults.map((questionResult, index) => {
              if (!questionResult.questionId) return null
              const questionData = useMemo(
                () =>
                  finalResult.questions?.find((q) => q.id?.toString() === questionResult.questionId?.toString()) ||
                  questions.find((q) => q.id?.toString() === questionResult.questionId?.toString()),
                [finalResult.questions, questions, questionResult.questionId]
              )
              if (!questionData) return null
              const isExpanded = expandedQuestions[questionResult.questionId]
              const questionText = questionData.text || questionData.question || `Question ${index + 1}`
              const userAnswer = questionResult.userAnswer || "Not answered"
              const correctAnswer =
                questionData.correctOptionId ||
                questionData.correctAnswer ||
                questionData.answer ||
                "Answer unavailable"
              return (
                <Collapsible
                  key={questionResult.questionId}
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionResult.questionId)}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    questionResult.isCorrect
                      ? "border-success/40 bg-success/5 hover:bg-success/10"
                      : "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            questionResult.isCorrect
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {questionResult.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">Question {index + 1}</h3>
                          <p className="text-muted-foreground truncate">{questionText}</p>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Review
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-6 space-y-6">
                      <div className="bg-card border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-lg">{questionText}</h4>
                        {questionData.codeSnippet && (
                          <div className="bg-slate-900 text-slate-50 rounded-lg overflow-hidden">
                            <div className="bg-slate-800 px-4 py-2 text-sm border-b border-slate-700">
                              <span className="text-slate-300">Code</span>
                            </div>
                            <pre className="p-4 text-sm font-mono overflow-x-auto">
                              <code>{questionData.codeSnippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div
                          className={`border rounded-lg p-4 ${
                            questionResult.isCorrect
                              ? "bg-success/10 border-success/30"
                              : "bg-muted border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                questionResult.isCorrect ? "bg-success text-white" : "bg-muted-foreground/20"
                              }`}
                            >
                              <span className="text-xs font-bold">Y</span>
                            </div>
                            <span className="font-semibold">Your Answer</span>
                          </div>
                          <div className="bg-card border rounded p-3 font-mono text-sm whitespace-pre-wrap">
                            {userAnswer}
                          </div>
                        </div>
                        {!questionResult.isCorrect && (
                          <div className="border border-success/30 bg-success/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center">
                                <Check className="w-4 h-4" />
                              </div>
                              <span className="font-semibold">Correct Answer</span>
                            </div>
                            <div className="bg-card border rounded p-3 font-mono text-sm whitespace-pre-wrap">
                              {correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
