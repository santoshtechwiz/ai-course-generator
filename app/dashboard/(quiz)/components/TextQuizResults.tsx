"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Share2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSessionService } from "@/hooks/useSessionService"
import { NonAuthenticatedUserSignInPrompt } from "./EnhancedNonAuthenticatedUserSignInPrompt"

interface QuizResult {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  questionResults?: Array<{
    questionId: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
    question?: string
  }>
  questions?: Array<{
    id?: string | number
    question?: string
    text?: string
    answer?: string
    questionId?: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
  }>
}

interface QuizResultsProps {
  result?: QuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
  quizType: "blanks" | "openended"
}

export default function QuizResults({ result, onRetake, isAuthenticated, slug, quizType }: QuizResultsProps) {
  const router = useRouter()
  const { saveAuthRedirectState } = useSessionService()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  // Memoize calculations to avoid recalculating on every render
  const {
    correctQuestions,
    incorrectQuestions,
    correctCount,
    incorrectCount,
    totalCount,
    skippedCount,
    percentageCorrect,
  } = useMemo(() => {
    if (!result) {
      return {
        correctQuestions: [],
        incorrectQuestions: [],
        correctCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        skippedCount: 0,
        percentageCorrect: 0,
      }
    }

    const questionData = result.questionResults || result.questions || []
    const correctQuestions = questionData.filter((q) => q.isCorrect)
    const incorrectQuestions = questionData.filter((q) => !q.isCorrect)
    const correctCount = correctQuestions.length
    const incorrectCount = incorrectQuestions.length
    const totalCount = result.maxScore || questionData.length || 0
    const skippedCount = totalCount - (correctCount + incorrectCount)
    const percentageCorrect = result.percentage || Math.round((correctCount / totalCount) * 100)

    return {
      correctQuestions,
      incorrectQuestions,
      correctCount,
      incorrectCount,
      totalCount,
      skippedCount,
      percentageCorrect,
    }
  }, [result])

  // Generation functions for the score messages
  const getScoreMessage = useCallback(() => {
    if (percentageCorrect >= 90) return "Outstanding! You've mastered these concepts."
    if (percentageCorrect >= 80) return "Excellent work! Your knowledge is strong."
    if (percentageCorrect >= 70) return "Great job! Keep up the good work."
    if (percentageCorrect >= 60) return "Good effort! Keep practicing to strengthen your skills."
    if (percentageCorrect >= 50) return "You're making progress. More practice will help."
    return "Keep learning! Review the concepts and try again."
  }, [percentageCorrect])

  // Toggle a specific question's expanded state
  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  // Expand all questions
  const expandAllQuestions = useCallback(() => {
    const questionData = result?.questionResults || result?.questions || []
    const expandedState: Record<string, boolean> = {}
    questionData.forEach((q) => {
      const questionId = q.questionId || q.id
      if (questionId) {
        expandedState[questionId.toString()] = true
      }
    })
    setExpandedQuestions(expandedState)
  }, [result])

  // Collapse all questions
  const collapseAllQuestions = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  // Handle sharing results
  const handleShare = useCallback(async () => {
    if (!result) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${result.title} - Quiz Results`,
          text: `I scored ${percentageCorrect}% on the ${result.title} quiz!`,
          url: window.location.href,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
      } else {
        toast.error("Sharing not supported on this device")
      }
    } catch (error) {
      console.error("Error sharing results:", error)
      toast.error("Failed to share results")
    }
  }, [result, percentageCorrect])

  // Handle retaking the quiz
  const handleRetake = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      router.push(`/dashboard/${quizType}/${slug}?reset=true`)
    }
  }, [onRetake, router, quizType, slug])

  // Handle sign in for unauthenticated users
  const handleSignIn = useCallback(async () => {
    // Save current state for restoration after auth
    if (result) {
      saveAuthRedirectState({
        returnPath: `/dashboard/${quizType}/${slug}/results?fromAuth=true`,
        quizState: {
          slug,
          currentState: {
            results: result,
            showResults: true,
          },
        },
      })
    }

    await signIn(undefined, {
      callbackUrl: `/dashboard/${quizType}/${slug}/results?fromAuth=true`,
    })
  }, [result, slug, quizType, saveAuthRedirectState])

  // Render question content based on quiz type
  const renderQuestionContent = useCallback(
    (questionResult: any, questionData: any, userAnswer: string, correctAnswer: string) => {
      if (quizType === "blanks") {
        const questionText = questionData?.question || `Question`
        return (
          <div className="p-4 bg-card rounded-md">
            <h4
              className="font-medium mb-2"
              dangerouslySetInnerHTML={{
                __html: questionText.replace(
                  "________",
                  `<span class="px-2 py-0.5 border-b-2 border-dashed">${userAnswer}</span>`,
                ),
              }}
            />
          </div>
        )
      } else {
        // Open-ended quiz
        const questionText = questionResult.question || questionData?.question || questionData?.text || `Question`
        return (
          <div className="p-4 bg-card rounded-md">
            <h4 className="font-medium mb-2">{questionText}</h4>
          </div>
        )
      }
    },
    [quizType],
  )

  // Error state when results can't be loaded
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your quiz results properly. Some data might be missing.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleRetake}>Retake Quiz</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  // For unauthenticated users, show limited results with sign-in prompt
  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        title="Quiz Complete!"
        message="Sign in to see your detailed results, save your progress, and track your improvement over time."
        score={{ percentage: percentageCorrect }}
        resultData={result}
        handleRetake={handleRetake}
      />
    )
  }

  const questionData = result.questionResults || result.questions || []

  // Full results display for authenticated users
  return (
    <div className="space-y-8">
      {/* Score summary */}
      <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold">{result.title || "Quiz Results"}</span>
            <Badge
              variant={percentageCorrect >= 70 ? "success" : percentageCorrect >= 50 ? "warning" : "destructive"}
              className="text-base px-3 py-1"
            >
              {percentageCorrect}% Score
            </Badge>
          </CardTitle>
          <CardDescription>
            {result.completedAt && (
              <>
                Completed on {new Date(result.completedAt).toLocaleDateString()} at{" "}
                {new Date(result.completedAt).toLocaleTimeString()}
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    percentageCorrect >= 70
                      ? "hsl(var(--success))"
                      : percentageCorrect >= 50
                        ? "hsl(var(--warning))"
                        : "hsl(var(--destructive))"
                  }
                  strokeWidth="10"
                  strokeDasharray={`${percentageCorrect} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{correctCount}</span>
                <span className="text-sm text-muted-foreground">of {totalCount}</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <p className="text-xl font-medium text-center md:text-left">{getScoreMessage()}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-success">{correctCount}</span>
                  <span className="text-sm text-muted-foreground">Correct</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-destructive">{incorrectCount}</span>
                  <span className="text-sm text-muted-foreground">Incorrect</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-muted-foreground">{skippedCount}</span>
                  <span className="text-sm text-muted-foreground">Skipped</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/40 flex flex-wrap gap-3 justify-between">
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={handleRetake}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retake Quiz
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/quizzes")}>
              <Home className="w-4 h-4 mr-1" /> All Quizzes
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Question review section */}
      {questionData.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Question Review</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAllQuestions}>
                <ChevronDown className="w-4 h-4 mr-1" /> Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAllQuestions}>
                <ChevronUp className="w-4 h-4 mr-1" /> Collapse All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questionData.map((questionResult, index) => {
              const questionId = questionResult.questionId || questionResult.id
              if (!questionId) return null

              // Find the corresponding question data for blanks quiz
              const questionDataItem =
                quizType === "blanks"
                  ? result.questions?.find((q) => q.id?.toString() === questionId?.toString())
                  : null

              const isExpanded = expandedQuestions[questionId.toString()]
              const userAnswer = questionResult.userAnswer || "Not answered"
              const correctAnswer = questionResult.correctAnswer || questionDataItem?.answer || "Answer unavailable"
              const similarity = questionResult.similarity || 0

              return (
                <Collapsible
                  key={questionId}
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionId.toString())}
                  className={`border rounded-lg overflow-hidden ${
                    questionResult.isCorrect
                      ? "border-success/30 bg-success/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 ${
                          questionResult.isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {questionResult.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {quizType === "blanks"
                            ? (questionDataItem?.question || "").replace("________", "______")
                            : questionResult.question || "Question text"}
                        </p>
                        {quizType === "openended" && (
                          <p className="text-xs text-muted-foreground">Similarity: {Math.round(similarity * 100)}%</p>
                        )}
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {renderQuestionContent(questionResult, questionDataItem, userAnswer, correctAnswer)}

                      <div className="grid gap-2">
                        <div
                          className={`p-3 rounded-md ${
                            questionResult.isCorrect
                              ? "bg-success/10 border border-success/30"
                              : "bg-muted border border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {questionResult.isCorrect && <Check className="w-4 h-4 text-success" />}
                            <span className="font-medium">Your answer:</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{userAnswer}</p>
                        </div>

                        {!questionResult.isCorrect && (
                          <div className="p-3 rounded-md bg-success/10 border border-success/30">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-success" />
                              <span className="font-medium">
                                {quizType === "blanks" ? "Correct answer:" : "Expected answer:"}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap">{correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
