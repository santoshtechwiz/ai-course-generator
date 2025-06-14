"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, ChevronUp, Flag, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo } from "react"
import { useSelector } from "react-redux"

import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { selectQuizTitle } from "@/store"
import { selectOrGenerateQuizResults, selectQuestions, selectAnswers } from "@/store/slices/quiz-slice"
import { QuizResult } from "@/types/quiz"


interface CodeQuizResultProps {
  result?: QuizResult
  onRetake?: () => void
}

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  // Get results from Redux if not provided directly
  const reduxResults = useSelector(selectOrGenerateQuizResults)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizTitle = useSelector(selectQuizTitle)

  // Use provided result or results from Redux
  const finalResult = result || reduxResults

  // Memoize calculations to avoid recalculating on every render
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

  // Get performance level and message
  const getPerformanceLevel = () => {
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

  const performance = getPerformanceLevel()

  // Toggle functions for questions
  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAllQuestions = () => {
    if (!finalResult?.questionResults) return
    const expandedState: Record<string, boolean> = {}
    finalResult.questionResults.forEach((q) => {
      if (q.questionId) {
        expandedState[q.questionId] = true
      }
    })
    setExpandedQuestions(expandedState)
  }

  const collapseAllQuestions = () => {
    setExpandedQuestions({})
  }

  // Handle sharing results
  const handleShare = async () => {
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
      console.error("Error sharing results:", error)
      toast.error("Failed to share results")
    }
  }

  // Handle retaking the quiz
  const handleRetake = () => {
    if (onRetake) {
      onRetake()
    } else if (slug) {
      router.push(`/dashboard/code/${slug}?reset=true`)
    }
  }

  // Error state when results can't be loaded
  if (!finalResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <Flag className="h-10 w-10 text-destructive" />
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
            <RefreshCw className="w-4 h-4" />
            Take Quiz Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
            <Flag className="w-4 h-4" />
            Browse Quizzes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header with performance badge */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Flag className="w-6 h-6 text-primary" />
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

      {/* Score overview card */}
      <Card className="overflow-hidden">
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="text-4xl font-bold text-primary">
              {percentageCorrect}%
            </div>
            <div className="text-sm text-muted-foreground">
              {correctCount} of {totalCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question review section */}
      {finalResult.questionResults && finalResult.questionResults.length > 0 && (
        <Card>
          <CardContent className="space-y-4">
            {finalResult.questionResults.map((questionResult, index) => {
              if (!questionResult.questionId) return null

              const questionData =
                finalResult.questions?.find((q) => q.id?.toString() === questionResult.questionId?.toString()) ||
                questions.find((q) => q.id?.toString() === questionResult.questionId?.toString())

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
                      {/* Question content */}
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

                      {/* Answer comparison */}
                      <div className="space-y-4">
                        {/* User answer */}
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

                        {/* Correct answer (only if incorrect) */}
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
