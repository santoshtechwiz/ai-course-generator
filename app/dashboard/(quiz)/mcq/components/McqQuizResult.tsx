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
  BookOpen,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding knowledge! You've mastered this topic.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  // Error state
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load your quiz results. The session may have expired or some data might be missing.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
          <Home className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>
    )
  }

  const questions = result.questions || []
  const answers = result.answers || []
  const questionResults = result.questionResults || []
  const hasQuestionDetails = questions.length > 0 || questionResults.length > 0
  const quizSlug = result.slug || result.quizId || ""

  const performance = useMemo(() => getPerformanceLevel(result.percentage), [result.percentage])

  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const expandAll = useCallback(() => {
    if (!hasQuestionDetails) return
    const expanded: Record<string, boolean> = {}
    if (questions.length > 0) {
      questions.forEach((q) => {
        if (q?.id) expanded[q.id.toString()] = true
      })
    } else if (questionResults.length > 0) {
      questionResults.forEach((qr, index) => {
        expanded[qr.questionId?.toString() || index.toString()] = true
      })
    }
    setExpandedQuestions(expanded)
  }, [hasQuestionDetails, questions, questionResults])

  const collapseAll = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: `${result.title} - Quiz Results`,
        text: `I scored ${result.percentage}% (${performance.level}) on the ${result.title} quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
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
Date: ${new Date(result.completedAt).toLocaleString()}
Score: ${result.score}/${result.maxScore} (${result.percentage}%)
Performance: ${performance.level} ${performance.emoji}

${
  hasQuestionDetails
    ? `Detailed Results:
${(questions.length > 0 ? questions : questionResults)
  .map((item, i) => {
    let questionText, userAnswerText, correctAnswerText, isCorrect
    if (questions.length > 0) {
      const q = item
      const userAnswer = answers.find((a) => a?.questionId?.toString() === q?.id?.toString())
      isCorrect = userAnswer?.isCorrect ?? false
      questionText = q.question || q.text || `Question ${i + 1}`
      userAnswerText =
        userAnswer?.userAnswer ||
        userAnswer?.selectedOption ||
        userAnswer?.selectedOptionId ||
        userAnswer?.answer ||
        "Not answered"
      correctAnswerText = q.correctAnswer || q.answer || q.correctOptionId || "Answer unavailable"
    } else {
      const qr = item
      isCorrect = qr.isCorrect ?? false
      questionText = qr.question || qr.text || `Question ${i + 1}`
      userAnswerText = qr.userAnswer || qr.selectedOption || "Not answered"
      correctAnswerText = qr.correctAnswer || "Answer unavailable"
    }
    return `
Q${i + 1}: ${questionText}
Your answer: ${userAnswerText}
Correct answer: ${correctAnswerText}
Result: ${isCorrect ? "Correct ✓" : "Incorrect ✗"}
`
  })
  .join("\n")}`
    : "No detailed results available."
}
    `.trim()
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
  }, [result, performance, hasQuestionDetails, questions, questionResults, answers])

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{result.title}</h1>
            <Badge
              variant="secondary"
              className={`mt-2 ${performance.color} ${performance.bgColor} ${performance.borderColor}`}
            >
              {performance.emoji} {performance.level}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          Completed on {new Date(result.completedAt).toLocaleDateString()} at{" "}
          {new Date(result.completedAt).toLocaleTimeString()}
        </p>
      </div>
      {/* Score Overview */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Quiz Results</CardTitle>
                <CardDescription>Your performance summary</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{result.percentage}%</div>
              <div className="text-sm text-muted-foreground">
                {result.score} of {result.maxScore}
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
                  {result.score}/{result.maxScore} correct
                </span>
              </div>
              <Progress value={result.percentage} className="h-3" />
            </div>
            <div className={`p-4 rounded-lg border-2 ${performance.bgColor} ${performance.borderColor}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{performance.emoji}</span>
                <p className={`font-medium ${performance.color}`}>{performance.message}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-success">{result.score}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-destructive">{result.maxScore - result.score}</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary">{result.maxScore}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{Math.round((result.score / result.maxScore) * 100)}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex flex-wrap gap-3 justify-between p-4">
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/dashboard/mcq/${quizSlug}`)} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
              <Home className="w-4 h-4" />
              All Quizzes
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>
      {/* Question Review */}
      {hasQuestionDetails && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Answer Review ({questions.length > 0 ? questions.length : questionResults.length} Questions)
                </CardTitle>
                <CardDescription>Review your answers and learn from mistakes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll} className="gap-1">
                  <ChevronDown className="w-4 h-4" />
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll} className="gap-1">
                  <ChevronUp className="w-4 h-4" />
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(questions.length > 0 ? questions : questionResults).map((item, index) => {
              let questionData, answer, isCorrect, questionText, questionId
              if (questions.length > 0) {
                questionData = item
                questionId = questionData?.id?.toString() || index.toString()
                answer = answers.find(
                  (a) => a && questionData && a.questionId?.toString() === questionData.id?.toString(),
                )
                isCorrect = answer?.isCorrect || false
                questionText = questionData.question || questionData.text || `Question ${index + 1}`
              } else {
                const qr = item
                questionId = qr.questionId?.toString() || index.toString()
                questionData = qr
                answer = qr
                isCorrect = qr.isCorrect || false
                questionText = qr.question || qr.text || `Question ${index + 1}`
              }
              if (!questionData) return null
              const isExpanded = expandedQuestions[questionId]
              return (
                <Collapsible
                  key={questionId}
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionId)}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    isCorrect
                      ? "border-success/40 bg-success/5 hover:bg-success/10"
                      : "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">Question {index + 1}</h3>
                          <p className="text-muted-foreground text-sm truncate">{questionText}</p>
                        </div>
                        <Badge variant={isCorrect ? "default" : "destructive"} className="ml-2">
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 ml-2">
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
                    <div className="px-4 pb-4 space-y-4 border-t bg-card/50">
                      <div className="pt-4">
                        <h4 className="font-medium text-base mb-3">{questionText}</h4>
                        {questionData.options &&
                          Array.isArray(questionData.options) &&
                          questionData.options.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-medium text-sm mb-2">Options:</h5>
                              <div className="space-y-2">
                                {questionData.options.map((option, optIndex) => {
                                  const optionText = typeof option === "string" ? option : option.text
                                  const optionId = typeof option === "string" ? option : option.id
                                  const isUserSelected =
                                    answer?.selectedOptionId === optionId || answer?.selectedOption === optionText
                                  const isCorrectOption =
                                    questionData.correctOptionId === optionId ||
                                    questionData.correctAnswer === optionText ||
                                    questionData.answer === optionText
                                  return (
                                    <div
                                      key={optIndex}
                                      className={`p-2 rounded border text-sm ${
                                        isCorrectOption
                                          ? "bg-success/10 border-success/30 text-success-foreground"
                                          : isUserSelected
                                            ? "bg-destructive/10 border-destructive/30 text-destructive-foreground"
                                            : "bg-muted/50 border-muted"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isCorrectOption && <Check className="w-4 h-4 text-success" />}
                                        {isUserSelected && !isCorrectOption && (
                                          <X className="w-4 h-4 text-destructive" />
                                        )}
                                        <span>{optionText}</span>
                                        {isUserSelected && (
                                          <Badge variant="outline" size="sm">
                                            Your choice
                                          </Badge>
                                        )}
                                        {isCorrectOption && (
                                          <Badge variant="outline" size="sm" className="bg-success/20">
                                            Correct
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        <div className="space-y-3">
                          <div
                            className={`p-3 rounded-md border ${
                              isCorrect ? "bg-success/10 border-success/30" : "bg-muted border-muted-foreground/20"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCorrect ? "bg-success text-white" : "bg-muted-foreground/20"
                                }`}
                              >
                                Y
                              </div>
                              <span className="font-medium text-sm">Your answer:</span>
                            </div>
                            <p className="text-sm pl-7">
                              {answer?.userAnswer ||
                                answer?.selectedOption ||
                                answer?.selectedOptionId ||
                                answer?.answer ||
                                "Not answered"}
                            </p>
                          </div>
                          {!isCorrect && (
                            <div className="p-3 rounded-md bg-success/10 border border-success/30">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                                <span className="font-medium text-sm">Correct answer:</span>
                              </div>
                              <p className="text-sm pl-7">
                                {questionData.correctAnswer ||
                                  questionData.answer ||
                                  questionData.correctOptionId ||
                                  "Answer unavailable"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </CardContent>
        </Card>
      )}
      {!hasQuestionDetails && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Question Details Not Available</h3>
              <p className="text-muted-foreground">
                Your score has been recorded, but detailed question review is not available for this quiz session.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// No changes needed; ensure all quiz types use similar answer/feedback props and UI patterns.
